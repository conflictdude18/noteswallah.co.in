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
      .slice(0, 4);
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
      .slice(0, 10);

    return subjects.length
      ? subjects
      : [
          { label: "Physics", count: 0 },
          { label: "Chemistry", count: 0 },
          { label: "Mathematics", count: 0 },
          { label: "Biology", count: 0 },
          { label: "JEE", count: 0 },
          { label: "NEET", count: 0 },
        ];
  }, [notes]);

  return (
    <div
      className={
        user
          ? "mx-auto w-full max-w-7xl space-y-8 px-4 pb-24 text-white sm:px-6 lg:px-8"
          : "min-h-screen overflow-x-hidden bg-[#050505] text-white"
      }
    >
      {!user && <GuestNav />}

      <div
        className={
          !user
            ? "mx-auto w-full max-w-7xl space-y-8 px-4 py-6 sm:px-6 lg:px-8"
            : "space-y-8"
        }
      >
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute -left-20 -top-24 h-72 w-72 rounded-full bg-red-500/15 blur-[120px]" />
          <div className="pointer-events-none absolute right-0 top-20 h-72 w-72 rounded-full bg-red-900/20 blur-[120px]" />

          <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)] lg:items-end">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 text-xs font-black text-red-300">
                <Sparkles size={16} />
                India’s Student Knowledge Network
              </div>

              <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-tight sm:text-6xl lg:text-7xl">
                Study smarter with{" "}
                <span className="text-red-400">NotesWallah</span>
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/58 sm:text-base">
                Discover quality notes, upload study material, save resources,
                follow creators, and use Notique AI to learn faster.
              </p>

              <Link
                href={user ? "/browse" : "/signin"}
                className="mt-6 flex max-w-2xl items-center gap-3 rounded-3xl border border-white/10 bg-white/[0.04] px-4 py-4 transition hover:border-red-500/30 hover:bg-white/[0.06]"
              >
                <Search size={20} className="text-white/40" />
                <span className="text-sm font-semibold text-white/45">
                  Search notes, subjects, chapters, exams...
                </span>
              </Link>

              <div className="mt-4 grid grid-cols-2 gap-3 sm:flex">
                <Link
                  href={user ? "/browse" : "/signin"}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-4 text-sm font-black text-white transition hover:bg-red-500"
                >
                  Browse Notes
                  <ArrowRight size={18} />
                </Link>

                <Link
                  href={user ? "/upload" : "/signin"}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-sm font-black text-white/80 transition hover:border-red-500/30 hover:text-white"
                >
                  Upload Notes
                  <UploadCloud size={18} />
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 lg:self-end">
              <HeroStat label="Notes" value={stats.notes} />
              <HeroStat label="Students" value={stats.users} />
              <HeroStat label="Subjects" value={stats.subjects} />
              <HeroStat label="Downloads" value={stats.downloads} />
            </div>
          </div>
        </section>

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <FeatureCard icon={<BookOpen />} title="Browse Notes" text="Find PDFs by class, subject, topic and exam." />
          <FeatureCard icon={<UploadCloud />} title="Upload Material" text="Help students by sharing useful notes." />
          <FeatureCard icon={<Heart />} title="Save Library" text="Bookmark important notes for revision." />
          <FeatureCard icon={<ShieldCheck />} title="Moderated" text="Uploads are reviewed for better quality." />
        </section>

        <section>
          <SectionHeader
            icon={<TrendingUp size={16} />}
            eyebrow="Trending Now"
            title="Popular Notes"
            description="Notes students are viewing, saving and downloading."
            actionHref={user ? "/browse" : "/signin"}
            actionLabel="View All"
          />

          {trendingNotes.length === 0 ? (
            <EmptyNotes />
          ) : (
            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {trendingNotes.map((note) => (
                <NoteCard key={note.id} note={note} locked={!user} />
              ))}
            </div>
          )}
        </section>

        <section className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0">
            <SectionHeader
              icon={<FileText size={16} />}
              eyebrow="Fresh Uploads"
              title="Latest Uploads"
              description="Freshly approved notes from the community."
            />

            <div className="mt-5 divide-y divide-white/10 border-y border-white/10">
              {latestNotes.length === 0 ? (
                <EmptyBox text="Latest notes will appear here once students upload approved material." />
              ) : (
                latestNotes.map((note) => (
                  <Link
                    key={note.id}
                    href={user ? `/notes/${note.id}` : "/signin"}
                    className="flex items-center gap-4 py-4 transition hover:bg-white/[0.025] sm:px-2"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-500/10 text-red-300">
                      <FileText size={22} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="line-clamp-1 font-black">
                        {note.title || "Untitled Note"}
                      </h3>
                      <p className="mt-1 line-clamp-1 text-sm text-white/45">
                        {note.subject || "Subject"} • Class {note.class || "N/A"}
                      </p>
                    </div>

                    <ArrowRight size={16} className="shrink-0 text-white/35" />
                  </Link>
                ))
              )}
            </div>
          </div>

          <aside className="min-w-0 space-y-5">
            <div className="rounded-3xl border border-red-500/20 bg-red-500/8 p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-500/15 text-red-300">
                  <Bot size={24} />
                </div>

                <div className="min-w-0">
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

            <div>
              <SectionHeader
                icon={<BookOpen size={16} />}
                eyebrow="Subjects"
                title="Popular Subjects"
              />

              <div className="mt-4 grid gap-2">
                {subjectLinks.slice(0, 6).map((subject) => (
                  <Link
                    key={subject.label}
                    href={
                      user
                        ? `/browse?search=${encodeURIComponent(subject.label)}`
                        : "/signin"
                    }
                    className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm font-bold text-white/70 transition hover:border-red-500/30 hover:bg-white/[0.055] hover:text-white"
                  >
                    <span className="min-w-0 truncate">{subject.label}</span>
                    <span className="flex shrink-0 items-center gap-2 text-xs text-white/35">
                      {subject.count > 0 ? `${subject.count} notes` : "Explore"}
                      <ArrowRight size={14} />
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-5 sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-black text-red-300">
                <Users size={18} />
                Built by students, for students
              </div>

              <h2 className="mt-3 text-2xl font-black sm:text-3xl">
                Share notes and help the community grow.
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">
                NotesWallah grows when students upload useful material, follow
                good creators, and help each other learn better.
              </p>
            </div>

            <Link
              href={user ? "/upload" : "/signin"}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-4 text-sm font-black text-white transition hover:bg-red-500"
            >
              Start Contributing
              <ArrowRight size={17} />
            </Link>
          </div>
        </section>

        {!user && (
          <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-red-600 to-red-950 p-6 sm:p-8 lg:p-10">
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
    </div>
  );
}

function GuestNav() {
  return (
    <nav className="sticky top-4 z-50 mx-auto flex w-[calc(100%-2rem)] max-w-7xl items-center justify-between rounded-3xl border border-white/10 bg-black/70 px-4 py-3 text-white backdrop-blur-xl sm:w-[calc(100%-3rem)]">
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

function SectionHeader({
  icon,
  eyebrow,
  title,
  description,
  actionHref,
  actionLabel,
}: {
  icon?: React.ReactNode;
  eyebrow: string;
  title: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-red-300">
          {icon}
          {eyebrow}
        </p>

        <h2 className="mt-2 text-2xl font-black sm:text-3xl">{title}</h2>

        {description && (
          <p className="mt-1 text-sm text-white/50">{description}</p>
        )}
      </div>

      {actionHref && actionLabel && (
        <Link
          href={actionHref}
          className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-black text-white/65 transition hover:border-red-500/30 hover:text-white"
        >
          {actionLabel}
          <ArrowRight size={16} />
        </Link>
      )}
    </div>
  );
}

function HeroStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-4">
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
    <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
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
      className="group overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] transition hover:border-red-500/30 hover:bg-white/[0.055]"
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
    <div className="mt-5 rounded-3xl border border-dashed border-white/10 bg-white/[0.025] p-8 text-center">
      <FileText className="mx-auto text-white/35" size={42} />
      <h3 className="mt-4 text-xl font-black">No approved notes yet</h3>
      <p className="mt-2 text-sm text-white/50">
        Trending notes will appear here after approval.
      </p>
    </div>
  );
}

function EmptyBox({ text }: { text: string }) {
  return <div className="py-5 text-sm leading-6 text-white/45">{text}</div>;
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