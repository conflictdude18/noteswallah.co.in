"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { db, storage } from "@/firebase/firebase";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { deleteObject, ref } from "firebase/storage";
import type { Note } from "@/types/note";

export default function MyNotesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [notes, setNotes] = useState<Note[]>([]);
  const [fetching, setFetching] = useState(true);

  async function fetchMyNotes() {
    if (!user) return;

    setFetching(true);

    const q = query(collection(db, "notes"), where("uploaderId", "==", user.uid));
    const snap = await getDocs(q);

    const data: Note[] = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<Note, "id">),
    }));

    setNotes(data);
    setFetching(false);
  }

  async function handleDelete(note: Note) {
    if (!note.id) return;

    const confirmDelete = confirm("Are you sure you want to delete this note?");
    if (!confirmDelete) return;

    try {
      // delete firestore doc
      await deleteDoc(doc(db, "notes", note.id));

      // delete pdf from storage
      // pdfURL contains full URL so we extract storage path
      const decodedURL = decodeURIComponent(note.pdfURL);
      const match = decodedURL.match(/\/o\/(.*?)\?/);

      if (match && match[1]) {
        const filePath = match[1];
        await deleteObject(ref(storage, filePath));
      }

      fetchMyNotes();
    } catch (err) {
      console.error("DELETE ERROR:", err);
      alert("Failed to delete note.");
    }
  }

  useEffect(() => {
    if (!loading && !user) {
      router.push("/signin");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) fetchMyNotes();
  }, [user]);

  if (loading || fetching) {
    return <p className="p-10">Loading...</p>;
  }

  return (
    <div className="container-max py-10">
      <h1 className="text-3xl font-bold">My Notes</h1>
      <p className="mt-2 text-white/70">
        Manage notes you uploaded.
      </p>

      {notes.length === 0 && (
        <p className="mt-10 text-white/60">
          You have not uploaded any notes yet.
        </p>
      )}

      <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {notes.map((note) => (
          <div key={note.id} className="glass-card p-6">
            <h2 className="text-lg font-semibold">{note.title}</h2>
            <p className="mt-2 text-sm text-white/60 line-clamp-2">
              {note.description}
            </p>

            <div className="mt-4 text-xs text-white/50 space-y-1">
              <p>
                <span className="text-white/70">Class:</span> {note.class}
              </p>
              <p>
                <span className="text-white/70">Subject:</span> {note.subject}
              </p>
              <p>
                <span className="text-white/70">Topic:</span> {note.topic}
              </p>
              <p>
                <span className="text-white/70">Status:</span>{" "}
                <span className="text-red-400">{note.status}</span>
              </p>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <a
                href={note.pdfURL}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary text-xs px-4 py-2"
              >
                View
              </a>

              <button
                onClick={() => handleDelete(note)}
                className="text-xs px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 transition text-white"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}