"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import {
  CheckCircle,
  ExternalLink,
  FileText,
  ShieldCheck,
  Trash2,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

import { db } from "@/firebase/firebase";
import { useAuth } from "@/contexts/AuthContext";
import LoadingSpinner from "@/components/LoadingSpinner";
import type { Note } from "@/types/note";

type UserDoc = {
  role?: string;
};

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [notes, setNotes] = useState<Note[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    async function checkAdmin() {
      if (!user) return;

      const snap = await getDoc(doc(db, "users", user.uid));

      if (snap.exists()) {
        const data = snap.data() as UserDoc;
        setIsAdmin(data.role === "admin");
      }

      setChecking(false);
    }

    if (!loading && !user) {
      router.push("/signin");
    }

    if (user) {
      checkAdmin();
    }
  }, [user, loading, router]);

  async function fetchPendingNotes() {
    setFetching(true);

    try {
      const q = query(
        collection(db, "notes"),
        where("status", "==", "pending")
      );

      const snap = await getDocs(q);

      const data: Note[] = snap.docs.map((noteDoc) => ({
        id: noteDoc.id,
        ...(noteDoc.data() as Omit<Note, "id">),
      }));

      setNotes(data);
    } catch (err) {
      console.error("ADMIN FETCH ERROR:", err);
      toast.error("Failed to load pending notes.");
    } finally {
      setFetching(false);
    }
  }

  useEffect(() => {
    if (isAdmin) {
      fetchPendingNotes();
    }
  }, [isAdmin]);

  async function approveNote(noteId: string) {
    try {
      await updateDoc(doc(db, "notes", noteId), {
        status: "approved",
      });

      toast.success("Note approved.");
      fetchPendingNotes();
    } catch (err) {
      console.error(err);
      toast.error("Failed to approve note.");
    }
  }

  async function rejectNote(noteId: string) {
    try {
      await updateDoc(doc(db, "notes", noteId), {
        status: "rejected",
      });

      toast.success("Note rejected.");
      fetchPendingNotes();
    } catch (err) {
      console.error(err);
      toast.error("Failed to reject note.");
    }
  }

  async function deleteNote(noteId: string) {
    const ok = confirm("Delete this note permanently?");
    if (!ok) return;

    try {
      await deleteDoc(doc(db, "notes", noteId));
      toast.success("Note deleted.");
      fetchPendingNotes();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete note.");
    }
  }

  if (loading || checking || fetching) {
    return <LoadingSpinner />;
  }

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="container-max py-10">
          <h1 className="text-3xl font-black text-red-400">Access Denied</h1>
          <p className="mt-2 text-white/60">Only admins can access this page.</p>

          <button onClick={() => router.push("/")} className="btn-primary mt-6">
            Go Home
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="container-max py-10">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm text-red-400">
              <ShieldCheck size={16} />
              Admin Control Center
            </div>

            <h1 className="text-4xl font-black">Admin Panel</h1>

            <p className="mt-2 text-white/60">
              Review, approve, reject, delete notes and handle reports.
            </p>
          </div>

          <Link
            href="/admin/reports"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-yellow-500/20 bg-yellow-500/10 px-5 py-3 text-sm font-medium text-yellow-400 transition hover:bg-yellow-500/20"
          >
            <AlertTriangle size={18} />
            View Reports
          </Link>
        </div>

        {notes.length === 0 ? (
          <div className="glass-card mt-10 p-10 text-center">
            <CheckCircle className="mx-auto text-green-400" size={54} />

            <h2 className="mt-5 text-2xl font-bold">No pending notes</h2>

            <p className="mt-2 text-white/50">
              All uploaded notes are already reviewed.
            </p>
          </div>
        ) : (
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {notes.map((note) => (
              <div key={note.id} className="glass-card overflow-hidden">
                <div className="h-48 overflow-hidden bg-zinc-950">
                  {note.thumbnailUrl ? (
                    <img
                      src={note.thumbnailUrl}
                      alt={note.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <FileText className="text-red-500" size={50} />
                    </div>
                  )}
                </div>

                <div className="p-6">
                  <div className="mb-3 inline-flex rounded-full border border-yellow-500/20 bg-yellow-500/10 px-3 py-1 text-xs text-yellow-400">
                    Pending Review
                  </div>

                  <h2 className="line-clamp-2 text-xl font-bold">
                    {note.title}
                  </h2>

                  <p className="mt-3 line-clamp-3 text-sm text-white/60">
                    {note.description || "No description provided."}
                  </p>

                  <div className="mt-5 space-y-1 text-xs text-white/45">
                    <p>
                      <span className="text-white/70">Class:</span>{" "}
                      {note.class}
                    </p>

                    <p>
                      <span className="text-white/70">Subject:</span>{" "}
                      {note.subject}
                    </p>

                    <p>
                      <span className="text-white/70">Topic:</span>{" "}
                      {note.topic}
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
                      className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/70 transition hover:bg-white/10 hover:text-white"
                    >
                      <ExternalLink size={14} />
                      View PDF
                    </a>

                    <button
                      onClick={() => approveNote(note.id!)}
                      className="inline-flex items-center gap-2 rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-2 text-xs text-green-400 transition hover:bg-green-500/20"
                    >
                      <CheckCircle size={14} />
                      Approve
                    </button>

                    <button
                      onClick={() => rejectNote(note.id!)}
                      className="inline-flex items-center gap-2 rounded-xl border border-yellow-500/20 bg-yellow-500/10 px-4 py-2 text-xs text-yellow-400 transition hover:bg-yellow-500/20"
                    >
                      <XCircle size={14} />
                      Reject
                    </button>

                    <button
                      onClick={() => deleteNote(note.id!)}
                      className="inline-flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-xs text-red-400 transition hover:bg-red-500/20"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}