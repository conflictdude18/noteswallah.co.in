"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Download,
  Eye,
  FileText,
  Flame,
  Heart,
  Search,
  Sparkles,
  TrendingUp,
  UploadCloud,
  Users,
} from "lucide-react";
import { collection, onSnapshot } from "firebase/firestore";

import { db } from "@/firebase/firebase";
import { useAuth } from "@/contexts/AuthContext";
import type { Note } from "@/types/note";

type HomeNote = Note & {
  id: string;
  board?: string;
  type?: string;
  topic?: string;
  views?: number;
  likes?: number;
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
  });

  useEffect(() => {
    const unsubscribeNotes = onSnapshot(collection(db, "notes"), (notesSnap) => {
      const approvedNotes: HomeNote[] = notesSnap.docs
        .map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<HomeNote, "id">),
        }))
        .filter((note) => note.status === "approved");

      const subjects = new Set(
        approvedNotes.map((note) => note.subject).filter(Boolean)
      );

      setNotes(approvedNotes);

      setStats((prev) => ({
        ...prev,
        notes: approvedNotes.length,
        subjects: subjects.size,
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
      .slice(0, 3);
  }, [notes]);

  const latestNotes = useMemo(() => {
    return [...notes]
      .sort((a, b) => getCreatedTime(b.createdAt) - getCreatedTime(a.createdAt))
      .slice(0, 3);
  }, [notes]);

  const mostDownloadedNotes = useMemo(() => {
    return [...notes].sort((a, b) => getDownloads(b) - getDownloads(a)).slice(0, 3);
  }, [notes]);

  const topSubjects = useMemo(() => {
    const subjectMap = new Map<string, number>();

    notes.forEach((note) => {
      if (!note.subject) return;
      subjectMap.set(note.subject, (subjectMap.get(note.subject) || 0) + 1);
    });

    return Array.from(subjectMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
  }, [notes]);

  const fallbackSubjects = [
    "Physics",
    "Chemistry",
    "Mathematics",
    "Biology",
    "JEE",
    "NEET",
    "Computer",
    "English",
  ];

  const subjectLinks =
    topSubjects.length > 0
      ? topSubjects.map(([subject]) => subject)
      : fallbackSubjects;

  return (
    <main className="min-h-screen overflow-hidden bg-[#050607] pb-24 text-white md:pb-0">
      <section className="relative border-b border-white/10">
        <div className="absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-red-600/20 blur-[120px]" />

        <div className="mx-auto flex max-w-6xl flex-col px-5 pb-10 pt-8 md:px-8 md:pb-16 md:pt-16">
          <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 text-xs font-bold text-red-200">
            <Sparkles size={14} />
            India’s Student Notes Community
          </div>

          <h1 className="text-4xl font-black leading-tight tracking-tight md:text-6xl">
            Find & Share
            <span className="block bg-gradient-to-r from-red-500 to-red-300 bg-clip-text text-transparent">
              Smart Notes
            </span>
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/65 md:text-base">
            NotesWallah helps students upload, discover and download quality
            notes for school, boards, JEE, NEET and more.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/browse"
              className="flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-6 py-4 text-sm font-black text-white transition hover:bg-red-500"
            >
              Browse Notes
              <ArrowRight size={18} />
            </Link>

            <Link
              href={user ? "/upload" : "/signin"}
              className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-4 text-sm font-black text-white/85 transition hover:border-red-500/30 hover:bg-white/[0.07]"
            >
              Upload Notes
              <UploadCloud size={18} />
            </Link>
          </div>

          <Link
            href="/browse"
            className="mt-8 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 transition hover:border-red-500/30"
          >
            <Search size={20} className="text-white/45" />
            <span className="text-sm text-white/40">
              Search notes, subjects, exams, chapters...
            </span>
          </Link>

          <div className="no-scrollbar mt-5 flex gap-3 overflow-x-auto pb-1">
            {subjectLinks.map((subject) => (
              <Link
                key={subject}
                href={`/browse?subject=${encodeURIComponent(subject)}`}
                className="whitespace-nowrap rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-bold text-white/75 transition hover:border-red-500/30 hover:text-white"
              >
                {subject}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-8 md:px-8 md:py-12">
        <div className="grid grid-cols-3 gap-3">
          <StatBox value={stats.notes} label="Notes" />
          <StatBox value={stats.users} label="Students" />
          <StatBox value={stats.subjects} label="Subjects" />
        </div>
      </section>

      <NotesSection
        title="Trending Notes"
        subtitle="Popular notes based on downloads, likes and views"
        icon={Flame}
        notes={trendingNotes}
        emptyText="Trending notes will appear after students start downloading and liking notes."
      />

      <NotesSection
        title="Latest Uploads"
        subtitle="Recently approved study material from the community"
        icon={Sparkles}
        notes={latestNotes}
        emptyText="Latest approved notes will appear here."
      />

      <NotesSection
        title="Most Downloaded"
        subtitle="Notes students are using the most"
        icon={TrendingUp}
        notes={mostDownloadedNotes}
        emptyText="Most downloaded notes will appear here."
      />

      <section className="mx-auto max-w-6xl px-5 py-8 md:px-8 md:py-14">
        <h2 className="text-2xl font-black">Why Students Use It</h2>
        <p className="mt-1 text-sm text-white/45">
          Fast, simple and community-driven learning
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            {
              title: "Quality Notes",
              text: "Upload and discover handwritten notes, summaries and study PDFs.",
              icon: FileText,
            },
            {
              title: "Smart Discovery",
              text: "Find notes faster using subject, class, board and topic-based filtering.",
              icon: Search,
            },
            {
              title: "Student Community",
              text: "Follow uploaders, share resources and help students learn better.",
              icon: Users,
            },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className="rounded-3xl border border-white/10 bg-white/[0.04] p-5"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/15 text-red-300">
                  <Icon size={24} />
                </div>

                <h3 className="text-lg font-black">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/55">
                  {item.text}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-8 md:px-8">
        <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-red-600 to-red-800 p-6 md:p-10">
          <h2 className="text-3xl font-black leading-tight">
            {user
              ? "Welcome back to NotesWallah."
              : "Join the growing NotesWallah student network."}
          </h2>

          <p className="mt-3 text-sm leading-7 text-white/80">
            {user
              ? "Continue exploring notes, uploading resources and helping other students."
              : "Upload notes, support students and build your academic profile."}
          </p>

          <Link
            href={user ? "/dashboard" : "/signup"}
            className="mt-6 inline-flex w-fit items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 text-sm font-black text-black transition hover:scale-[1.02]"
          >
            <span className="text-black">
              {user ? "Go to Dashboard" : "Create Account"}
            </span>

            <ArrowRight size={18} className="text-black" />
          </Link>
        </div>
      </section>
    </main>
  );
}

function NotesSection({
  title,
  subtitle,
  icon: Icon,
  notes,
  emptyText,
}: {
  title: string;
  subtitle: string;
  icon: typeof Flame;
  notes: HomeNote[];
  emptyText: string;
}) {
  return (
    <section className="mx-auto max-w-6xl px-5 py-6 md:px-8">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-red-300">
            <Icon size={15} />
            Featured
          </p>

          <h2 className="mt-2 text-2xl font-black">{title}</h2>
          <p className="mt-1 text-sm text-white/45">{subtitle}</p>
        </div>

        <Link
          href="/browse"
          className="hidden rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-xs font-black text-white/70 transition hover:border-red-500/30 hover:text-white sm:inline-flex"
        >
          View All
        </Link>
      </div>

      {notes.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-sm text-white/45">
          {emptyText}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {notes.map((note) => (
            <NotePreviewCard key={note.id} note={note} />
          ))}
        </div>
      )}
    </section>
  );
}

function NotePreviewCard({ note }: { note: HomeNote }) {
  return (
    <Link
      href={`/notes/${note.id}`}
      className="group rounded-3xl border border-white/10 bg-white/[0.04] p-5 transition hover:border-red-500/35 hover:bg-white/[0.07]"
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/15 text-red-300">
        <BookOpen size={23} />
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        <span className="rounded-full border border-red-500/20 bg-red-500/10 px-2.5 py-1 text-[10px] font-bold text-red-200">
          {note.subject || "General"}
        </span>

        <span className="rounded-full border border-white/10 bg-black/25 px-2.5 py-1 text-[10px] font-semibold text-white/55">
          {formatClassLabel(note.class)}
        </span>

        {note.type && (
          <span className="rounded-full border border-white/10 bg-black/25 px-2.5 py-1 text-[10px] font-semibold text-white/55">
            {note.type}
          </span>
        )}
      </div>

      <h3 className="line-clamp-2 text-base font-black leading-snug transition group-hover:text-red-300">
        {note.title || "Untitled Note"}
      </h3>

      <p className="mt-2 line-clamp-2 text-xs leading-6 text-white/50">
        {note.description || note.topic || "No description added."}
      </p>

      <div className="mt-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-xs font-semibold text-white/45">
          <span className="flex items-center gap-1">
            <Download size={14} />
            {getDownloads(note)}
          </span>

          <span className="flex items-center gap-1">
            <Heart size={14} />
            {getNumber(note.likes)}
          </span>

          <span className="flex items-center gap-1">
            <Eye size={14} />
            {getNumber(note.views)}
          </span>
        </div>

        <ArrowRight
          size={17}
          className="text-white/35 transition group-hover:translate-x-1 group-hover:text-red-300"
        />
      </div>
    </Link>
  );
}

function StatBox({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-center">
      <p className="text-3xl font-black">{value}+</p>
      <p className="mt-1 text-xs font-bold text-white/45">{label}</p>
    </div>
  );
}

function getNumber(value: unknown) {
  return typeof value === "number" ? value : 0;
}

function getDownloads(note: HomeNote) {
  return getNumber(note.downloads) || getNumber(note.downloadsCount);
}

function getTrendingScore(note: HomeNote) {
  const downloads = getDownloads(note);
  const likes = getNumber(note.likes);
  const views = getNumber(note.views);
  const createdTime = getCreatedTime(note.createdAt);

  const ageInDays = createdTime
    ? Math.max(1, (Date.now() - createdTime) / (1000 * 60 * 60 * 24))
    : 30;

  const engagementScore = downloads * 3 + likes * 2 + views;
  const recencyBoost = 20 / ageInDays;

  return engagementScore + recencyBoost;
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

function normalizeClassName(value?: string) {
  const match = value?.match(/\d+/);
  return match ? match[0] : (value || "").toLowerCase().trim();
}

function formatClassLabel(value?: string) {
  const normalized = normalizeClassName(value);

  if (!normalized) return "Class not set";
  if (/^\d+$/.test(normalized)) return `Class ${normalized}`;

  return value || "Class not set";
}