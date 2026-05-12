"use client";

import type React from "react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import * as pdfjsLib from "pdfjs-dist";
import {
  BookOpen,
  CheckCircle2,
  FileText,
  Layers,
  Loader2,
  ShieldCheck,
  UploadCloud,
  X,
} from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { db, storage } from "@/firebase/firebase";
import { sendFollowerUploadNotifications } from "@/lib/sendFollowerUploadNotifications";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
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

  const tagList = useMemo(
    () =>
      tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    [tags]
  );

  if (!loading && !user) {
    router.push("/signin");
    return null;
  }

  async function generateThumbnail(file: File): Promise<Blob> {
    const fileReader = new FileReader();

    return new Promise((resolve, reject) => {
      fileReader.onload = async () => {
        try {
          const typedArray = new Uint8Array(fileReader.result as ArrayBuffer);
          const pdf = await pdfjsLib.getDocument(typedArray).promise;
          const page = await pdf.getPage(1);
          const viewport = page.getViewport({ scale: 1.5 });

          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");

          if (!context) {
            reject(new Error("Canvas context error"));
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
              if (blob) resolve(blob);
              else reject(new Error("Thumbnail generation failed"));
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

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!user) {
      toast.error("You must be logged in.");
      return;
    }

    if (!pdfFile) {
      toast.error("Please select a PDF.");
      return;
    }

    if (!title.trim() || !noteClass.trim() || !subject.trim() || !topic.trim()) {
      toast.error("Fill all required fields.");
      return;
    }

    if (pdfFile.type !== "application/pdf") {
      toast.error("Only PDF files allowed.");
      return;
    }

    if (pdfFile.size > 10 * 1024 * 1024) {
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
        tags: tagList,
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
      toast.error(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  const canSubmit =
    Boolean(pdfFile) &&
    Boolean(title.trim()) &&
    Boolean(noteClass.trim()) &&
    Boolean(subject.trim()) &&
    Boolean(topic.trim()) &&
    !uploading;

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#050505] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl pb-52 md:pb-10">
        <section className="relative max-w-full overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/10 via-white/[0.04] to-red-500/10 p-5 shadow-2xl shadow-black/30 sm:p-7 lg:p-9">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-red-500/20 blur-3xl" />

          <div className="relative max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 text-xs font-black text-red-300">
              <UploadCloud size={16} />
              Upload Study Notes
            </div>

            <h1 className="mt-5 text-3xl font-black leading-tight sm:text-5xl lg:text-6xl">
              Help students
              <span className="block text-red-500">learn faster</span>
            </h1>

            <p className="mt-4 text-sm leading-6 text-white/55 sm:text-base">
              Upload PDFs, assignments, handwritten notes and revision sheets to
              help other students study better.
            </p>

            <div className="mt-6 flex flex-wrap gap-2 overflow-hidden pb-1">
              <TopBadge text="Fast Uploads" />
              <TopBadge text="Secure Storage" />
              <TopBadge text="Community Driven" />
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[1fr_380px]">
          <form
            id="upload-note-form"
            onSubmit={handleUpload}
            className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-7 lg:p-8"
          >
            <div className="mb-6">
              <h2 className="text-2xl font-black">Create Upload</h2>
              <p className="mt-1 text-sm leading-6 text-white/50">
                Add a PDF first, then fill details students can easily search.
              </p>
            </div>

            <div className="grid gap-5">
              <div className="rounded-[1.8rem] border border-dashed border-red-500/25 bg-red-500/[0.05] p-5 transition sm:p-6">
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 text-red-300">
                    <UploadCloud size={28} />
                  </div>

                  <h3 className="mt-4 text-lg font-black">Upload PDF File</h3>

                  <p className="mt-2 max-w-md text-sm leading-6 text-white/45">
                    PDF only. Maximum size: 10MB.
                  </p>

                  <label className="mt-5 flex cursor-pointer items-center justify-center rounded-2xl bg-red-600 px-6 py-4 text-sm font-black text-white transition hover:bg-red-500">
                    Choose PDF
                    <input
                      title="Upload PDF File"
                      aria-label="Upload PDF File"
                      type="file"
                      accept="application/pdf"
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setPdfFile(e.target.files?.[0] || null)
                      }
                      className="hidden"
                      required
                    />
                  </label>

                  {pdfFile && (
                    <div className="mt-5 flex w-full min-w-0 items-center justify-between gap-3 overflow-hidden rounded-2xl border border-white/10 bg-black/30 px-3 py-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="rounded-xl bg-red-500/10 p-2 text-red-300">
                          <FileText size={18} />
                        </div>

                        <div className="min-w-0 text-left">
                          <p className="max-w-[210px] truncate text-sm font-bold sm:max-w-none">
                            {pdfFile.name}
                          </p>
                          <p className="text-xs text-white/45">
                            {(pdfFile.size / (1024 * 1024)).toFixed(2)} MB
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        title="Remove selected PDF"
                        aria-label="Remove selected PDF"
                        onClick={() => setPdfFile(null)}
                        className="shrink-0 rounded-xl p-2 text-white/45 transition hover:bg-white/10 hover:text-white"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <InputField
                label="Title *"
                icon={<FileText size={18} />}
                value={title}
                onChange={setTitle}
                placeholder="Class 12 Matrix Notes"
              />

              <div>
                <label className="mb-2 block text-sm font-bold text-white/75">
                  Description
                </label>

                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Short description..."
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-5 py-4 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-red-500"
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <InputField
                  label="Class *"
                  icon={<Layers size={18} />}
                  value={noteClass}
                  onChange={setNoteClass}
                  placeholder="12th"
                />

                <InputField
                  label="Subject *"
                  icon={<BookOpen size={18} />}
                  value={subject}
                  onChange={setSubject}
                  placeholder="Physics"
                />

                <InputField
                  label="Topic *"
                  icon={<FileText size={18} />}
                  value={topic}
                  onChange={setTopic}
                  placeholder="Current Electricity"
                />

                <InputField
                  label="Tags"
                  icon={<Layers size={18} />}
                  value={tags}
                  onChange={setTags}
                  placeholder="cbse, boards, jee"
                />
              </div>

              {tagList.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tagList.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs font-bold text-white/70"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              <button
                type="submit"
                disabled={!canSubmit}
                className="hidden w-full items-center justify-center gap-2 rounded-2xl bg-red-600 px-6 py-4 text-sm font-black text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50 md:flex"
              >
                {uploading && <Loader2 size={18} className="animate-spin" />}
                {uploading ? "Uploading..." : "Upload Note"}
              </button>
            </div>
          </form>

          <aside className="space-y-5">
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-green-500/10 p-3 text-green-400">
                  <CheckCircle2 size={22} />
                </div>

                <div>
                  <h3 className="font-black">Upload Guidelines</h3>
                  <p className="text-sm text-white/45">
                    Keep uploads clean and useful.
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <Guideline text="Only upload educational PDFs." />
                <Guideline text="Avoid blurred or low-quality scans." />
                <Guideline text="Add proper titles and subjects." />
                <Guideline text="Do not upload copyrighted books." />
              </div>
            </div>

            <div className="rounded-[2rem] border border-green-500/20 bg-green-500/5 p-5 sm:p-6">
              <div className="flex items-center gap-2 text-sm font-black text-green-400">
                <ShieldCheck size={18} />
                Safe & Moderated
              </div>

              <p className="mt-3 text-sm leading-6 text-white/55">
                Every uploaded note is reviewed before appearing publicly on
                NotesWallah.
              </p>
            </div>
          </aside>
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 w-screen overflow-hidden border-t border-white/10 bg-[#050505]/95 px-4 pb-5 pt-3 backdrop-blur-xl md:hidden">
        <button
          type="submit"
          form="upload-note-form"
          disabled={!canSubmit}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-red-600 text-sm font-black text-white shadow-lg shadow-red-600/25 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {uploading && <Loader2 size={18} className="animate-spin" />}
          {uploading ? "Uploading..." : "Upload Note"}
        </button>
      </div>
    </main>
  );
}

function InputField({
  label,
  icon,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-white/75">
        {label}
      </label>

      <div className="relative">
        <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/35">
          {icon}
        </div>

        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-2xl border border-white/10 bg-black/30 px-5 py-4 pl-12 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-red-500"
          required={label.includes("*")}
        />
      </div>
    </div>
  );
}

function TopBadge({ text }: { text: string }) {
  return (
    <div className="max-w-full rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-[11px] font-bold text-white/70 sm:px-4 sm:text-xs">
      {text}
    </div>
  );
}

function Guideline({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-2 h-2 w-2 rounded-full bg-red-400" />
      <p className="text-sm leading-6 text-white/60">{text}</p>
    </div>
  );
}