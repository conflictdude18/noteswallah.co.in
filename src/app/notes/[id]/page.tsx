"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, increment, updateDoc } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { useAuth } from "@/contexts/AuthContext";
import type { Note } from "@/types/note";

export default function NoteDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNote() {
      setLoading(true);

      const snap = await getDoc(doc(db, "notes", id));

      if (!snap.exists()) {
        setNote(null);
        setLoading(false);
        return;
      }

      setNote({ id: snap.id, ...(snap.data() as Omit<Note, "id">) });
      setLoading(false);
    }

    fetchNote();
  }, [id]);

  async function handleDownload() {
    if (!note?.id) return;

    if (!user) {
      router.push("/signin");
      return;
    }

    await updateDoc(doc(db, "notes", note.id), {
      downloadsCount: increment(1),
    });

    window.open(note.pdfURL, "_blank");
  }

  if (loading) return <p className="p-10">Loading...</p>;

  if (!note) {
    return (
      <div className="container-max py-10">
        <h1 className="text-2xl font-bold">Note not found</h1>
        <button onClick={() => router.push("/browse")} className="btn-primary mt-6">
          Back to Browse
        </button>
      </div>
    );
  }

  return (
    <div className="container-max py-10">
      <button
        onClick={() => router.push("/browse")}
        className="text-white/60 hover:text-white text-sm"
      >
        ← Back to Browse
      </button>

      <div className="mt-6 glass-card p-8">
        <h1 className="text-3xl font-bold">{note.title}</h1>
        <p className="mt-3 text-white/70">{note.description}</p>

        <div className="mt-6 grid gap-3 text-sm text-white/70 md:grid-cols-2">
          <p>
            <span className="text-white/90 font-medium">Class:</span>{" "}
            {note.class}
          </p>
          <p>
            <span className="text-white/90 font-medium">Subject:</span>{" "}
            {note.subject}
          </p>
          <p>
            <span className="text-white/90 font-medium">Topic:</span>{" "}
            {note.topic}
          </p>
          <p>
            <span className="text-white/90 font-medium">Downloads:</span>{" "}
            {note.downloadsCount ?? 0}
          </p>
        </div>

        {note.tags?.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {note.tags.map((tag, i) => (
              <span
                key={i}
                className="text-xs px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/70"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button onClick={handleDownload} className="btn-primary">
            {user ? "Download PDF" : "Login to Download"}
          </button>

          <a
            href={note.pdfURL}
            target="_blank"
            rel="noreferrer"
            className="btn-secondary text-center"
          >
            Preview PDF
          </a>
        </div>

        <p className="mt-6 text-xs text-white/40">
          Uploaded by: {note.uploaderName} ({note.uploaderEmail})
        </p>
      </div>
    </div>
  );
}