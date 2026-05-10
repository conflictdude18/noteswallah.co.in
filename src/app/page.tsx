"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Download,
  FileText,
  Flame,
  GraduationCap,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UploadCloud,
  Users,
} from "lucide-react";

import { db } from "@/firebase/firebase";

export default function HomePage() {
  const [stats, setStats] = useState({
    notes: 0,
    users: 0,
    subjects: 0,
  });

  useEffect(() => {
    const notesQuery = query(
      collection(db, "notes"),
      where("status", "==", "approved")
    );

    const unsubscribeNotes = onSnapshot(notesQuery, (notesSnap) => {
      const subjects = new Set(
        notesSnap.docs
          .map((document) => document.data().subject)
          .filter(Boolean)
      );

      setStats((prev) => ({
        ...prev,
        notes: notesSnap.size,
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

  return (
    <main className="space-y-8 pb-24 md:pb-8">
      <section className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#07090d] p-6 shadow-card md:p-10 xl:p-14">
        <div className="absolute right-[-90px] top-[-90px] h-[330px] w-[330px] rounded-full bg-red-500/20 blur-[130px]" />
        <div className="absolute bottom-[-140px] left-[-130px] h-[330px] w-[330px] rounded-full bg-red-700/10 blur-[130px]" />

        <div className="relative z-10 grid gap-10 xl:grid-cols-[1.05fr_0.95fr] xl:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-black text-red-300">
              <Sparkles size={16} />
              India’s Modern Notes Sharing Platform
            </div>

            <h1 className="mt-6 max-w-4xl text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl xl:text-7xl">
              Learn Faster With
              <span className="block bg-gradient-to-r from-white via-red-200 to-red-500 bg-clip-text text-transparent">
                NotesWallah
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-sm leading-7 text-white/65 sm:text-base">
              Upload notes, browse verified PDFs, save study materials and help
              students across India learn smarter together.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link href="/browse" className="btn-primary">
                Browse Notes
                <ArrowRight size={18} />
              </Link>

              <Link href="/upload" className="btn-secondary">
                <UploadCloud size={18} />
                Upload Notes
              </Link>
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              <TrustPill text="Trusted Community" />
              <TrustPill text="Verified PDFs" />
              <TrustPill text="Free Access" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="glass-card rounded-[2rem] p-5 sm:col-span-2">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-white/45">
                    Live Community Stats
                  </p>

                  <h2 className="mt-2 text-3xl font-black text-white">
                    Growing Every Day
                  </h2>
                </div>

                <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-red-300">
                  <TrendingUp size={26} />
                </div>
              </div>
            </div>

            <StatCard icon={<FileText size={24} />} value={stats.notes} label="Approved Notes" />
            <StatCard icon={<Users size={24} />} value={stats.users} label="Registered Students" />
            <StatCard icon={<BookOpen size={24} />} value={stats.subjects} label="Active Subjects" />
            <StatCard icon={<Download size={24} />} value="24/7" label="Free Access" />
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-4">
        <FeatureCard
          icon={<Search size={28} />}
          title="Smart Search"
          description="Find notes quickly by class, subject, topic and keywords."
        />
        <FeatureCard
          icon={<Download size={28} />}
          title="Instant Access"
          description="Open, preview, save and download study PDFs easily."
        />
        <FeatureCard
          icon={<ShieldCheck size={28} />}
          title="Verified Uploads"
          description="Admin-reviewed notes keep the public library cleaner."
        />
        <FeatureCard
          icon={<Users size={28} />}
          title="Student Network"
          description="Follow creators and build a helpful learning community."
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_0.45fr]">
        <div className="glass-card rounded-[2rem] p-6 md:p-10">
          <div className="max-w-3xl">
            <p className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.25em] text-red-300">
              <Flame size={16} />
              How It Works
            </p>

            <h2 className="mt-4 text-4xl font-black tracking-tight text-white md:text-5xl">
              Built for students who share and learn together.
            </h2>

            <p className="mt-5 text-sm leading-7 text-white/60 md:text-base">
              NotesWallah keeps note sharing simple, organized and community
              driven, while giving creators a clean place to publish helpful
              PDFs.
            </p>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            <StepCard
              step="01"
              title="Upload Notes"
              description="Students upload PDFs, handwritten notes, assignments and PYQs."
            />
            <StepCard
              step="02"
              title="Admin Review"
              description="Notes are reviewed before becoming publicly visible."
            />
            <StepCard
              step="03"
              title="Browse & Save"
              description="Students browse, save and download useful study material."
            />
          </div>
        </div>

        <aside className="relative overflow-hidden rounded-[2rem] border border-red-500/20 bg-gradient-to-br from-red-500/15 via-[#0b0f14] to-black p-6 shadow-card">
          <div className="absolute right-[-70px] top-[-70px] h-44 w-44 rounded-full bg-red-500/20 blur-[90px]" />

          <div className="relative z-10">
            <div className="flex h-16 w-16 items-center justify-center rounded-[1.5rem] border border-red-500/20 bg-red-500/10 text-red-300">
              <GraduationCap size={32} />
            </div>

            <h3 className="mt-6 text-3xl font-black text-white">
              Made for Indian students.
            </h3>

            <p className="mt-4 text-sm leading-7 text-white/58">
              Class notes, subject PDFs, PYQs, assignments and revision sheets
              can all live in one clean student-first platform.
            </p>

            <div className="mt-6 grid gap-3">
              <MiniPoint text="CBSE and school notes" />
              <MiniPoint text="Revision PDFs" />
              <MiniPoint text="Community creators" />
            </div>
          </div>
        </aside>
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        <HighlightCard
          icon={<BadgeCheck size={24} />}
          title="Creator Friendly"
          text="Every student can become a contributor by uploading useful material."
        />
        <HighlightCard
          icon={<BookOpen size={24} />}
          title="Clean Library"
          text="Browse notes with a simple, modern and distraction-free interface."
        />
        <HighlightCard
          icon={<Sparkles size={24} />}
          title="Built to Grow"
          text="Premium, creator tools and analytics can be added as the platform scales."
        />
      </section>

      <section className="relative overflow-hidden rounded-[2.5rem] border border-red-500/20 bg-gradient-to-br from-red-500/15 via-[#0b0f14] to-black p-6 shadow-card md:p-10">
        <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-red-500/20 blur-[120px]" />

        <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="max-w-3xl text-4xl font-black tracking-tight text-white md:text-5xl">
              Start sharing knowledge today.
            </h2>

            <p className="mt-5 max-w-2xl text-sm leading-7 text-white/65 md:text-base">
              Upload your best study notes and help students prepare smarter
              for exams.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/upload" className="btn-primary">
              <UploadCloud size={18} />
              Upload Notes
            </Link>

            <Link href="/browse" className="btn-secondary">
              Explore Notes
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function StatCard({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number | string;
  label: string;
}) {
  return (
    <div className="nw-card rounded-[1.7rem] p-5">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-300">
        {icon}
      </div>

      <h3 className="mt-5 text-3xl font-black text-white">{value}</h3>

      <p className="mt-1 text-sm font-semibold text-white/50">{label}</p>
    </div>
  );
}

function TrustPill({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-bold text-white/55">
      <div className="h-2 w-2 rounded-full bg-red-500" />
      {text}
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <article className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.035] p-6 shadow-card backdrop-blur-xl transition hover:-translate-y-1 hover:border-red-500/30 hover:bg-white/[0.055]">
      <div className="absolute right-[-70px] top-[-70px] h-40 w-40 rounded-full bg-red-500/10 blur-[80px] transition group-hover:bg-red-500/20" />

      <div className="relative z-10">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-300">
          {icon}
        </div>

        <h3 className="mt-6 text-xl font-black text-white">{title}</h3>

        <p className="mt-3 text-sm leading-7 text-white/55">
          {description}
        </p>
      </div>
    </article>
  );
}

function StepCard({
  step,
  title,
  description,
}: {
  step: string;
  title: string;
  description: string;
}) {
  return (
    <article className="rounded-[1.8rem] border border-white/10 bg-black/20 p-6">
      <div className="text-5xl font-black text-red-500">{step}</div>

      <h3 className="mt-6 text-2xl font-black text-white">{title}</h3>

      <p className="mt-4 text-sm leading-7 text-white/60">
        {description}
      </p>
    </article>
  );
}

function MiniPoint({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-bold text-white/65">
      <BadgeCheck size={16} className="text-green-400" />
      {text}
    </div>
  );
}

function HighlightCard({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <article className="glass-card rounded-[2rem] p-6">
      <div className="flex h-13 w-13 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-300">
        {icon}
      </div>

      <h3 className="mt-5 text-xl font-black text-white">{title}</h3>

      <p className="mt-3 text-sm leading-7 text-white/55">{text}</p>
    </article>
  );
}