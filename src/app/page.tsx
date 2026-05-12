"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Download,
  FileText,
  Search,
  Sparkles,
  UploadCloud,
  Users,
} from "lucide-react";
import { collection, onSnapshot } from "firebase/firestore";

import { db } from "@/firebase/firebase";
import { useAuth } from "@/contexts/AuthContext";

export default function HomePage() {
  const { user } = useAuth();

  const [stats, setStats] = useState({
    notes: 0,
    users: 0,
    subjects: 0,
  });

  useEffect(() => {
    const unsubscribeNotes = onSnapshot(collection(db, "notes"), (notesSnap) => {
      const approvedNotes = notesSnap.docs.filter(
        (doc) => doc.data().status === "approved"
      );

      const subjects = new Set(
        approvedNotes.map((doc) => doc.data().subject)
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

  const subjects = [
    "Physics",
    "Chemistry",
    "Mathematics",
    "Biology",
    "JEE",
    "NEET",
    "Computer",
    "English",
  ];

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
              className="flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-6 py-4 text-sm font-black text-white"
            >
              Browse Notes
              <ArrowRight size={18} />
            </Link>

            <Link
              href={user ? "/upload" : "/signin"}
              className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-4 text-sm font-black text-white/85"
            >
              Upload Notes
              <UploadCloud size={18} />
            </Link>
          </div>

          <Link
            href="/browse"
            className="mt-8 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4"
          >
            <Search size={20} className="text-white/45" />
            <span className="text-sm text-white/40">
              Search notes, subjects, exams...
            </span>
          </Link>

          <div className="no-scrollbar mt-5 flex gap-3 overflow-x-auto pb-1">
            {subjects.map((subject) => (
              <Link
                key={subject}
                href={`/browse?subject=${subject}`}
                className="whitespace-nowrap rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-bold text-white/75"
              >
                {subject}
              </Link>
            ))}
          </div>
        </div>
      </section>

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
              title: "Instant Downloads",
              text: "Get study material quickly without unnecessary complexity.",
              icon: Download,
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

        <div className="mt-8 grid grid-cols-3 gap-3">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-center">
            <p className="text-3xl font-black">{stats.notes}+</p>
            <p className="mt-1 text-xs font-bold text-white/45">Notes</p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-center">
            <p className="text-3xl font-black">{stats.users}+</p>
            <p className="mt-1 text-xs font-bold text-white/45">Students</p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-center">
            <p className="text-3xl font-black">{stats.subjects}+</p>
            <p className="mt-1 text-xs font-bold text-white/45">Subjects</p>
          </div>
        </div>
      </section>
    </main>
  );
}