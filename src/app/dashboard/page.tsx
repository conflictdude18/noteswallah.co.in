"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, getDocs, query, where } from "firebase/firestore";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Heart,
  LayoutDashboard,
  PlusCircle,
  Sparkles,
  UploadCloud,
  User,
  XCircle,
} from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/firebase/firebase";
import type { Note } from "@/types/note";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [notes, setNotes] = useState<Note[]>([]);
  const [savedCount, setSavedCount] = useState(0);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/signin");
    }
  }, [user, loading, router]);

  useEffect(() => {
    async function fetchDashboard() {
      if (!user) return;

      setFetching(true);

      try {
        const notesQuery = query(
          collection(db, "notes"),
          where("uploaderId", "==", user.uid)
        );

        const bookmarksQuery = query(
          collection(db, "bookmarks"),
          where("userId", "==", user.uid)
        );

        const [notesSnap, bookmarksSnap] = await Promise.all([
          getDocs(notesQuery),
          getDocs(bookmarksQuery),
        ]);

        const data: Note[] = notesSnap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Note, "id">),
        }));

        setNotes(data);
        setSavedCount(bookmarksSnap.size);
      } catch (err) {
        console.error("DASHBOARD FETCH ERROR:", err);
      } finally {
        setFetching(false);
      }
    }

    if (user) fetchDashboard();
  }, [user]);

  const dashboardStats = useMemo(() => {
    const totalUploads = notes.length;

    const totalDownloads = notes.reduce(
      (sum, note) => sum + (note.downloadsCount ?? 0),
      0
    );

    const pendingNotes = notes.filter((n) => n.status === "pending").length;
    const approvedNotes = notes.filter((n) => n.status === "approved").length;
    const rejectedNotes = notes.filter((n) => n.status === "rejected").length;

    return {
      totalUploads,
      totalDownloads,
      pendingNotes,
      approvedNotes,
      rejectedNotes,
    };
  }, [notes]);

  const recentNotes = useMemo(() => {
    return [...notes].slice(0, 5);
  }, [notes]);

  if (loading || fetching) {
    return <LoadingSpinner />;
  }

  return (
    <main className="space-y-8 overflow-x-hidden pb-24">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#07090d] p-6 shadow-card md:p-10">
        <div className="absolute right-[-100px] top-[-100px] h-[280px] w-[280px] rounded-full bg-red-500/20 blur-[120px]" />
        <div className="absolute bottom-[-140px] left-[20%] h-[260px] w-[260px] rounded-full bg-red-700/10 blur-[130px]" />

        <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-300">
              <LayoutDashboard size={16} />
              Creator Dashboard
            </div>

            <h1 className="mt-6 text-4xl font-black tracking-tight text-white md:text-6xl">
              Welcome Back
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-7 text-white/60">
              Track your uploaded notes, approvals, downloads and saved study
              material from one clean dashboard.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/browse" className="btn-secondary">
              <BookOpen size={18} />
              Browse Notes
            </Link>

            <Link href="/upload" className="btn-primary">
              <UploadCloud size={18} />
              Upload Notes
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Uploads"
          value={dashboardStats.totalUploads}
          icon={<FileText size={24} />}
        />

        <StatCard
          label="Total Downloads"
          value={dashboardStats.totalDownloads}
          icon={<Download size={24} />}
        />

        <StatCard
          label="Saved Notes"
          value={savedCount}
          icon={<Heart size={24} />}
        />

        <StatCard
          label="Approved Notes"
          value={dashboardStats.approvedNotes}
          icon={<CheckCircle2 size={24} />}
          tone="green"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="min-w-0 rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-card backdrop-blur-xl md:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-black text-white">
                Recent Uploads
              </h2>

              <p className="mt-1 text-sm text-white/45">
                Your latest uploaded study materials.
              </p>
            </div>

            <Link
              href="/my-notes"
              className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white/70 transition hover:bg-white/[0.08] hover:text-white"
            >
              View All
              <ArrowRight size={15} />
            </Link>
          </div>

          {recentNotes.length === 0 ? (
            <div className="mt-8 rounded-[1.7rem] border border-dashed border-white/10 bg-black/20 p-8 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 text-red-300">
                <PlusCircle size={30} />
              </div>

              <h3 className="mt-5 text-xl font-black text-white">
                No uploads yet
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/50">
                Upload your first note and start helping other students learn
                faster.
              </p>

              <Link href="/upload" className="btn-primary mt-6 inline-flex">
                Upload First Note
              </Link>
            </div>
          ) : (
            <div className="mt-6 grid gap-3">
              {recentNotes.map((note) => (
                <Link
                  key={note.id}
                  href={`/notes/${note.id}`}
                  className="group flex min-w-0 flex-col gap-4 overflow-hidden rounded-[1.5rem] border border-white/10 bg-black/20 p-4 transition hover:border-red-500/30 hover:bg-white/[0.05] sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-4 overflow-hidden">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
                      {note.thumbnailUrl ? (
                        <Image
                          src={note.thumbnailUrl}
                          alt={note.title || "Note thumbnail"}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-white/35">
                          <FileText size={26} />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1 overflow-hidden">
                      <h3 className="line-clamp-2 break-words font-black text-white">
                        {note.title || "Untitled Note"}
                      </h3>

                      <p className="mt-1 line-clamp-1 text-sm text-white/45">
                        {note.subject || "Subject"} • Class{" "}
                        {note.class || "N/A"} • {note.topic || "Topic"}
                      </p>

                      <div className="mt-2 flex items-center gap-3 text-xs text-white/40">
                        <span className="flex items-center gap-1">
                          <Download size={13} />
                          {note.downloadsCount ?? 0} downloads
                        </span>
                      </div>
                    </div>
                  </div>

                  <StatusBadge status={note.status || "pending"} />
                </Link>
              ))}
            </div>
          )}
        </div>

        <aside className="space-y-5">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-card backdrop-blur-xl">
            <div className="flex items-center gap-4">
              <div className="relative h-14 w-14 overflow-hidden rounded-2xl border border-white/10 bg-red-500/15">
                {user?.photoURL ? (
                  <Image
                    src={user.photoURL}
                    alt="Profile"
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-lg font-black text-white">
                    {user?.email?.charAt(0).toUpperCase() || "U"}
                  </div>
                )}
              </div>

              <div className="min-w-0">
                <h3 className="truncate font-black text-white">
                  {user?.displayName || "NotesWallah User"}
                </h3>

                <p className="truncate text-sm text-white/45">
                  {user?.email}
                </p>
              </div>
            </div>

            <Link
              href="/profile"
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-white/70 transition hover:bg-white/[0.08] hover:text-white"
            >
              <User size={17} />
              View Profile
            </Link>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-card backdrop-blur-xl">
            <h3 className="font-black text-white">Moderation Status</h3>

            <div className="mt-5 grid gap-3">
              <StatusRow
                icon={<Clock size={17} />}
                label="Pending"
                value={dashboardStats.pendingNotes}
                tone="yellow"
              />

              <StatusRow
                icon={<CheckCircle2 size={17} />}
                label="Approved"
                value={dashboardStats.approvedNotes}
                tone="green"
              />

              <StatusRow
                icon={<XCircle size={17} />}
                label="Rejected"
                value={dashboardStats.rejectedNotes}
                tone="red"
              />
            </div>
          </div>

          <div className="rounded-[2rem] border border-red-500/20 bg-red-500/5 p-6">
            <div className="flex items-center gap-2 text-sm font-black text-red-300">
              <Sparkles size={18} />
              Keep Sharing
            </div>

            <p className="mt-3 text-sm leading-6 text-white/55">
              Accurate titles, subjects and topics help more students discover
              your notes.
            </p>
          </div>
        </aside>
      </section>
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
  tone?: "red" | "green";
}) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-card backdrop-blur-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-white/50">{label}</p>

          <p className="mt-3 text-4xl font-black text-white">{value}</p>
        </div>

        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
            tone === "green"
              ? "bg-green-500/10 text-green-300"
              : "bg-red-500/10 text-red-300"
          }`}
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
      ? "border-green-500/20 bg-green-500/10 text-green-300"
      : normalized === "rejected"
        ? "border-red-500/20 bg-red-500/10 text-red-300"
        : "border-yellow-500/20 bg-yellow-500/10 text-yellow-300";

  return (
    <span
      className={`w-fit rounded-full border px-3 py-1 text-xs font-medium capitalize ${styles}`}
    >
      {status}
    </span>
  );
}

function StatusRow({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: "yellow" | "green" | "red";
}) {
  const styles = {
    yellow: "bg-yellow-500/10 text-yellow-300",
    green: "bg-green-500/10 text-green-300",
    red: "bg-red-500/10 text-red-300",
  };

  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-xl ${styles[tone]}`}
        >
          {icon}
        </div>

        <span className="text-sm font-medium text-white/70">
          {label}
        </span>
      </div>

      <span className="font-black text-white">{value}</span>
    </div>
  );
}