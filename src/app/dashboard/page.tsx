"use client";

import type React from "react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";
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
  RefreshCw,
  Sparkles,
  UploadCloud,
  User,
  XCircle,
  BadgeCheck,
  Trophy,
} from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/firebase/firebase";
import type { Note } from "@/types/note";

type HallCreator = {
  userId: string;
  displayName: string;
  photoURL?: string;
  reputation: number;
  verifiedCreator?: boolean;
};

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [notes, setNotes] = useState<Note[]>([]);
  const [savedCount, setSavedCount] = useState(0);
  const [fetching, setFetching] = useState(true);
  const [topCreators, setTopCreators] = useState<HallCreator[]>([]);

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

        const topCreatorsQuery = query(
          collection(db, "creatorStats"),
          orderBy("reputation", "desc"),
          limit(5)
        );

        const [notesSnap, bookmarksSnap, topCreatorsSnap] = await Promise.all([
          getDocs(notesQuery),
          getDocs(bookmarksQuery),
          getDocs(topCreatorsQuery),
        ]);

        const data: Note[] = notesSnap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Note, "id">),
        }));

        setNotes(data);
        setSavedCount(bookmarksSnap.size);

        setTopCreators(
          topCreatorsSnap.docs.map((docSnap) => {
            const data = docSnap.data();

            return {
              userId: data.userId || docSnap.id,
              displayName: data.displayName || "NotesWallah Creator",
              photoURL: data.photoURL || "",
              reputation: Number(data.reputation || 0),
              verifiedCreator: Boolean(data.verifiedCreator),
            };
          })
        );

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
    return (
      <main className="min-h-screen bg-[#050505] px-4 py-8 text-white">
        <div className="mx-auto flex min-h-[70vh] max-w-7xl items-center justify-center">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-white/10 bg-white/5">
              <RefreshCw className="animate-spin text-red-500" size={30} />
            </div>

            <h1 className="mt-5 text-xl font-black">Loading dashboard</h1>

            <p className="mt-2 text-sm text-white/50">
              Fetching your uploads, downloads and saved notes...
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
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-red-500/20 blur-3xl" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 text-xs font-black text-red-300">
                <LayoutDashboard size={16} />
                Creator Dashboard
              </div>

              <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                Welcome back
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-6 text-white/55 sm:text-base">
                Track your uploaded notes, approvals, downloads and saved study
                material from one clean dashboard.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:flex">
              <Link
                href="/browse"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-4 text-sm font-black text-white transition hover:bg-white/[0.08]"
              >
                <BookOpen size={18} />
                Browse
              </Link>

              <Link
                href="/upload"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-4 text-sm font-black text-white transition hover:bg-red-500"
              >
                <UploadCloud size={18} />
                Upload
              </Link>
            </div>
          </div>
        </section>

        <section className="no-scrollbar mt-5 flex gap-3 overflow-x-auto pb-1 md:grid md:grid-cols-2 md:gap-4 xl:grid-cols-4">
          <StatCard
            label="Uploads"
            value={dashboardStats.totalUploads}
            icon={<FileText size={24} />}
          />

          <StatCard
            label="Downloads"
            value={dashboardStats.totalDownloads}
            icon={<Download size={24} />}
          />

          <StatCard
            label="Saved"
            value={savedCount}
            icon={<Heart size={24} />}
          />

          <StatCard
            label="Approved"
            value={dashboardStats.approvedNotes}
            icon={<CheckCircle2 size={24} />}
            tone="green"
          />
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[1fr_380px]">
          <div className="min-w-0 rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-7 lg:p-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-black">Recent Uploads</h2>

                <p className="mt-1 text-sm text-white/45">
                  Your latest uploaded study materials.
                </p>
              </div>

              <Link
                href="/my-notes"
                className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-bold text-white/70 transition hover:bg-white/[0.08] hover:text-white"
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

                <h3 className="mt-5 text-xl font-black">No uploads yet</h3>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/50">
                  Upload your first note and start helping other students learn
                  faster.
                </p>

                <Link
                  href="/upload"
                  className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-black text-white transition hover:bg-red-500"
                >
                  <UploadCloud size={18} />
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
                        <h3 className="line-clamp-2 break-words font-black">
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

            <div className="rounded-[2rem] border border-yellow-500/20 bg-yellow-500/5 p-5 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-sm font-black text-yellow-300">
                    <Trophy size={18} />
                    Hall of Fame
                  </div>

                  <p className="mt-1 text-xs text-white/45">Top creators by reputation.</p>
                </div>

                <Link
                  href="/creators"
                  className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-black text-white/60 transition hover:bg-white/[0.08] hover:text-white"
                >
                  View
                </Link>
              </div>

              <div className="mt-5 grid gap-3">
                {topCreators.length === 0 ? (
                  <p className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/45">
                    No ranked creators yet.
                  </p>
                ) : (
                  topCreators.map((creator, index) => (
                    <Link
                      key={creator.userId}
                      href={`/profile/${creator.userId}`}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 p-3 transition hover:bg-white/[0.05]"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-yellow-500/10 text-sm font-black text-yellow-300">
                          {index === 0
                            ? "🥇"
                            : index === 1
                              ? "🥈"
                              : index === 2
                                ? "🥉"
                                : `#${index + 1}`}
                        </div>

                        <div className="min-w-0">
                          <div className="flex min-w-0 items-center gap-1.5">
                            <p className="truncate text-sm font-black">
                              {creator.displayName}
                            </p>

                            {creator.verifiedCreator && (
                              <BadgeCheck size={14} className="shrink-0 text-blue-400" />
                            )}
                          </div>

                          <p className="text-xs font-bold text-white/40">
                            {creator.reputation} reputation
                          </p>
                        </div>
                      </div>

                      <ArrowRight size={15} className="shrink-0 text-white/30" />
                    </Link>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-6">
              <div className="flex items-center gap-4">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-red-500/15">
                  {user?.photoURL ? (
                    <Image
                      src={user.photoURL}
                      alt="Profile"
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-lg font-black">
                      {user?.email?.charAt(0).toUpperCase() || "U"}
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <h3 className="truncate font-black">
                    {user?.displayName || "NotesWallah User"}
                  </h3>

                  <p className="truncate text-sm text-white/45">
                    {user?.email}
                  </p>
                </div>
              </div>

              <Link
                href="/profile"
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-bold text-white/70 transition hover:bg-white/[0.08] hover:text-white"
              >
                <User size={17} />
                View Profile
              </Link>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-6">
              <h3 className="font-black">Moderation Status</h3>

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

            <div className="rounded-[2rem] border border-red-500/20 bg-red-500/5 p-5 sm:p-6">
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
  tone?: "red" | "green";
}) {
  return (
    <div className="min-w-[155px] rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-black/20 backdrop-blur-xl md:min-w-0 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-white/45 sm:text-sm">{label}</p>

          <p className="mt-2 text-2xl font-black sm:text-3xl">{value}</p>
        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
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
      className={`w-fit rounded-full border px-3 py-1 text-xs font-bold capitalize ${styles}`}
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

        <span className="text-sm font-bold text-white/70">{label}</span>
      </div>

      <span className="font-black">{value}</span>
    </div>
  );
}