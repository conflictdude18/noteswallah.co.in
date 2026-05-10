"use client";

import { useMemo, useState } from "react";
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

<<<<<<< HEAD
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
=======
  const tagList = useMemo(() => {
    return tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }, [tags]);
>>>>>>> d0d6b77 (ANSHUL commit)

  if (!loading && !user) {
    router.push("/signin");
    return null;
  }

  async function generateThumbnail(file: File): Promise<Blob> {
    const fileReader = new FileReader();

    return new Promise((resolve, reject) => {
      fileReader.onload = async () => {
        try {
<<<<<<< HEAD
          const typedArray = new Uint8Array(
            fileReader.result as ArrayBuffer
          );

          const pdf = await pdfjsLib.getDocument(typedArray).promise;
          const page = await pdf.getPage(1);

          const viewport = page.getViewport({
            scale: 1.5,
          });

=======
          const typedArray = new Uint8Array(fileReader.result as ArrayBuffer);
          const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;
          const page = await pdf.getPage(1);

          const viewport = page.getViewport({ scale: 1.5 });
>>>>>>> d0d6b77 (ANSHUL commit)
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
<<<<<<< HEAD
          } as Parameters<typeof page.render>[0]).promise;

          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject("Thumbnail generation failed");
              }
=======
          }).promise;

          canvas.toBlob(
            (blob) => {
              if (blob) resolve(blob);
              else reject(new Error("Thumbnail generation failed"));
>>>>>>> d0d6b77 (ANSHUL commit)
            },
            "image/jpeg",
            0.9
          );
        } catch (err) {
          reject(err);
        }
      };

<<<<<<< HEAD
      fileReader.onerror = reject;
=======
      fileReader.onerror = () => reject(new Error("Could not read PDF file."));
>>>>>>> d0d6b77 (ANSHUL commit)
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
<<<<<<< HEAD
      const createdAt = Date.now();

      const pdfPath = `notes/${user.uid}/${createdAt}-${pdfFile.name}`;
=======
      const safeFileName = pdfFile.name.replaceAll("/", "-");
      const pdfPath = `notes/${user.uid}/${Date.now()}-${safeFileName}`;
>>>>>>> d0d6b77 (ANSHUL commit)
      const pdfRef = ref(storage, pdfPath);

      await uploadBytes(pdfRef, pdfFile);

      const pdfURL = await getDownloadURL(pdfRef);

      const thumbnailBlob = await generateThumbnail(pdfFile);
<<<<<<< HEAD

      const thumbPath = `thumbnails/${user.uid}/${createdAt}.jpg`;
=======
      const thumbPath = `thumbnails/${user.uid}/${Date.now()}.jpg`;
>>>>>>> d0d6b77 (ANSHUL commit)
      const thumbRef = ref(storage, thumbPath);

      await uploadBytes(thumbRef, thumbnailBlob);

      const thumbnailUrl = await getDownloadURL(thumbRef);

<<<<<<< HEAD
      const newNote = await addDoc(collection(db, "notes"), {
=======
      await addDoc(collection(db, "notes"), {
>>>>>>> d0d6b77 (ANSHUL commit)
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
<<<<<<< HEAD
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
=======
        createdAt: serverTimestamp(),
        downloadsCount: 0,
        likesCount: 0,
        viewsCount: 0,
        status: "pending",
      });

      toast.success("Note uploaded successfully!");
      router.push("/my-notes");
    } catch (err: unknown) {
      console.error("UPLOAD ERROR:", err);
      toast.error(err instanceof Error ? err.message : "Upload failed.");
>>>>>>> d0d6b77 (ANSHUL commit)
    } finally {
      setUploading(false);
    }
  }

  return (
    <main className="space-y-8 pb-24">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#07090d] p-6 shadow-card md:p-10">
        <div className="absolute right-[-100px] top-[-100px] h-[260px] w-[260px] rounded-full bg-red-500/20 blur-[120px]" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-300">
            <UploadCloud size={16} />
            Upload Study Notes
          </div>

          <h1 className="mt-6 text-4xl font-black leading-tight text-white md:text-6xl">
            Help Students
            <span className="block text-[#ff2d3d]">Learn Faster</span>
          </h1>

<<<<<<< HEAD
          <p className="mt-5 text-lg text-white/60">
            Upload PDFs, assignments, handwritten notes and revision
            sheets to help students learn.
=======
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/60 md:text-lg">
            Upload your notes, assignments, handwritten PDFs and study material
            to help students on NotesWallah.
>>>>>>> d0d6b77 (ANSHUL commit)
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <TopBadge text="Fast Uploads" />
            <TopBadge text="Secure Storage" />
            <TopBadge text="Community Driven" />
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <form
          onSubmit={handleUpload}
          className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-card backdrop-blur-xl md:p-8"
        >
<<<<<<< HEAD
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
=======
          <div className="mb-8 flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-300">
              <Sparkles size={26} />
>>>>>>> d0d6b77 (ANSHUL commit)
            </div>

            <div>
              <h2 className="text-2xl font-black text-white">Note Details</h2>

              <p className="mt-1 text-sm text-white/50">
                Add accurate information so students can discover your notes.
              </p>
            </div>
          </div>

          <div className="grid gap-6">
            <InputField
              label="Title *"
              icon={<FileText size={18} />}
              value={title}
              onChange={setTitle}
              placeholder="Class 12th Matrix Notes"
            />

            <div>
              <label className="mb-2 block text-sm font-medium text-white/75">
                Description
              </label>

              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
<<<<<<< HEAD
                rows={4}
                placeholder="Short description..."
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-5 py-3 outline-none transition focus:border-red-500"
=======
                rows={5}
                placeholder="Describe your notes..."
                className="nw-input min-h-[140px] resize-none"
>>>>>>> d0d6b77 (ANSHUL commit)
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

<<<<<<< HEAD
                <input
                  value={noteClass}
                  onChange={(e) => setNoteClass(e.target.value)}
                  placeholder="12th"
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-5 py-3 outline-none transition focus:border-red-500"
                  required
                />
              </div>
=======
              <InputField
                label="Subject *"
                icon={<Hash size={18} />}
                value={subject}
                onChange={setSubject}
                placeholder="Mathematics"
              />
>>>>>>> d0d6b77 (ANSHUL commit)

              <InputField
                label="Topic *"
                icon={<BookOpen size={18} />}
                value={topic}
                onChange={setTopic}
                placeholder="Matrices"
              />

<<<<<<< HEAD
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
=======
              <InputField
                label="Tags"
                icon={<Tag size={18} />}
                value={tags}
                onChange={setTags}
                placeholder="cbse, boards, jee"
>>>>>>> d0d6b77 (ANSHUL commit)
              />
            </div>

            <div className="rounded-[1.8rem] border border-dashed border-white/15 bg-black/20 p-6 transition hover:border-red-500/40">
              <div className="flex flex-col items-center justify-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 text-red-300">
                  <UploadCloud size={28} />
                </div>

                <h3 className="mt-4 text-lg font-black text-white">
                  Upload PDF File
                </h3>

                <p className="mt-2 max-w-md text-sm leading-6 text-white/45">
                  Upload study notes in PDF format. Maximum size: 10MB.
                </p>

                <label className="mt-5 cursor-pointer rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-3 text-sm font-medium text-white transition hover:bg-white/[0.08]">
                  Choose PDF
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                    className="hidden"
                    required
                  />
                </label>

                {pdfFile && (
                  <div className="mt-5 flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="rounded-xl bg-red-500/10 p-2 text-red-300">
                        <FileText size={18} />
                      </div>

                      <div className="min-w-0 text-left">
                        <p className="truncate text-sm font-medium text-white">
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
                    className="rounded-xl p-2 text-white/45 transition hover:bg-white/10 hover:text-white"
                  >
                    <X size={16} />
                  </button>
                  </div>
                )}
              </div>
            </div>

            {tagList.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tagList.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs font-medium text-white/70"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            <button
              type="submit"
              disabled={uploading}
              className="btn-primary mt-2 w-full py-4 disabled:cursor-not-allowed disabled:opacity-50"
            >
<<<<<<< HEAD
=======
              {uploading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <UploadCloud size={18} />
              )}

>>>>>>> d0d6b77 (ANSHUL commit)
              {uploading ? "Uploading..." : "Upload Note"}
            </button>
          </div>
        </form>

        <aside className="space-y-5">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-card backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-green-500/10 p-3 text-green-400">
                <CheckCircle2 size={22} />
              </div>

              <div>
                <h3 className="font-black text-white">Upload Guidelines</h3>
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

          <div className="rounded-[2rem] border border-green-500/20 bg-green-500/5 p-6">
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
      <label className="mb-2 block text-sm font-medium text-white/75">
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
          className="nw-input input-icon-left"
          required={label.includes("*")}
        />
      </div>
    </div>
  );
}

function TopBadge({ text }: { text: string }) {
  return (
    <div className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white/70">
      {text}
    </div>
  );
}

function Guideline({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-1 h-2 w-2 rounded-full bg-red-400" />

      <p className="text-sm leading-6 text-white/60">{text}</p>
    </div>
  );
}