"use client";

import type React from "react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { deleteObject, ref } from "firebase/storage";
import {
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileText,
  PlusCircle,
  RefreshCw,
  Trash2,
  UploadCloud,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/contexts/AuthContext";
import { db, storage } from "@/firebase/firebase";
import type { Note } from "@/types/note";

export default function MyNotesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [notes, setNotes] = useState<Note[]>([]);
  const [fetching, setFetching] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function fetchMyNotes() {
    if (!user) return;

    setFetching(true);

    try {
      const q = query(
        collection(db, "notes"),
        where("uploaderId", "==", user.uid)
      );

      const snap = await getDocs(q);

      const data: Note[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Note, "id">),
      }));

      setNotes(data);
    } catch (err) {
      console.error("FETCH MY NOTES ERROR:", err);
      toast.error("Could not load your notes.");
    } finally {
      setFetching(false);
    }
  }

  async function deleteFileFromUrl(url?: string) {
    if (!url) return;

    try {
      const decodedURL = decodeURIComponent(url);
      const match = decodedURL.match(/\/o\/(.*?)\?/);

      if (match?.[1]) {
        await deleteObject(ref(storage, match[1]));
      }
    } catch (err) {
      console.error("FILE DELETE ERROR:", err);
    }
  }

  async function handleDelete(note: Note) {
    if (!note.id || deletingId) return;

    const confirmDelete = confirm(
      "Are you sure you want to delete this note? This cannot be undone."
    );

    if (!confirmDelete) return;

    setDeletingId(note.id);

    try {
      await deleteDoc(doc(db, "notes", note.id));
      await deleteFileFromUrl(note.pdfURL);
      await deleteFileFromUrl(note.thumbnailUrl);

      setNotes((prev) => prev.filter((item) => item.id !== note.id));
      toast.success("Note deleted.");
    } catch (err) {
      console.error("DELETE ERROR:", err);
      toast.error("Failed to delete note.");
    } finally {
      setDeletingId(null);
    }
  }

  useEffect(() => {
    if (!loading && !user) router.push("/signin");
  }, [user, loading, router]);

  useEffect(() => {
    if (user) fetchMyNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const stats = useMemo(() => {
    const total = notes.length;
    const approved = notes.filter((note) => note.status === "approved").length;
    const pending = notes.filter((note) => note.status === "pending").length;
    const rejected = notes.filter((note) => note.status === "rejected").length;
    const downloads = notes.reduce(
      (sum, note) => sum + (note.downloadsCount ?? 0),
      0
    );

    return { total, approved, pending, rejected, downloads };
  }, [notes]);

  if (loading || fetching) {
    return (
      <main className="min-h-screen bg-[#050505] px-4 py-8 text-white">
        <div className="mx-auto flex min-h-[70vh] max-w-7xl items-center justify-center">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-white/10 bg-white/5">
              <RefreshCw className="animate-spin text-red-500" size={30} />
            </div>

            <h1 className="mt-5 text-xl font-black">Loading your notes</h1>

            <p className="mt-2 text-sm text-white/50">
              Fetching your uploads and moderation status...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#050505] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl pb-28 md:pb-10">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/10 via-white/[0.04] to-red-500/10 p-5 shadow-2xl shadow-black/30 sm:p-7 lg:p-9">
          <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-red-500/20 blur-3xl" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 text-xs font-black text-red-300">
                <FileText size={16} />
                Creator Studio
              </div>

              <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                My Notes
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-6 text-white/55 sm:text-base">
                Manage your uploaded notes, monitor approval status, and track
                total downloads from one professional workspace.
              </p>
            </div>

            <Link
              href="/upload"
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-4 text-sm font-black text-white transition hover:bg-red-500 sm:w-fit"
            >
              <PlusCircle size={18} />
              Upload New Note
            </Link>
          </div>
        </section>

        <section className="no-scrollbar mt-5 flex gap-3 overflow-x-auto pb-1 md:grid md:grid-cols-2 md:gap-4 xl:grid-cols-5">
          <StatCard label="Total" value={stats.total} icon={<FileText />} />
          <StatCard label="Downloads" value={stats.downloads} icon={<Download />} />
          <StatCard label="Approved" value={stats.approved} icon={<CheckCircle2 />} tone="green" />
          <StatCard label="Pending" value={stats.pending} icon={<Clock />} tone="yellow" />
          <StatCard label="Rejected" value={stats.rejected} icon={<XCircle />} tone="red" />
        </section>

        {notes.length === 0 ? (
          <section className="mt-5 rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 text-center shadow-2xl shadow-black/20 backdrop-blur-xl md:p-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 text-red-300">
              <UploadCloud size={34} />
            </div>

            <h2 className="mt-6 text-2xl font-black">No uploads yet</h2>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-white/55">
              Upload your first PDF note and start helping other students study
              better.
            </p>

            <Link
              href="/upload"
              className="mt-7 inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-black text-white transition hover:bg-red-500"
            >
              <UploadCloud size={18} />
              Upload Notes
            </Link>
          </section>
        ) : (
          <section className="mt-5 rounded-[2rem] border border-white/10 bg-white/[0.035] p-4 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-5">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {notes.map((note) => (
                <article
                  key={note.id}
                  className="group overflow-hidden rounded-[1.5rem] border border-white/10 bg-black/20 transition hover:border-red-500/30 hover:bg-white/[0.04]"
                >
                  <div className="relative h-44 overflow-hidden border-b border-white/10 bg-black/30">
                    {note.thumbnailUrl ? (
                      <Image
                        src={note.thumbnailUrl}
                        alt={note.title || "Note thumbnail"}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-white/35">
                        <FileText size={36} />
                        <span className="text-xs font-bold">PDF Note</span>
                      </div>
                    )}

                    <div className="absolute left-3 top-3">
                      <StatusBadge status={note.status || "pending"} />
                    </div>
                  </div>

                  <div className="p-4 sm:p-5">
                    <h2 className="line-clamp-2 break-words text-lg font-black leading-tight">
                      {note.title || "Untitled Note"}
                    </h2>

                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/50">
                      {note.description || "No description provided."}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <MiniTag>{note.subject || "N/A"}</MiniTag>
                      <MiniTag>Class {note.class || "N/A"}</MiniTag>
                      <MiniTag>{note.topic || "Topic"}</MiniTag>
                      <MiniTag>{note.downloadsCount ?? 0} downloads</MiniTag>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-2 border-t border-white/10 pt-4">
                      <Link
                        href={`/notes/${note.id}`}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-black text-white/75 transition hover:bg-white/[0.08] hover:text-white"
                      >
                        <Eye size={15} />
                        View
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleDelete(note)}
                        disabled={deletingId === note.id}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-red-600 px-3 py-2 text-xs font-black text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Trash2 size={15} />
                        {deletingId === note.id ? "Deleting" : "Delete"}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  icon,
  tone = "red",
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone?: "red" | "green" | "yellow";
}) {
  const styles = {
    red: "bg-red-500/10 text-red-300",
    green: "bg-green-500/10 text-green-300",
    yellow: "bg-yellow-500/10 text-yellow-300",
  };

  return (
    <div className="min-w-[150px] rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-black/20 backdrop-blur-xl md:min-w-0 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-white/45 sm:text-sm">{label}</p>
          <p className="mt-2 text-2xl font-black sm:text-3xl">{value}</p>
        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-2xl ${styles[tone]}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();

  const styles =
    normalized === "approved"
      ? "border-green-500/20 bg-green-500/15 text-green-300"
      : normalized === "rejected"
        ? "border-red-500/20 bg-red-500/15 text-red-300"
        : "border-yellow-500/20 bg-yellow-500/15 text-yellow-300";

  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-black capitalize backdrop-blur-xl ${styles}`}
    >
      {status}
    </span>
  );
}

function MiniTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="max-w-full truncate rounded-full border border-white/10 bg-black/25 px-2.5 py-1 text-[10px] font-bold text-white/55">
      {children}
    </span>
  );
}