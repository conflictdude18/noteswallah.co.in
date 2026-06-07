"use client";

import Link from "next/link";
import { useState } from "react";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { toast } from "sonner";
import {
  ArrowRight,
  Check,
  Crown,
  Sparkles,
  Zap,
} from "lucide-react";
import { db } from "@/firebase/firebase";
import { useAuth } from "@/contexts/AuthContext";

export default function NotiquePremiumPage() {
  const { user } = useAuth();
  const [joining, setJoining] = useState(false);

  async function joinWaitlist() {
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
    <main className="min-h-screen bg-[#050505] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl pb-20">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/10 via-white/[0.04] to-red-500/10 p-6 shadow-2xl shadow-black/30 sm:p-8 lg:p-10">
          <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-red-500/20 blur-3xl" />

          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 text-xs font-black text-red-300">
              <Crown size={14} />
              Notique Premium
            </div>

            <h1 className="mt-5 text-4xl font-black sm:text-6xl">
              Study Smarter.
              <br />
              Learn Faster.
            </h1>

            <p className="mt-5 max-w-2xl text-sm leading-7 text-white/60 sm:text-base">
              Unlock the full power of Notique AI with unlimited study support,
              advanced note analysis, image understanding, and future premium
              features.
            </p>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_420px]">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/20">
            <div className="flex items-center gap-2">
              <Sparkles className="text-red-300" size={18} />
              <h2 className="text-xl font-black">Premium Features</h2>
            </div>

            <div className="mt-6 space-y-4">
              <Feature text="Unlimited Notique AI chats" />
              <Feature text="Unlimited PDF summarization" />
              <Feature text="Unlimited image uploads" />
              <Feature text="Advanced note explanations" />
              <Feature text="AI-generated study plans" />
              <Feature text="Priority AI responses" />
              <Feature text="Early access to new AI features" />
              <Feature text="Future premium creator tools" />
            </div>
          </div>

          <div className="rounded-[2rem] border border-red-500/20 bg-red-500/10 p-6 shadow-2xl shadow-red-950/20">
            <div className="flex items-center gap-2">
              <Zap className="text-yellow-300" size={18} />
              <p className="font-black text-red-200">
                MOST POPULAR
              </p>
            </div>

            <h2 className="mt-5 text-4xl font-black">
              ₹49
              <span className="ml-2 text-lg text-white/50">
                / month
              </span>
            </h2>

            <p className="mt-3 text-sm text-white/60">
              Less than the cost of a notebook, with unlimited AI assistance.
            </p>

            <div className="mt-8 space-y-3">
              <Feature text="Unlimited usage" />
              <Feature text="Premium AI tools" />
              <Feature text="Image support" />
              <Feature text="Priority access" />
            </div>

            <button
            onClick={joinWaitlist}
            disabled={joining}
            className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-4 text-sm font-black text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
            {joining ? "Joining..." : "Join Premium Waitlist"}
            <ArrowRight size={16} />
            </button>

            <p className="mt-4 text-center text-xs text-white/40">
            Premium is coming soon. Join the waitlist to show interest.
            </p>
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/20">
          <h2 className="text-xl font-black">
            Free vs Premium
          </h2>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="py-4 text-left text-sm font-black">
                    Feature
                  </th>

                  <th className="py-4 text-center text-sm font-black">
                    Free
                  </th>

                  <th className="py-4 text-center text-sm font-black text-red-300">
                    Premium
                  </th>
                </tr>
              </thead>

              <tbody>
                <Row
                  feature="Access Period"
                  free="3 Days Trial"
                  premium="Unlimited"
                />

                <Row
                  feature="Daily Messages"
                  free="20"
                  premium="Unlimited"
                />

                <Row
                  feature="PDF Analysis"
                  free="✓"
                  premium="✓"
                />

                <Row
                  feature="Image Understanding"
                  free="Limited"
                  premium="Unlimited"
                />

                <Row
                  feature="Study Plans"
                  free="✗"
                  premium="✓"
                />

                <Row
                  feature="Future AI Features"
                  free="✗"
                  premium="✓"
                />
              </tbody>
            </table>
          </div>
        </section>

        <div className="mt-8 text-center">
          <Link
            href="/notique"
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-black text-white/80 transition hover:bg-white/10"
          >
            Continue with Notique
          </Link>
        </div>
      </div>
    </main>
  );
}

function Feature({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-500/15 text-green-300">
        <Check size={15} />
      </div>

      <span className="text-sm text-white/80">
        {text}
      </span>
    </div>
  );
}

function Row({
  feature,
  free,
  premium,
}: {
  feature: string;
  free: string;
  premium: string;
}) {
  return (
    <tr className="border-b border-white/5">
      <td className="py-4 text-sm font-semibold">
        {feature}
      </td>

      <td className="py-4 text-center text-sm text-white/60">
        {free}
      </td>

      <td className="py-4 text-center text-sm font-bold text-red-300">
        {premium}
      </td>
    </tr>
  );
}