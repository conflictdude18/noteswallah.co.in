"use client";

import type React from "react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import {
  ArrowRight,
  BookOpen,
  Bot,
  Download,
  Eye,
  FileText,
  Heart,
  Lock,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UploadCloud,
  Users,
} from "lucide-react";

import { db } from "@/firebase/firebase";
import { useAuth } from "@/contexts/AuthContext";
import type { Note } from "@/types/note";

type HomeNote = Note & {
  id: string;
  board?: string;
  type?: string;
  topic?: string;
  views?: number;
  viewsCount?: number;
  likes?: number;
  likesCount?: number;
  downloads?: number;
  downloadsCount?: number;
  createdAt?: unknown;
};

export default function HomePage() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<HomeNote[]>([]);
  const [stats, setStats] = useState({
    notes: 0,
    users: 0,
    subjects: 0,
    downloads: 0,
  });

  useEffect(() => {
    const unsubscribeNotes = onSnapshot(collection(db, "notes"), (notesSnap) => {
      const approvedNotes: HomeNote[] = notesSnap.docs
        .map((noteDoc) => ({
          id: noteDoc.id,
          ...(noteDoc.data() as Omit<HomeNote, "id">),
        }))
        .filter((note) => note.status === "approved");

      const subjects = new Set(
        approvedNotes.map((note) => note.subject).filter(Boolean)
      );

      const downloads = approvedNotes.reduce(
        (sum, note) => sum + getDownloads(note),
        0
      );

      setNotes(approvedNotes);
      setStats((prev) => ({
        ...prev,
        notes: approvedNotes.length,
        subjects: subjects.size,
        downloads,
      }));
    });

    const unsubscribeUsers = onSnapshot(collection(db, "users"), (usersSnap) => {
      setStats((prev) => ({
        ...prev,
        users: usersSnap.size,
      }));
    });

    return () => {
      unsubscribeNotes();
      unsubscribeUsers();
    };
  }, []);

  const trendingNotes = useMemo(() => {
    return [...notes]
      .sort((a, b) => getTrendingScore(b) - getTrendingScore(a))
      .slice(0, 6);
  }, [notes]);

  const latestNotes = useMemo(() => {
    return [...notes]
      .sort((a, b) => getCreatedTime(b.createdAt) - getCreatedTime(a.createdAt))
      .slice(0, 3);
  }, [notes]);

  const subjectLinks = useMemo(() => {
    const subjectMap = new Map<string, { label: string; count: number }>();

    notes.forEach((note) => {
      if (!note.subject?.trim()) return;

      const label = note.subject.trim();
      const key = label.toLowerCase();

      subjectMap.set(key, {
        label,
        count: (subjectMap.get(key)?.count || 0) + 1,
      });
    });

    const subjects = Array.from(subjectMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
      .map((item) => item.label);

    return subjects.length
      ? subjects
      : ["Physics", "Chemistry", "Mathematics", "Biology", "JEE", "NEET"];
  }, [notes]);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#050505] text-white">
      {!user && <GuestNav />}

      <section className="relative overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
        <div className="absolute left-1/2 top-0 h-80 w-80 -translate-x-1/2 rounded-full bg-red-500/20 blur-[130px]" />
        <div className="absolute right-0 top-40 h-72 w-72 rounded-full bg-red-900/20 blur-[130px]" />

        <div className="relative mx-auto max-w-7xl">
          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/10 via-white/[0.04] to-red-500/10 p-5 shadow-2xl shadow-black/30 sm:p-8 lg:p-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 text-xs font-black text-red-300">
                <Sparkles size={16} />
                India’s Student Knowledge Network
              </div>

              <h1 className="mt-6 text-4xl font-black tracking-tight sm:text-6xl lg:text-7xl">
                Study smarter with{" "}
                <span className="text-red-400">NotesWallah</span>
              </h1>

              <p className="mt-5 max-w-2xl text-sm leading-7 text-white/60 sm:text-base">
                Discover quality notes, upload study material, save resources,
                follow creators, and use Notique AI to learn faster.
              </p>

              <Link
                href={user ? "/browse" : "/signin"}
                className="mt-7 flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-4 transition hover:border-red-500/30"
              >
                <Search size={20} className="text-white/40" />
                <span className="text-sm font-semibold text-white/45">
                  Search notes, subjects, chapters, exams...
                </span>
              </Link>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={user ? "/browse" : "/signin"}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-6 py-4 text-sm font-black text-white transition hover:bg-red-500"
                >
                  Browse Notes
                  <ArrowRight size={18} />
                </Link>

                <Link
                  href={user ? "/upload" : "/signin"}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-6 py-4 text-sm font-black text-white/80 transition hover:bg-white/[0.08] hover:text-white"
                >
                  Upload Notes
                  <UploadCloud size={18} />
                </Link>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-white/40">
                    Platform Overview
                  </p>
                  <h2 className="mt-1 text-2xl font-black">Live Dashboard</h2>
                </div>

                <div className="rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-xs font-black text-green-300">
                  Active
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <HeroStat label="Notes" value={stats.notes} />
                <HeroStat label="Students" value={stats.users} />
                <HeroStat label="Subjects" value={stats.subjects} />
                <HeroStat label="Downloads" value={stats.downloads} />
              </div>

              <div className="mt-5 rounded-3xl border border-red-500/20 bg-red-500/10 p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-500/15 text-red-300">
                    <Bot size={24} />
                  </div>

                  <div>
                    <h3 className="font-black">Notique AI</h3>
                    <p className="mt-2 text-sm leading-6 text-white/60">
                      Summarize notes, understand concepts, and get study help
                      inside NotesWallah.
                    </p>

                    <Link
                      href={user ? "/notique" : "/signin"}
                      className="mt-4 inline-flex items-center gap-2 text-sm font-black text-red-300"
                    >
                      Open Notique
                      <ArrowRight size={16} />
                    </Link>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-3">
                {subjectLinks.slice(0, 4).map((subject) => (
                  <Link
                    key={subject}
                    href={user ? `/browse?search=${encodeURIComponent(subject)}` : "/signin"}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm font-bold text-white/70 transition hover:border-red-500/30 hover:text-white"
                  >
                    {subject}
                    <ArrowRight size={15} />
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <section className="mt-6 grid gap-3 md:grid-cols-4">
            <FeatureCard icon={<BookOpen />} title="Browse Notes" text="Find PDFs by class, subject, topic and exam." />
            <FeatureCard icon={<UploadCloud />} title="Upload Material" text="Help students by sharing useful notes." />
            <FeatureCard icon={<Heart />} title="Save Library" text="Bookmark important notes for revision." />
            <FeatureCard icon={<ShieldCheck />} title="Moderated" text="Uploads are reviewed for better quality." />
          </section>

          <section className="mt-6 rounded-[2rem] border border-white/10 bg-white/[0.035] p-5 shadow-2xl shadow-black/20 sm:p-7">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 text-xs font-black text-red-300">
                  <TrendingUp size={16} />
                  Trending Now
                </div>
                <h2 className="mt-4 text-2xl font-black sm:text-4xl">
                  Popular Notes
                </h2>
                <p className="mt-2 text-sm text-white/50">
                  Notes students are viewing, saving and downloading.
                </p>
              </div>

              <Link
                href={user ? "/browse" : "/signin"}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-black text-white/75 transition hover:bg-white/[0.08] hover:text-white"
              >
                View All
                <ArrowRight size={16} />
              </Link>
            </div>

            {trendingNotes.length === 0 ? (
              <EmptyNotes />
            ) : (
              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {trendingNotes.map((note) => (
                  <NoteCard key={note.id} note={note} locked={!user} />
                ))}
              </div>
            )}
          </section>

          <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-5 shadow-2xl shadow-black/20 sm:p-7">
              <h2 className="text-2xl font-black">Latest Uploads</h2>
              <p className="mt-2 text-sm text-white/50">
                Freshly approved notes from the community.
              </p>

              <div className="mt-5 grid gap-3">
                {latestNotes.length === 0 ? (
                  <EmptyBox text="Latest notes will appear here once students upload approved material." />
                ) : (
                  latestNotes.map((note) => (
                    <Link
                      key={note.id}
                      href={user ? `/notes/${note.id}` : "/signin"}
                      className="flex items-center gap-4 rounded-2xl border border-white/10 bg-black/25 p-4 transition hover:border-red-500/30 hover:bg-white/[0.05]"
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-500/10 text-red-300">
                        <FileText size={22} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="line-clamp-1 font-black">
                          {note.title || "Untitled Note"}
                        </h3>
                        <p className="mt-1 line-clamp-1 text-sm text-white/45">
                          {note.subject || "Subject"} • Class{" "}
                          {note.class || "N/A"}
                        </p>
                      </div>

                      <ArrowRight size={16} className="text-white/35" />
                    </Link>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-[2rem] border border-red-500/20 bg-red-500/5 p-5 shadow-2xl shadow-black/20 sm:p-7">
              <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-red-500/10 text-red-300">
                <Users size={26} />
              </div>

              <h2 className="mt-5 text-2xl font-black">
                Built by students, for students
              </h2>

              <p className="mt-3 text-sm leading-7 text-white/60">
                NotesWallah grows when students upload useful material, follow
                good creators, and help each other learn better.
              </p>

              <Link
                href={user ? "/upload" : "/signin"}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-4 text-sm font-black text-white transition hover:bg-red-500"
              >
                Start Contributing
                <ArrowRight size={17} />
              </Link>
            </div>
          </section>

          {!user && (
            <section className="mt-6 rounded-[2rem] border border-white/10 bg-gradient-to-br from-red-600 to-red-950 p-6 shadow-2xl shadow-black/30 sm:p-8 lg:p-10">
              <h2 className="text-3xl font-black sm:text-5xl">
                Unlock your study workspace
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/80">
                Sign in to access notes, save resources, upload PDFs, follow
                creators, and use Notique AI.
              </p>

              <Link
                href="/signin"
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 text-sm font-black text-black transition hover:bg-white/90"
              >
                <Lock size={17} />
                Sign In / Sign Up
              </Link>
            </section>
          )}
        </div>
      </section>
    </main>
  );
}

function GuestNav() {
  return (
    <nav className="sticky top-4 z-50 mx-auto mt-4 flex max-w-7xl items-center justify-between rounded-3xl border border-white/10 bg-black/60 px-4 py-3 text-white shadow-2xl backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <Image
          src="/logo.png"
          alt="NotesWallah"
          width={42}
          height={42}
          className="rounded-xl"
          priority
        />
        <span className="text-lg font-black">
          Notes<span className="text-red-400">Wallah</span>
        </span>
      </div>

      <Link
        href="/signin"
        className="inline-flex items-center gap-2 rounded-2xl bg-red-600 px-4 py-3 text-xs font-black text-white transition hover:bg-red-500"
      >
        <Lock size={15} />
        Sign In
      </Link>
    </nav>
  );
}

function HeroStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
      <p className="text-2xl font-black sm:text-3xl">{value}+</p>
      <p className="mt-1 text-xs font-bold text-white/45">{label}</p>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-5 shadow-2xl shadow-black/20">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-red-500/10 text-red-300">
        {icon}
      </div>
      <h3 className="font-black">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-white/50">{text}</p>
    </div>
  );
}

function NoteCard({ note, locked }: { note: HomeNote; locked: boolean }) {
  return (
    <Link
      href={locked ? "/signin" : `/notes/${note.id}`}
      className="group overflow-hidden rounded-[1.5rem] border border-white/10 bg-black/25 transition hover:border-red-500/30 hover:bg-white/[0.05]"
    >
      <div className="relative h-36 border-b border-white/10 bg-black/30">
        {note.thumbnailUrl ? (
          <Image
            src={note.thumbnailUrl}
            alt={note.title || "Note thumbnail"}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-white/35">
            <FileText size={34} />
          </div>
        )}

        {locked && (
          <div className="absolute right-3 top-3 rounded-full border border-white/10 bg-black/60 px-3 py-1 text-xs font-black text-white/70 backdrop-blur">
            Locked
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="line-clamp-2 font-black">
          {note.title || "Untitled Note"}
        </h3>

        <p className="mt-2 line-clamp-1 text-sm text-white/45">
          {note.subject || "Subject"} • Class {note.class || "N/A"}
        </p>

        <div className="mt-4 flex flex-wrap gap-3 text-xs font-semibold text-white/45">
          <span className="flex items-center gap-1">
            <Download size={13} />
            {getDownloads(note)}
          </span>
          <span className="flex items-center gap-1">
            <Heart size={13} />
            {getLikes(note)}
          </span>
          <span className="flex items-center gap-1">
            <Eye size={13} />
            {getViews(note)}
          </span>
        </div>
      </div>
    </Link>
  );
}

function EmptyNotes() {
  return (
    <div className="mt-6 rounded-[1.5rem] border border-dashed border-white/10 bg-black/20 p-8 text-center">
      <FileText className="mx-auto text-white/35" size={42} />
      <h3 className="mt-4 text-xl font-black">No approved notes yet</h3>
      <p className="mt-2 text-sm text-white/50">
        Trending notes will appear here after approval.
      </p>
    </div>
  );
}

function EmptyBox({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-5 text-sm leading-6 text-white/45">
      {text}
    </div>
  );
}

function getNumber(value: unknown) {
  return typeof value === "number" ? value : 0;
}

function getDownloads(note: HomeNote) {
  return getNumber(note.downloadsCount) || getNumber(note.downloads);
}

function getLikes(note: HomeNote) {
  return getNumber(note.likesCount) || getNumber(note.likes);
}

function getViews(note: HomeNote) {
  return getNumber(note.viewsCount) || getNumber(note.views);
}

function getTrendingScore(note: HomeNote) {
  return getDownloads(note) * 3 + getLikes(note) * 2 + getViews(note);
}

function getCreatedTime(value: unknown) {
  if (!value) return 0;

  if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof value.toDate === "function"
  ) {
    return value.toDate().getTime();
  }

  if (typeof value === "string") {
    return new Date(value).getTime() || 0;
  }

  return 0;
}