"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";

import {
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";

import * as pdfjsLib from "pdfjs-dist";

import { db, storage } from "@/firebase/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { sendFollowerUploadNotifications } from "@/lib/sendFollowerUploadNotifications";

pdfjsLib.GlobalWorkerOptions.workerSrc =
  new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();

export default function UploadPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [noteClass, setNoteClass] = useState("");
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [tags, setTags] = useState("");

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  if (!loading && !user) {
    router.push("/signin");
    return null;
  }

  async function generateThumbnail(file: File): Promise<Blob> {
    const fileReader = new FileReader();

    return new Promise((resolve, reject) => {
      fileReader.onload = async () => {
        try {
          const typedArray = new Uint8Array(
            fileReader.result as ArrayBuffer
          );

          const pdf = await pdfjsLib.getDocument(typedArray).promise;
          const page = await pdf.getPage(1);

          const viewport = page.getViewport({
            scale: 1.5,
          });

          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");

          if (!context) {
            reject("Canvas context error");
            return;
          }

          canvas.width = viewport.width;
          canvas.height = viewport.height;

          await page.render({
            canvasContext: context,
            viewport,
          } as Parameters<typeof page.render>[0]).promise;

          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject("Thumbnail generation failed");
              }
            },
            "image/jpeg",
            0.9
          );
        } catch (err) {
          reject(err);
        }
      };

      fileReader.onerror = reject;
      fileReader.readAsArrayBuffer(file);
    });
  }

  async function handleUpload(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (!user) {
      toast.error("You must be logged in.");
      return;
    }

    if (!pdfFile) {
      toast.error("Please select a PDF.");
      return;
    }

    if (!title || !noteClass || !subject || !topic) {
      toast.error("Fill all required fields.");
      return;
    }

    if (pdfFile.type !== "application/pdf") {
      toast.error("Only PDF files allowed.");
      return;
    }

    const maxSizeInMB = 10;
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;

    if (pdfFile.size > maxSizeInBytes) {
      toast.error("PDF must be under 10MB.");
      return;
    }

    setUploading(true);

    try {
      const createdAt = Date.now();

      const pdfPath = `notes/${user.uid}/${createdAt}-${pdfFile.name}`;
      const pdfRef = ref(storage, pdfPath);

      await uploadBytes(pdfRef, pdfFile);

      const pdfURL = await getDownloadURL(pdfRef);

      const thumbnailBlob = await generateThumbnail(pdfFile);

      const thumbPath = `thumbnails/${user.uid}/${createdAt}.jpg`;
      const thumbRef = ref(storage, thumbPath);

      await uploadBytes(thumbRef, thumbnailBlob);

      const thumbnailUrl = await getDownloadURL(thumbRef);

      const newNote = await addDoc(collection(db, "notes"), {
        title: title.trim(),
        description: description.trim(),
        class: noteClass.trim(),
        subject: subject.trim(),
        topic: topic.trim(),

        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),

        pdfURL,
        thumbnailUrl,

        uploaderId: user.uid,
        uploaderName: user.displayName || "Anonymous",
        uploaderEmail: user.email || "",

        uploadDate: serverTimestamp(),
        createdAt: new Date().toISOString(),

        downloadsCount: 0,
        status: "pending",
      });

      await sendFollowerUploadNotifications({
        uploaderId: user.uid,
        uploaderName: user.displayName || user.email || "Someone you follow",
        noteId: newNote.id,
        noteTitle: title.trim(),
      });

      toast.success("Note uploaded successfully!");

      router.push("/my-notes");
    } catch (err: unknown) {
      console.error("UPLOAD ERROR:", err);

      toast.error(
        err instanceof Error ? err.message : "Upload failed."
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <div className="container-max py-12">
        <div className="max-w-3xl">
          <div className="mb-4 inline-flex rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm text-red-400">
            Upload Study Notes
          </div>

          <h1 className="text-5xl font-black">
            Share Knowledge
            <span className="block text-red-500">
              With Students
            </span>
          </h1>

          <p className="mt-5 text-lg text-white/60">
            Upload PDFs, assignments, handwritten notes and revision
            sheets to help students learn.
          </p>
        </div>

        <form
          onSubmit={handleUpload}
          className="mt-12 rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl"
        >
          <div className="grid gap-6">
            <div>
              <label className="mb-2 block text-sm text-white/70">
                Title *
              </label>

              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Electrostatics Complete Notes"
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-5 py-3 outline-none transition focus:border-red-500"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-white/70">
                Description
              </label>

              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Short description..."
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-5 py-3 outline-none transition focus:border-red-500"
              />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm text-white/70">
                  Class *
                </label>

                <input
                  value={noteClass}
                  onChange={(e) => setNoteClass(e.target.value)}
                  placeholder="12th"
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-5 py-3 outline-none transition focus:border-red-500"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/70">
                  Subject *
                </label>

                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Physics"
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-5 py-3 outline-none transition focus:border-red-500"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/70">
                  Topic *
                </label>

                <input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Current Electricity"
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-5 py-3 outline-none transition focus:border-red-500"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/70">
                  Tags
                </label>

                <input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="cbse, boards, jee"
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-5 py-3 outline-none transition focus:border-red-500"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm text-white/70">
                PDF File *
              </label>

              <input
                title="Upload PDF File"
                aria-label="Upload PDF File"
                type="file"
                accept="application/pdf"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setPdfFile(e.target.files?.[0] || null)
                }
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-5 py-3 text-white/70 file:mr-4 file:rounded-xl file:border-0 file:bg-red-600 file:px-4 file:py-2 file:text-white"
                required
              />
            </div>

            <button
              type="submit"
              disabled={uploading}
              className="mt-4 rounded-2xl bg-red-600 px-6 py-4 font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {uploading ? "Uploading..." : "Upload Note"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}