"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/firebase/firebase";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
} from "firebase/firestore";
import type { Note } from "@/types/note";

type UserDoc = {
  role: string;
  email: string;
  name: string;
};

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);

  const [notes, setNotes] = useState<Note[]>([]);
  const [fetching, setFetching] = useState(true);

  // check admin role
  useEffect(() => {
    async function checkAdmin() {
      if (!user) return;

      setChecking(true);

      const snap = await getDoc(doc(db, "users", user.uid));

      if (snap.exists()) {
        const data = snap.data() as UserDoc;
        setIsAdmin(data.role === "admin");
      }

      setChecking(false);
    }

    if (!loading && !user) router.push("/signin");
    if (user) checkAdmin();
  }, [user, loading, router]);

  async function fetchPendingNotes() {
    setFetching(true);

    const q = query(collection(db, "notes"), where("status", "==", "pending"));
    const snap = await getDocs(q);

    const data: Note[] = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<Note, "id">),
    }));

    setNotes(data);
    setFetching(false);
  }

  useEffect(() => {
    if (isAdmin) fetchPendingNotes();
  }, [isAdmin]);

  async function approveNote(noteId: string) {
    await updateDoc(doc(db, "notes", noteId), {
      status: "approved",
    });

    fetchPendingNotes();
  }

  async function rejectNote(noteId: string) {
    await updateDoc(doc(db, "notes", noteId), {
      status: "rejected",
    });

    fetchPendingNotes();
  }

  async function deleteNote(noteId: string) {
    const ok = confirm("Delete this note permanently?");
    if (!ok) return;

    await deleteDoc(doc(db, "notes", noteId));
    fetchPendingNotes();
  }

  if (loading || checking) {
    return <p className="p-10">Checking admin access...</p>;
  }

  if (!isAdmin) {
    return (
      <div className="container-max py-10">
        <h1 className="text-2xl font-bold text-red-400">Access Denied</h1>
        <p className="mt-2 text-white/70">
          You are not an admin.
        </p>
        <button onClick={() => router.push("/")} className="btn-primary mt-6">
          Go Home
        </button>
      </div>
    );
  }

  return (
    <div className="container-max py-10">
      <h1 className="text-3xl font-bold">Admin Panel</h1>
      <p className="mt-2 text-white/70">
        Approve or reject uploaded notes.
      </p>

      {fetching && <p className="mt-10 text-white/60">Loading pending notes...</p>}

      {!fetching && notes.length === 0 && (
        <p className="mt-10 text-white/60">No pending notes 🎉</p>
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
                <span className="text-white/70">Uploader:</span>{" "}
                {note.uploaderEmail}
              </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <a
                href={note.pdfURL}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary text-xs px-4 py-2"
              >
                View PDF
              </a>

              <button
                onClick={() => approveNote(note.id!)}
                className="text-xs px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 transition text-white"
              >
                Approve
              </button>

              <button
                onClick={() => rejectNote(note.id!)}
                className="text-xs px-4 py-2 rounded-xl bg-yellow-600 hover:bg-yellow-700 transition text-white"
              >
                Reject
              </button>

              <button
                onClick={() => deleteNote(note.id!)}
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