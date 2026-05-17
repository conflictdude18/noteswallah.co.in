"use client";

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

    const maxSize = 15 * 1024 * 1024;

    if (pdfFile.size > maxSize) {
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
        likes: 0,
        views: 0,
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

      await addDoc(collection(db, "adminNotifications"), {
        type: "new_note_pending",
        title: "New note pending approval",
        message: `${user.displayName || user.email || "A user"} uploaded a note for approval.`,
        noteTitle: title,
        uploaderId: user.uid,
        uploaderName: user.displayName || "NotesWallah User",
        read: false,
        createdAt: serverTimestamp(),
      });

      await addDoc(collection(db, "adminNotifications"), {
        type: "new_note_pending",
        title: "New note pending approval",
        message: `${user.displayName || user.email || "A user"} uploaded a note for approval.`,
        noteTitle: title,
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
      <main className="min-h-screen bg-[#050607] px-4 py-10 text-white">
        <div className="mx-auto max-w-4xl rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center">
          <p className="text-sm text-white/60">Checking your account...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050607] px-4 py-6 text-white sm:px-6 lg:px-8">
      <section className="mx-auto max-w-5xl">
        <div className="mb-8 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/30 md:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-red-400/20 bg-red-500/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.25em] text-red-200">
                <UploadCloud size={15} />
                Upload Notes
              </div>

              <h1 className="text-3xl font-black tracking-tight md:text-5xl">
                Share useful study material.
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60 md:text-base">
                Upload clean PDF notes with proper details so students can find
                them through search, filters, and recommendations.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <BookOpen className="mx-auto mb-2 text-red-300" size={22} />
                <p className="text-xs text-white/50">Organized</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <ShieldCheck className="mx-auto mb-2 text-red-300" size={22} />
                <p className="text-xs text-white/50">Moderated</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <Layers className="mx-auto mb-2 text-red-300" size={22} />
                <p className="text-xs text-white/50">Searchable</p>
              </div>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleUpload}
          className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/30 md:p-8"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-bold text-white/80">
                Note Title
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Example: Electrostatics Full Notes"
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none transition placeholder:text-white/30 focus:border-red-400/60"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-white/80">
                Subject
              </label>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Physics, Chemistry, Maths..."
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none transition placeholder:text-white/30 focus:border-red-400/60"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-white/80">
                Class
              </label>
              <input
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                placeholder="10, 11, 12, JEE, NEET..."
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none transition placeholder:text-white/30 focus:border-red-400/60"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-white/80">
                Board / Exam
              </label>
              <select
                value={board}
                onChange={(e) => setBoard(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none transition focus:border-red-400/60"
              >
                {boards.map((item) => (
                  <option key={item} value={item} className="bg-[#050607]">
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-white/80">
                Note Type
              </label>
              <select
                value={noteType}
                onChange={(e) => setNoteType(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none transition focus:border-red-400/60"
              >
                {noteTypes.map((item) => (
                  <option key={item} value={item} className="bg-[#050607]">
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-bold text-white/80">
                Topic / Chapter
              </label>
              <input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Example: Ray Optics, Electrostatics, Organic Chemistry"
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none transition placeholder:text-white/30 focus:border-red-400/60"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-bold text-white/80">
                Extra Keywords
              </label>
              <input
                value={keywordsInput}
                onChange={(e) => setKeywordsInput(e.target.value)}
                placeholder="Separate with commas: derivation, formula, important questions"
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none transition placeholder:text-white/30 focus:border-red-400/60"
              />
              <p className="mt-2 text-xs text-white/40">
                These help students find your notes faster.
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-bold text-white/80">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Briefly describe what this PDF contains..."
                rows={4}
                className="w-full resize-none rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none transition placeholder:text-white/30 focus:border-red-400/60"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-bold text-white/80">
                PDF File
              </label>

              <div className="rounded-3xl border border-dashed border-white/15 bg-black/30 p-5">
                {!pdfFile ? (
                  <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-8 text-center transition hover:border-red-400/40">
                    <UploadCloud className="mb-3 text-red-300" size={34} />
                    <span className="text-sm font-bold">
                      Click to select PDF
                    </span>
                    <span className="mt-1 text-xs text-white/40">
                      Maximum size: 15 MB
                    </span>
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={(e) =>
                        setPdfFile(e.target.files?.[0] || null)
                      }
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
            </div>
          </div>

          {generatedTags.length > 0 && (
            <div className="mt-6 rounded-3xl border border-white/10 bg-black/25 p-4">
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

          <button
            type="submit"
            disabled={uploading}
            className="mt-7 flex w-full items-center justify-center gap-2 rounded-2xl bg-red-500 px-5 py-4 text-sm font-black text-white shadow-xl shadow-red-500/20 transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <UploadCloud size={19} />
            {uploading ? "Uploading..." : "Upload Notes"}
          </button>

          <p className="mt-4 text-center text-xs leading-5 text-white/40">
            Uploaded notes will appear publicly only after approval.
          </p>
        </form>
      </section>
    </main>
  );
}