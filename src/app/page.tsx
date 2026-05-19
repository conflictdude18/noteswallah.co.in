"use client";
import { motion, useMotionValue } from "framer-motion";
import { TypeAnimation } from "react-type-animation";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Bot,
  Download,
  Eye,
  FileText,
  Flame,
  Heart,
  Lock,
  Search,
  ShieldCheck,
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

const fadeUp = {
  hidden: { opacity: 0, y: 26 },
  visible: { opacity: 1, y: 0 },
};

export default function HomePage() {
  const { user } = useAuth();

    const [loadingScreen, setLoadingScreen] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoadingScreen(false);
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  if (loadingScreen) {
    return (
      <main className="flex min-h-screen items-center justify-center overflow-hidden bg-[#050607] text-white">
        <div className="relative text-center">
          <div className="absolute inset-0 rounded-full bg-red-600/20 blur-3xl" />

          <div className="relative">
            <Image
              src="/logo.png"
              alt="NotesWallah"
              width={86}
              height={86}
              className="mx-auto animate-pulse rounded-3xl"
              priority
            />

            <h1 className="mt-5 text-4xl font-black">
              Notes<span className="text-red-400">Wallah</span>
            </h1>

            <p className="mt-2 text-sm text-white/45">
              Preparing your study space...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!user) {
    return <GuestLandingPage />;
  }

  return <LoggedInHomePage />;
}

function GuestLandingPage() {
const [stats, setStats] = useState({
  notes: 0,
  users: 0,
  subjects: 0,
});

useEffect(() => {
  const unsubscribeNotes = onSnapshot(collection(db, "notes"), (notesSnap) => {
    const approvedNotes = notesSnap.docs
      .map((doc) => doc.data())
      .filter((note) => note.status === "approved");

    const subjects = new Set(
      approvedNotes.map((note) => note.subject).filter(Boolean)
    );

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

    const mouseX = useMotionValue(0);
      const mouseY = useMotionValue(0);
      function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
        mouseX.set(e.clientX);
        mouseY.set(e.clientY);
      }
  return (
    <main className="min-h-screen overflow-hidden bg-[#050607] text-white">
      <section
        onMouseMove={handleMouseMove}
        className="relative min-h-screen overflow-hidden px-5 py-6 md:px-8"
      >
        <div className="absolute left-1/2 top-0 h-80 w-80 -translate-x-1/2 rounded-full bg-red-600/20 blur-[130px]" />
        <div className="absolute bottom-10 right-0 h-72 w-72 rounded-full bg-purple-600/20 blur-[130px]" />

        <motion.div
          className="pointer-events-none absolute hidden h-[320px] w-[320px] rounded-full bg-red-500/10 blur-3xl md:block"
          style={{
            x: mouseX,
            y: mouseY,
            translateX: "-50%",
            translateY: "-50%",
          }}
        />
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {Array.from({ length: 18 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute h-2 w-2 rounded-full bg-red-300/45 shadow-[0_0_18px_rgba(248,113,113,0.8)]"
              initial={{
                opacity: 0,
                y: 40,
              }}
              animate={{
                opacity: [0.25, 0.8, 0.25],
                y: [0, -80],
              }}
              transition={{
                duration: 4 + (i % 5),
                repeat: Infinity,
                delay: i * 0.3,
                ease: "easeInOut",
              }}
              style={{
                left: `${(i * 13) % 100}%`,
                top: `${(i * 17) % 100}%`,
              }}
            />
          ))}
        </div>

        <nav className="sticky top-4 z-50 mx-auto flex max-w-6xl items-center justify-between rounded-3xl border border-white/10 bg-black/25 px-4 py-3 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="NotesWallah"
              width={44}
              height={44}
              className="rounded-xl"
              priority
            />
            <span className="text-xl font-black">
              Notes<span className="text-red-400">Wallah</span>
            </span>
          </div>

          <Link
            href="/signin"
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-xs font-black text-white transition hover:border-red-500/40 hover:bg-red-500/15"
          >
            <Lock size={15} />
            Sign In / Sign Up
          </Link>
        </nav>

        <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-12 pb-16 pt-20 md:grid-cols-[1fr_0.9fr] md:pb-24 md:pt-28">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            transition={{ duration: 0.7 }}
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 text-xs font-black text-red-200">
              <Sparkles size={14} />
              India’s Smart Notes Sharing Platform
            </div>

            <h1 className="min-h-[120px] text-4xl font-black leading-tight tracking-tight md:min-h-[150px] md:text-6xl">
              <TypeAnimation
                sequence={[
                  "Share Notes.",
                  1400,
                  "Learn Faster.",
                  1400,
                  "Crack Exams.",
                  1400,
                  "Help Students.",
                  1400,
                ]}
                wrapper="span"
                speed={45}
                repeat={Infinity}
                className="block"
              />

              <span className="block bg-gradient-to-r from-red-500 via-red-300 to-white bg-clip-text text-transparent">
                With NotesWallah
              </span>
            </h1>

            <p className="mt-5 max-w-2xl text-sm leading-7 text-white/65 md:text-base">
              NotesWallah is a student-powered platform where learners can
              upload notes, download study material, save resources, follow
              creators and grow together.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/signin"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-6 py-4 text-sm font-black text-white transition hover:bg-red-500"
              >
                Unlock NotesWallah
                <ArrowRight size={18} />
              </Link>

              <a
                href="#about"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-4 text-sm font-black text-white/80 transition hover:border-red-500/30 hover:bg-white/[0.07]"
              >
                Learn More
              </a>
            </div>

            <div className="mt-8 grid grid-cols-3 gap-3">
            <StatsCard value={`${stats.notes}+`} label="Notes" />
            <StatsCard value={`${stats.users}+`} label="Students" />
            <StatsCard value={`${stats.subjects}+`} label="Subjects" />
            </div>

            <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <MiniTrust icon={Users} label="Built for Students" />
              <MiniTrust icon={ShieldCheck} label="Community Powered" />
              <MiniTrust icon={Bot} label="Notique AI Ready" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="relative"
          >
            <div className="absolute -inset-6 rounded-[3rem] bg-red-600/20 blur-3xl" />

            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl backdrop-blur">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-white/40">Preview</p>
                  <h2 className="font-black">Student Dashboard</h2>
                </div>

                <div className="rounded-full bg-red-500/15 px-3 py-1 text-xs font-black text-red-200">
                  Locked
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/30 p-4">
                <div className="mb-4 flex items-center gap-3 rounded-2xl bg-white/[0.04] px-4 py-3 text-sm text-white/35">
                  <Search size={17} />
                  Search notes, subjects, topics...
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {["Physics", "Chemistry", "Biology", "Maths"].map((item) => (
                    <div
                      key={item}
                      className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
                    >
                      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/15 text-red-300">
                        <FileText size={20} />
                      </div>
                      <p className="font-black">{item}</p>
                      <p className="mt-1 text-xs text-white/40">
                        Notes, PDFs & summaries
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 rounded-3xl border border-red-500/20 bg-red-500/10 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-500/15 text-red-300">
                    <Bot size={22} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-black leading-none">Notique AI</h3>

                      <span className="rounded-full bg-green-500/15 px-2 py-0.5 text-[10px] font-bold leading-none text-green-300">
                        ONLINE
                      </span>
                    </div>

                    <div className="mt-3 space-y-2">
                      <div className="w-fit max-w-full rounded-2xl rounded-bl-sm bg-black/30 px-3 py-2 text-xs text-white/75">
                        Explain electrostatics briefly.
                      </div>

                      <motion.div
                        initial={{ opacity: 0.4 }}
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1.8, repeat: Infinity }}
                        className="w-fit max-w-full rounded-2xl rounded-tl-sm bg-red-500/15 px-3 py-2 text-xs text-red-100"
                      >
                        Electrostatics studies stationary electric charges and their interactions...
                      </motion.div>
                    </div>
                  </div>
                </div>
              </div>
              
            </div>
          </motion.div>
        </div>
      </section>

      <section
          id="about"
          className="relative z-30 mx-auto max-w-6xl px-5 pb-16 pt-20 md:-mt-24 md:px-8 md:pt-10"
        >
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.25 }}
          variants={fadeUp}
          transition={{ duration: 0.6 }}
        >
          <h2 className="relative z-30 text-3xl font-black leading-tight md:text-4xl">
            Everything students need, locked safely behind login.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/55">
            Guests can learn what NotesWallah does. After signing in, students
            can access the complete platform.
          </p>
        </motion.div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            {
              title: "Upload & Share",
              text: "Students can upload useful notes and help others study better.",
              icon: UploadCloud,
            },
            {
              title: "Download Notes",
              text: "Access notes, PDFs, summaries and study material after login.",
              icon: Download,
            },
            {
              title: "Save & Organize",
              text: "Bookmark important notes and build a personal study library.",
              icon: Heart,
            },
            {
              title: "Follow Creators",
              text: "Follow good uploaders and discover more helpful resources.",
              icon: Users,
            },
            {
              title: "Smart Search",
              text: "Find notes by subject, class, exam, topic and category.",
              icon: Search,
            },
            {
              title: "Notique AI",
              text: "A future-ready AI assistant to support students while learning.",
              icon: Bot,
            },
          ].map((item, index) => {
            const Icon = item.icon;

            return (
              <motion.div
                key={item.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.25 }}
                variants={fadeUp}
                transition={{ duration: 0.45, delay: index * 0.06 }}
                className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 transition duration-300 hover:-translate-y-2 hover:rotate-[0.4deg] hover:border-red-500/30 hover:bg-white/[0.07] hover:shadow-[0_20px_80px_rgba(239,68,68,0.18)] md:hover:scale-[1.02]"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/15 text-red-300">
                  <Icon size={23} />
                </div>
                <h3 className="text-lg font-black">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/55">
                  {item.text}
                </p>
              </motion.div>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-16 md:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.25 }}
          variants={fadeUp}
          transition={{ duration: 0.6 }}
          className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-red-600 to-red-900 p-6 md:p-10"
        >
          <h2 className="text-3xl font-black leading-tight">
            Ready to unlock NotesWallah?
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/80">
            Sign in to access notes, upload resources, save material and become
            part of the student learning community.
          </p>

          <Link
            href="/signin"
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 text-sm font-black text-black transition hover:scale-[1.02] hover:bg-white/90"
          >
            <span className="text-black">
              Sign In / Sign Up
            </span>

            <ArrowRight size={18} className="text-black" />
          </Link>
        </motion.div>
      </section>
    </main>
  );
}

function LoggedInHomePage() {
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
    return [...notes]
      .sort((a, b) => getDownloads(b) - getDownloads(a))
      .slice(0, 3);
  }, [notes]);

  const topSubjects = useMemo(() => {
    const subjectMap = new Map<string, { label: string; count: number }>();

    notes.forEach((note) => {
      if (!note.subject?.trim()) return;

      const cleaned = note.subject.trim();
      const normalized = cleaned.toLowerCase();
      const existing = subjectMap.get(normalized);

      if (existing) {
        existing.count += 1;
      } else {
        subjectMap.set(normalized, {
          label: cleaned,
          count: 1,
        });
      }
    });

    return Array.from(subjectMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
      .map((item) => item.label);
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

  const subjectLinks = topSubjects.length > 0 ? topSubjects : fallbackSubjects;

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
      <section className="mx-auto my-12 max-w-6xl rounded-[2rem] border border-yellow-500/20 bg-gradient-to-br from-yellow-500/10 to-red-500/10 p-6 md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/20 bg-yellow-500/10 px-4 py-2 text-xs font-black text-yellow-300">
              <div className="relative h-4 w-4 overflow-hidden rounded-sm">
                <Image
                  src="/notique-white.png"
                  alt="Notique AI"
                  fill
                  sizes="16px"
                  className="object-cover"
                />
              </div>
              POWERED BY NOTIQUE AI
            </div>

            <h2 className="mt-4 text-3xl font-black text-white md:text-5xl">
              Turn Long Notes Into Smart Revision Summaries
            </h2>

            <p className="mt-4 text-sm leading-7 text-white/65 md:text-base">
              Paste your own study notes or use uploaded notes from NotesWallah.
              Notique AI instantly creates revision-focused summaries, key points,
              and quick recall notes for exams.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/ai-summary"
                className="rounded-2xl bg-red-500 px-5 py-3 font-black text-white transition hover:bg-red-600"
              >
                Try Notique AI
              </Link>

              <Link
                href="/premium"
                className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-black text-white/80 transition hover:bg-white/10"
              >
                Unlock Premium
              </Link>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-black/30 p-5 lg:max-w-md">
            <div className="flex items-center gap-2">
              <Sparkles className="text-yellow-300" />
              <h3 className="font-black text-white">
                Example Output
              </h3>
            </div>

            <div className="mt-4 space-y-3 text-sm text-white/70">
              <p>
                Topic Overview:
                Photosynthesis converts light energy into chemical energy.
              </p>

              <p>
                Key Points:
                • Chlorophyll absorbs sunlight
                • Occurs in chloroplasts
                • Produces oxygen and glucose
              </p>

              <p>
                Quick Recall:
                Plants use sunlight to make food.
              </p>
            </div>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-5 pb-8 md:px-8">
        <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-red-600 to-red-800 p-6 md:p-10">
          <h2 className="text-3xl font-black leading-tight">
            Welcome back to NotesWallah.
          </h2>

          <p className="mt-3 text-sm leading-7 text-white/80">
            Continue exploring notes, uploading resources and helping other
            students.
          </p>

          <Link
            href="/dashboard"
            className="mt-6 inline-flex w-fit items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 text-sm font-black text-black transition hover:scale-[1.02]"
          >
            <span className="text-black">Go to Dashboard</span>
            <ArrowRight size={18} className="text-black" />
          </Link>
        </div>
      </section>
    </main>
  );
}

function MiniTrust({
  icon: Icon,
  label,
}: {
  icon: typeof Users;
  label: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
      <Icon size={18} className="mb-2 text-red-300" />
      <p className="text-[11px] font-bold text-white/60">{label}</p>
    </div>
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

function StatsCard({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45 }}
      className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-center backdrop-blur-sm"
    >
      <p className="text-2xl font-black text-white">
        {value}
      </p>

      <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-white/45">
        {label}
      </p>
    </motion.div>
  );
}