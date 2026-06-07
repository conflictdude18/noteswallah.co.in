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
  RefreshCw,
  ShieldCheck,
  UploadCloud,
  X,
} from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { db, storage } from "@/firebase/firebase";
import { sendFollowerUploadNotifications } from "@/lib/sendFollowerUploadNotifications";
import { updateCreatorStats } from "@/lib/updateCreatorStats";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

const boards = [
  "CBSE",
  "ICSE",
  "Maharashtra Board",
  "State Board",
  "JEE",
  "NEET",
  "CUET",
  "Other",
];

const noteTypes = [
  "Handwritten",
  "Typed",
  "Short Notes",
  "PYQ",
  "Formula Sheet",
  "Sample Paper",
  "Assignment",
  "Other",
];

function cleanText(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function makeKeywords(values: string[]) {
  const words = values
    .join(" ")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean);

  return Array.from(new Set(words));
}

export default function UploadPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [className, setClassName] = useState("");
  const [board, setBoard] = useState("CBSE");
  const [topic, setTopic] = useState("");
  const [noteType, setNoteType] = useState("Handwritten");
  const [keywordsInput, setKeywordsInput] = useState("");
  const [description, setDescription] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const generatedTags = useMemo(() => {
    const baseTags = [
      subject,
      topic,
      `class ${className}`,
      board,
      noteType,
      title,
    ]
      .map((item) => cleanText(item).toLowerCase())
      .filter((item) => item && item !== "class");

    return Array.from(new Set(baseTags));
  }, [title, subject, className, board, topic, noteType]);

  async function getPdfPageCount(file: File) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    return pdf.numPages;
  }

  async function generatePdfThumbnail(file: File) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const page = await pdf.getPage(1);

    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) return null;

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({
      canvasContext: context,
      viewport,
    } as any).promise;

    return new Promise<Blob | null>((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.85);
    });
  }

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (loading) return;

    if (!user) {
      toast.error("Please sign in before uploading notes.");
      router.push("/signin");
      return;
    }

    const finalTitle = cleanText(title);
    const finalSubject = cleanText(subject);
    const finalClass = cleanText(className);
    const finalTopic = cleanText(topic);
    const finalDescription = cleanText(description);

    if (!finalTitle || !finalSubject || !finalClass || !finalTopic) {
      toast.error("Please fill title, subject, class, and topic.");
      return;
    }

    if (!pdfFile) {
      toast.error("Please select a PDF file.");
      return;
    }

    if (pdfFile.type !== "application/pdf") {
      toast.error("Only PDF files are allowed.");
      return;
    }

    if (pdfFile.size > 15 * 1024 * 1024) {
      toast.error("PDF size should be less than 15 MB.");
      return;
    }

    try {
      setUploading(true);

      const pageCount = await getPdfPageCount(pdfFile);

      const filePath = `notes/${user.uid}/${Date.now()}-${pdfFile.name}`;
      const storageRef = ref(storage, filePath);

      await uploadBytes(storageRef, pdfFile);
      const pdfURL = await getDownloadURL(storageRef);

      let thumbnailUrl = "";

      const thumbnailBlob = await generatePdfThumbnail(pdfFile);

      if (thumbnailBlob) {
        const thumbnailPath = `thumbnails/${user.uid}/${Date.now()}-${pdfFile.name}.jpg`;
        const thumbnailRef = ref(storage, thumbnailPath);

        await uploadBytes(thumbnailRef, thumbnailBlob, {
          contentType: "image/jpeg",
        });

        thumbnailUrl = await getDownloadURL(thumbnailRef);
      }

      const manualKeywords = keywordsInput
        .split(",")
        .map((keyword) => cleanText(keyword).toLowerCase())
        .filter(Boolean);

      const searchKeywords = makeKeywords([
        finalTitle,
        finalSubject,
        finalClass,
        board,
        finalTopic,
        noteType,
        finalDescription,
        keywordsInput,
      ]);

      const finalTags = Array.from(
        new Set([...generatedTags, ...manualKeywords, ...searchKeywords])
      );

      const docRef = await addDoc(collection(db, "notes"), {
        title: finalTitle,
        subject: finalSubject,
        class: finalClass,
        board,
        topic: finalTopic,
        type: noteType,
        description: finalDescription,

        tags: finalTags,
        keywords: searchKeywords,

        pdfURL,
        thumbnailUrl,
        filePath,
        fileName: pdfFile.name,
        fileSize: pdfFile.size,
        pageCount,

        uploaderId: user.uid,
        uploaderName: user.displayName || user.email || "NotesWallah User",
        uploaderEmail: user.email || "",
        uploaderPhotoURL: user.photoURL || "",

        status: "pending",
        moderationStatus: "pending",

        downloads: 0,
        downloadsCount: 0,
        likes: 0,
        likesCount: 0,
        views: 0,
        viewsCount: 0,
        saves: 0,
        reports: 0,

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await addDoc(collection(db, "adminNotifications"), {
        type: "new_note_pending",
        title: "New note pending approval",
        message: `${user.displayName || user.email || "A user"} uploaded a note for approval.`,
        noteTitle: finalTitle,
        noteId: docRef.id,
        uploaderId: user.uid,
        uploaderName: user.displayName || "NotesWallah User",
        read: false,
        createdAt: serverTimestamp(),
      });

      try {
        await sendFollowerUploadNotifications({
          uploaderId: user.uid,
          uploaderName: user.displayName || user.email || "NotesWallah User",
          noteId: docRef.id,
          noteTitle: finalTitle,
        });
      } catch {
        console.warn("Follower notification failed.");
      }

      try {
        await updateCreatorStats(user.uid);
      } catch {
        console.warn("Creator stats update failed.");
      }

      toast.success("Notes uploaded successfully. Waiting for approval.");

      setTitle("");
      setSubject("");
      setClassName("");
      setBoard("CBSE");
      setTopic("");
      setNoteType("Handwritten");
      setKeywordsInput("");
      setDescription("");
      setPdfFile(null);

      router.push("/my-notes");
    } catch (error) {
      console.error(error);
      toast.error("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#050505] px-4 py-8 text-white">
        <div className="mx-auto flex min-h-[70vh] max-w-5xl items-center justify-center">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-white/10 bg-white/5">
              <RefreshCw className="animate-spin text-red-500" size={30} />
            </div>
            <h1 className="mt-5 text-xl font-black">Checking account</h1>
            <p className="mt-2 text-sm text-white/50">
              Preparing your upload workspace...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#050505] px-4 py-6 text-white sm:px-6 lg:px-8">
      <section className="mx-auto max-w-6xl pb-28 md:pb-10">
        <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/10 via-white/[0.04] to-red-500/10 p-5 shadow-2xl shadow-black/30 sm:p-7 lg:p-9">
          <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-red-500/20 blur-3xl" />

          <div className="relative grid gap-7 lg:grid-cols-[1fr_360px] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 text-xs font-black text-red-300">
                <UploadCloud size={16} />
                Upload Notes
              </div>

              <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                Share study material
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-6 text-white/55 sm:text-base">
                Upload clean PDF notes with accurate details so students can
                discover them through search, filters, and recommendations.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <InfoCard icon={<BookOpen size={22} />} label="Organized" />
              <InfoCard icon={<ShieldCheck size={22} />} label="Moderated" />
              <InfoCard icon={<Layers size={22} />} label="Searchable" />
            </div>
          </div>
        </div>

        <form
          onSubmit={handleUpload}
          className="mt-5 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/20 backdrop-blur-xl"
        >
          <div className="border-b border-white/10 p-5 sm:p-7">
            <h2 className="text-xl font-black">Note Details</h2>
            <p className="mt-1 text-sm text-white/45">
              Fill these fields carefully for better visibility.
            </p>
          </div>

          <div className="grid gap-5 p-5 sm:p-7 md:grid-cols-2">
            <Field label="Note Title" className="md:col-span-2">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Example: Electrostatics Full Notes"
                className="field-input"
              />
            </Field>

            <Field label="Subject">
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Physics, Chemistry, Maths..."
                className="field-input"
              />
            </Field>

            <Field label="Class">
              <input
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                placeholder="10, 11, 12, JEE, NEET..."
                className="field-input"
              />
            </Field>

            <Field label="Board / Exam">
              <select
                value={board}
                onChange={(e) => setBoard(e.target.value)}
                className="field-input"
              >
                {boards.map((item) => (
                  <option key={item} value={item} className="bg-[#050505]">
                    {item}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Note Type">
              <select
                value={noteType}
                onChange={(e) => setNoteType(e.target.value)}
                className="field-input"
              >
                {noteTypes.map((item) => (
                  <option key={item} value={item} className="bg-[#050505]">
                    {item}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Topic / Chapter" className="md:col-span-2">
              <input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Example: Ray Optics, Electrostatics, Organic Chemistry"
                className="field-input"
              />
            </Field>

            <Field label="Extra Keywords" className="md:col-span-2">
              <input
                value={keywordsInput}
                onChange={(e) => setKeywordsInput(e.target.value)}
                placeholder="Separate with commas: derivation, formula, important questions"
                className="field-input"
              />
              <p className="mt-2 text-xs text-white/40">
                These help students find your notes faster.
              </p>
            </Field>

            <Field label="Description" className="md:col-span-2">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Briefly describe what this PDF contains..."
                rows={4}
                className="field-input resize-none"
              />
            </Field>

            <Field label="PDF File" className="md:col-span-2">
              <div className="rounded-3xl border border-dashed border-white/15 bg-black/30 p-4">
                {!pdfFile ? (
                  <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-9 text-center transition hover:border-red-400/40">
                    <UploadCloud className="mb-3 text-red-300" size={36} />
                    <span className="text-sm font-black">
                      Click to select PDF
                    </span>
                    <span className="mt-1 text-xs text-white/40">
                      Maximum size: 15 MB
                    </span>
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                  </label>
                ) : (
                  <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-red-500/15 text-red-200">
                        <FileText size={22} />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold">
                          {pdfFile.name}
                        </p>
                        <p className="text-xs text-white/40">
                          {(pdfFile.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setPdfFile(null)}
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/10 bg-black/30 text-white/60 transition hover:border-red-400/40 hover:text-red-200"
                    >
                      <X size={18} />
                    </button>
                  </div>
                )}
              </div>
            </Field>
          </div>

          {generatedTags.length > 0 && (
            <div className="mx-5 mb-5 rounded-3xl border border-white/10 bg-black/25 p-4 sm:mx-7 sm:mb-7">
              <p className="mb-3 flex items-center gap-2 text-sm font-bold text-white/80">
                <CheckCircle2 size={17} className="text-red-300" />
                Auto-generated search tags
              </p>

              <div className="flex flex-wrap gap-2">
                {generatedTags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-red-400/20 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-100"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="border-t border-white/10 p-5 sm:p-7">
            <button
              type="submit"
              disabled={uploading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-4 text-sm font-black text-white shadow-xl shadow-red-500/20 transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {uploading ? (
                <RefreshCw size={19} className="animate-spin" />
              ) : (
                <UploadCloud size={19} />
              )}
              {uploading ? "Uploading..." : "Upload Notes"}
            </button>

            <p className="mt-4 text-center text-xs leading-5 text-white/40">
              Uploaded notes will appear publicly only after approval.
            </p>
          </div>
        </form>
      </section>
    </main>
  );
}

function InfoCard({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-4 text-center">
      <div className="mx-auto mb-2 flex justify-center text-red-300">{icon}</div>
      <p className="text-xs font-bold text-white/50">{label}</p>
    </div>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-sm font-bold text-white/80">
        {label}
      </span>
      {children}
    </label>
  );
}