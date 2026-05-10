"use client";

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
  BookOpen,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileText,
  PlusCircle,
  Sparkles,
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

      if (match && match[1]) {
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
    if (!loading && !user) {
      router.push("/signin");
    }
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
      <main className="flex min-h-[70vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-14 w-14 animate-spin rounded-full border-4 border-red-500 border-t-transparent" />
          <p className="mt-5 font-medium text-white/60">Loading notes...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="space-y-8 overflow-x-hidden pb-24">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#07090d] p-6 shadow-card md:p-10">
        <div className="absolute right-[-90px] top-[-90px] h-[260px] w-[260px] rounded-full bg-red-500/20 blur-[120px]" />
        <div className="absolute bottom-[-120px] left-[20%] h-[240px] w-[240px] rounded-full bg-red-700/10 blur-[130px]" />

        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-300">
              <FileText size={16} />
              Creator Studio
            </div>

            <h1 className="mt-6 text-4xl font-black tracking-tight text-white md:text-6xl">
              My Notes
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-7 text-white/60">
              Manage your uploaded notes, track approval status and monitor
              downloads from one place.
            </p>
          </div>

          <Link href="/upload" className="btn-primary w-full sm:w-fit">
            <PlusCircle size={18} />
            Upload New Note
          </Link>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total" value={stats.total} icon={<FileText />} />
        <StatCard label="Downloads" value={stats.downloads} icon={<Download />} />
        <StatCard
          label="Approved"
          value={stats.approved}
          icon={<CheckCircle2 />}
          tone="green"
        />
        <StatCard
          label="Pending"
          value={stats.pending}
          icon={<Clock />}
          tone="yellow"
        />
        <StatCard
          label="Rejected"
          value={stats.rejected}
          icon={<XCircle />}
          tone="red"
        />
      </section>

      {notes.length === 0 ? (
        <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-10 text-center shadow-card backdrop-blur-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 text-red-300">
            <UploadCloud size={34} />
          </div>

          <h2 className="mt-6 text-2xl font-black text-white">
            No Uploads Yet
          </h2>

          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-white/55">
            Upload your first PDF note and help other students study better.
          </p>

          <Link href="/upload" className="btn-primary mt-7 inline-flex">
            Upload Notes
          </Link>
        </section>
      ) : (
        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {notes.map((note) => (
            <article
              key={note.id}
              className="group min-w-0 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] p-4 shadow-card backdrop-blur-xl transition hover:border-red-500/30 hover:bg-white/[0.06]"
            >
              <div className="relative h-44 overflow-hidden rounded-[1.5rem] border border-white/10 bg-black/30">
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
                    <FileText size={38} />
                    <span className="text-xs font-medium">PDF Note</span>
                  </div>
                )}

                <div className="absolute left-3 top-3">
                  <StatusBadge status={note.status || "pending"} />
                </div>
              </div>

              <div className="p-2 pt-5">
                <h2 className="line-clamp-2 break-words text-xl font-black leading-tight text-white">
                  {note.title || "Untitled Note"}
                </h2>

                <p className="mt-3 line-clamp-2 text-sm leading-6 text-white/55">
                  {note.description || "No description provided."}
                </p>

                <div className="mt-5 grid grid-cols-2 gap-3 text-xs">
                  <InfoBox label="Subject" value={note.subject || "N/A"} />
                  <InfoBox label="Class" value={note.class || "N/A"} />
                  <InfoBox label="Topic" value={note.topic || "N/A"} />
                  <InfoBox
                    label="Downloads"
                    value={String(note.downloadsCount ?? 0)}
                  />
                </div>

                <div className="mt-6 flex items-center gap-3 border-t border-white/10 pt-5">
                  <Link
                    href={`/notes/${note.id}`}
                    className="flex min-h-[2.6rem] flex-1 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-medium text-white/75 transition hover:bg-white/[0.08] hover:text-white"
                  >
                    <Eye size={15} />
                    View
                  </Link>

                  <button
                    type="button"
                    title="Delete note"
                    aria-label="Delete note"
                    onClick={() => handleDelete(note)}
                    disabled={deletingId === note.id}
                    className="flex min-h-[2.6rem] flex-1 items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 py-2 text-xs font-medium text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Trash2 size={15} />
                    {deletingId === note.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
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
    <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-card backdrop-blur-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-white/50">{label}</p>
          <p className="mt-2 text-3xl font-black text-white">{value}</p>
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
      className={`rounded-full border px-3 py-1 text-xs font-medium capitalize backdrop-blur-xl ${styles}`}
    >
      {status}
    </span>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/10 bg-black/25 p-3">
      <p className="text-[11px] font-medium text-white/40">{label}</p>
      <p className="mt-1 truncate text-sm font-black text-white">{value}</p>
    </div>
  );
}