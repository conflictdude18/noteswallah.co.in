"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/firebase/firebase";
import { useAuth } from "@/contexts/AuthContext";

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

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!user) {
      toast.error("You must be logged in to upload notes.");
      return;
    }

    if (!pdfFile) {
      toast.error("Please select a PDF file.");
      return;
    }

    if (!title || !noteClass || !subject || !topic) {
      toast.error("Please fill all required fields.");
      return;
    }

    if (pdfFile.type !== "application/pdf") {
      toast.error("Only PDF files are allowed.");
      return;
    }

    const maxSizeInMB = 10;
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;

    if (pdfFile.size > maxSizeInBytes) {
      toast.error("PDF size must be less than 10 MB.");
      return;
    }

    setUploading(true);

    try {
      const filePath = `notes/${user.uid}/${Date.now()}-${pdfFile.name}`;
      const storageRef = ref(storage, filePath);

      await uploadBytes(storageRef, pdfFile);
      const pdfURL = await getDownloadURL(storageRef);

      await addDoc(collection(db, "notes"), {
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
        uploaderId: user.uid,
        uploaderName: user.displayName || "Anonymous",
        uploaderEmail: user.email || "",
        uploadDate: serverTimestamp(),
        downloadsCount: 0,
        status: "pending",
      });

      toast.success("Note uploaded successfully! Waiting for admin approval.");
      router.push("/my-notes");
    } catch (err: unknown) {
      console.error("UPLOAD ERROR:", err);
      toast.error(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="container-max py-10">
      <h1 className="text-3xl font-bold">Upload Notes</h1>
      <p className="mt-2 text-white/70">
        Upload your PDF notes so other students can learn.
      </p>

      <form onSubmit={handleUpload} className="mt-8 glass-card p-8 space-y-5">
        <div>
          <label htmlFor="title" className="block text-sm text-white/80 mb-2">
            Title <span className="text-red-400">*</span>
          </label>
          <input
            id="title"
            name="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Eg: Electrostatics Complete Notes"
            className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2 outline-none focus:border-red-500"
            required
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm text-white/80 mb-2">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short description about this PDF..."
            rows={3}
            className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2 outline-none focus:border-red-500"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="class" className="block text-sm text-white/80 mb-2">
              Class <span className="text-red-400">*</span>
            </label>
            <input
              id="class"
              name="class"
              value={noteClass}
              onChange={(e) => setNoteClass(e.target.value)}
              placeholder="Eg: 12th"
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2 outline-none focus:border-red-500"
              required
            />
          </div>

          <div>
            <label htmlFor="subject" className="block text-sm text-white/80 mb-2">
              Subject <span className="text-red-400">*</span>
            </label>
            <input
              id="subject"
              name="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Eg: Physics"
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2 outline-none focus:border-red-500"
              required
            />
          </div>

          <div>
            <label htmlFor="topic" className="block text-sm text-white/80 mb-2">
              Topic <span className="text-red-400">*</span>
            </label>
            <input
              id="topic"
              name="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Eg: Current Electricity"
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2 outline-none focus:border-red-500"
              required
            />
          </div>

          <div>
            <label htmlFor="tags" className="block text-sm text-white/80 mb-2">
              Tags
            </label>
            <input
              id="tags"
              name="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Eg: cbse, boards, important"
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2 outline-none focus:border-red-500"
            />
          </div>
        </div>

        <div>
          <label htmlFor="pdf" className="block text-sm text-white/80 mb-2">
            PDF File <span className="text-red-400">*</span>
          </label>
          <input
            id="pdf"
            name="pdf"
            type="file"
            accept="application/pdf"
            onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
            className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-white/70 file:bg-red-600 file:border-0 file:px-4 file:py-2 file:rounded-lg file:text-white file:cursor-pointer"
            required
          />
        </div>

        <button
          type="submit"
          disabled={uploading}
          className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? "Uploading..." : "Upload Note"}
        </button>
      </form>
    </div>
  );
}