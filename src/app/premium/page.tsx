"use client";

import type React from "react";
import Link from "next/link";
import { useState } from "react";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { toast } from "sonner";
import {
  BadgeCheck,
  BarChart3,
  Bot,
  BrainCircuit,
  CheckCircle2,
  Crown,
  Flame,
  ImageIcon,
  MessageSquare,
  Rocket,
  ShieldCheck,
  Sparkles,
  Star,
  UploadCloud,
  Zap,
} from "lucide-react";

import { db } from "@/firebase/firebase";
import { useAuth } from "@/contexts/AuthContext";

const premiumFeatures = [
  {
    icon: UploadCloud,
    title: "Priority Uploads",
    description: "Premium creators get faster review and better upload flow.",
  },
  {
    icon: Star,
    title: "Creator Badge",
    description: "Stand out with a premium badge on your public profile.",
  },
  {
    icon: BarChart3,
    title: "Advanced Analytics",
    description: "Track downloads, growth, reach and note performance.",
  },
  {
    icon: Zap,
    title: "Boosted Reach",
    description: "Get better visibility across featured sections.",
  },
];

const notiqueFeatures = [
  "Unlimited Notique AI chats",
  "Unlimited PDF summarization",
  "Image understanding support",
  "AI-generated study plans",
  "Priority AI access",
  "Early access to future AI tools",
];

const checklist = [
  "Priority moderation",
  "Verified creator badge",
  "Creator insights dashboard",
  "Featured upload placements",
  "Early access to new tools",
  "Premium profile styling",
];

export default function PremiumPage() {
  const { user } = useAuth();
  const [joining, setJoining] = useState(false);

  async function joinNotiqueWaitlist() {
    if (!user) {
      toast.error("Please sign in to join the waitlist.");
      return;
    }

    try {
      setJoining(true);

      await setDoc(
        doc(db, "premiumWaitlist", user.uid),
        {
          userId: user.uid,
          email: user.email || "",
          displayName: user.displayName || "NotesWallah User",
          photoURL: user.photoURL || "",
          plan: "notique_premium",
          expectedPrice: 49,
          status: "interested",
          joinedAt: serverTimestamp(),
        },
        { merge: true }
      );

      toast.success("You joined the Notique Premium waitlist.");
    } catch (error) {
      console.error("WAITLIST ERROR:", error);
      toast.error("Could not join waitlist. Try again.");
    } finally {
      setJoining(false);
    }
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#050505] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl pb-28 md:pb-10">
        <section className="relative overflow-hidden rounded-[2rem] border border-yellow-500/20 bg-gradient-to-br from-yellow-500/10 via-white/[0.04] to-red-500/10 p-5 shadow-2xl shadow-black/30 sm:p-7 lg:p-9">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-yellow-500/20 blur-3xl" />

          <div className="relative grid gap-6 xl:grid-cols-[1fr_360px] xl:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/25 bg-yellow-500/10 px-4 py-2 text-xs font-black text-yellow-300">
                <Crown size={16} />
                NotesWallah Premium
              </div>

              <h1 className="mt-5 text-4xl font-black leading-tight tracking-tight sm:text-6xl lg:text-7xl">
                Creator
                <span className="block bg-gradient-to-r from-red-400 via-yellow-300 to-white bg-clip-text text-transparent">
                  Premium
                </span>
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-6 text-white/55 sm:text-base">
                Unlock creator tools, analytics, profile upgrades, Notique AI
                upgrades, premium badges and stronger visibility as NotesWallah
                grows into a full student learning network.
              </p>

              <div className="mt-6 grid gap-3 sm:flex">
                <button
                  type="button"
                  className="inline-flex min-h-[3.1rem] items-center justify-center gap-2 rounded-2xl border border-yellow-400/30 bg-gradient-to-r from-yellow-500 via-orange-500 to-red-600 px-6 py-3 text-sm font-black text-white shadow-[0_0_40px_rgba(245,158,11,0.2)]"
                >
                  <Sparkles size={18} />
                  Coming Soon
                </button>

                <Link
                  href="/upload"
                  className="inline-flex min-h-[3.1rem] items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-6 py-3 text-sm font-black text-white transition hover:bg-white/[0.08]"
                >
                  <UploadCloud size={18} />
                  Start Uploading
                </Link>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[2rem] border border-yellow-500/20 bg-black/35 p-5 backdrop-blur-xl sm:p-6">
              <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-yellow-500/20 blur-3xl" />

              <div className="relative">
                <div className="flex h-16 w-16 items-center justify-center rounded-[1.5rem] border border-yellow-500/25 bg-yellow-500/10 text-yellow-300">
                  <Crown size={32} />
                </div>

                <p className="mt-6 text-sm font-bold text-white/45">
                  Launch Status
                </p>

                <h2 className="mt-2 text-3xl font-black sm:text-4xl">
                  In Development
                </h2>

                <p className="mt-4 text-sm leading-6 text-white/55">
                  Premium is not paid or active yet. This page prepares the
                  experience for the future launch.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {premiumFeatures.map((feature) => {
            const Icon = feature.icon;

            return (
              <article
                key={feature.title}
                className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20 backdrop-blur-xl transition hover:border-yellow-500/30 hover:bg-white/[0.06] sm:p-6"
              >
                <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-yellow-500/10 blur-3xl transition group-hover:bg-yellow-500/20" />

                <div className="relative">
                  <div className="flex h-14 w-14 items-center justify-center rounded-[1.35rem] border border-yellow-500/20 bg-yellow-500/10 text-yellow-300 sm:h-16 sm:w-16">
                    <Icon size={28} />
                  </div>

                  <h2 className="mt-5 text-xl font-black sm:text-2xl">
                    {feature.title}
                  </h2>

                  <p className="mt-3 text-sm leading-6 text-white/55">
                    {feature.description}
                  </p>
                </div>
              </article>
            );
          })}
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[1fr_420px]">
          <div className="relative overflow-hidden rounded-[2rem] border border-cyan-400/20 bg-gradient-to-br from-cyan-500/10 via-white/[0.04] to-red-500/10 p-5 shadow-2xl shadow-black/20 sm:p-7 lg:p-8">
            <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-cyan-400/20 blur-3xl" />

            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-black text-cyan-200">
                <Bot size={16} />
                Notique Premium
              </div>

              <h2 className="mt-5 text-3xl font-black tracking-tight sm:text-5xl">
                Unlimited AI study support.
              </h2>

              <p className="mt-4 max-w-3xl text-sm leading-6 text-white/55 sm:text-base">
                Notique Premium will unlock deeper AI help for students:
                unlimited chats, PDF summaries, image understanding, study
                plans and future AI learning tools.
              </p>

              <div className="mt-6 grid gap-3 md:grid-cols-2">
                <AIBox
                  icon={<MessageSquare size={18} />}
                  title="Unlimited Chats"
                  text="Ask doubts, revise topics and continue conversations without daily limits."
                />

                <AIBox
                  icon={<BrainCircuit size={18} />}
                  title="PDF Summaries"
                  text="Turn long notes into simple explanations and exam-ready points."
                />

                <AIBox
                  icon={<ImageIcon size={18} />}
                  title="Image Understanding"
                  text="Upload screenshots, diagrams or handwritten doubts for AI help."
                />

                <AIBox
                  icon={<Sparkles size={18} />}
                  title="Study Plans"
                  text="Generate structured study routines and revision plans."
                />
              </div>
            </div>
          </div>

          <aside className="relative overflow-hidden rounded-[2rem] border border-cyan-400/20 bg-black/35 p-5 shadow-2xl shadow-black/20 sm:p-6">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-cyan-400/20 blur-3xl" />

            <div className="relative">
              <div className="flex h-14 w-14 items-center justify-center rounded-[1.35rem] border border-cyan-400/25 bg-cyan-400/10 text-cyan-200">
                <Bot size={28} />
              </div>

              <p className="mt-6 text-sm font-bold text-white/45">
                Expected Price
              </p>

              <h3 className="mt-2 text-4xl font-black">
                ₹49
                <span className="ml-2 text-base text-white/45">/ month</span>
              </h3>

              <div className="mt-5 space-y-3">
                {notiqueFeatures.map((item) => (
                  <MiniRow
                    key={item}
                    icon={<CheckCircle2 size={16} />}
                    text={item}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={joinNotiqueWaitlist}
                disabled={joining}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-4 text-sm font-black text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Sparkles size={18} />
                {joining ? "Joining..." : "Join Notique Waitlist"}
              </button>

              <p className="mt-4 text-center text-xs leading-5 text-white/40">
                No payment now. This only records interest for future launch.
              </p>
            </div>
          </aside>
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[1fr_0.48fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20 sm:p-7 lg:p-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/20 bg-yellow-500/10 px-4 py-2 text-xs font-black text-yellow-300">
              <BadgeCheck size={16} />
              Early Access Plan
            </div>

            <h2 className="mt-5 text-3xl font-black tracking-tight sm:text-5xl">
              Built for serious student creators.
            </h2>

            <p className="mt-4 max-w-3xl text-sm leading-6 text-white/55 sm:text-base">
              NotesWallah Premium will focus on creators who upload useful PDFs,
              build trust with students and want better tools to understand
              their reach.
            </p>

            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {checklist.map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/25 px-4 py-4"
                >
                  <ShieldCheck size={18} className="shrink-0 text-green-400" />

                  <span className="text-sm font-bold text-white/70">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <aside className="relative overflow-hidden rounded-[2rem] border border-yellow-500/20 bg-gradient-to-br from-yellow-500/10 via-white/[0.04] to-red-500/10 p-5 shadow-2xl shadow-black/20 sm:p-6">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-yellow-500/20 blur-3xl" />

            <div className="relative">
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-[1.35rem] border border-yellow-500/25 bg-yellow-500/10 text-yellow-300">
                  <Rocket size={28} />
                </div>

                <div>
                  <p className="text-sm font-bold text-white/45">
                    Future Plan
                  </p>

                  <h3 className="text-2xl font-black text-yellow-300">
                    Creator Pro
                  </h3>
                </div>
              </div>

              <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-black/25 p-5">
                <p className="text-sm font-semibold text-white/45">
                  Estimated Launch
                </p>

                <h4 className="mt-2 text-4xl font-black">Soon</h4>

                <p className="mt-3 text-sm leading-6 text-white/55">
                  Pricing and subscription features will be decided after the
                  core NotesWallah platform is stable.
                </p>
              </div>

              <div className="mt-5 grid gap-3">
                <MiniRow
                  icon={<Flame size={16} />}
                  text="Premium creator identity"
                />
                <MiniRow
                  icon={<CheckCircle2 size={16} />}
                  text="Better upload controls"
                />
                <MiniRow
                  icon={<Sparkles size={16} />}
                  text="More growth tools"
                />
              </div>

              <Link
                href="/upload"
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-4 text-sm font-black text-white transition hover:bg-red-500"
              >
                <Sparkles size={18} />
                Become a Creator
              </Link>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}

function AIBox({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-200">
        {icon}
      </div>

      <h3 className="mt-4 text-base font-black">{title}</h3>

      <p className="mt-2 text-sm leading-6 text-white/50">{text}</p>
    </div>
  );
}

function MiniRow({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-bold text-white/65">
      <span className="text-yellow-300">{icon}</span>
      {text}
    </div>
  );
}