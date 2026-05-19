"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { Copy, Loader2, Lock, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

import { db } from "@/firebase/firebase";
import { useAuth } from "@/contexts/AuthContext";

export default function AISummaryPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [checking, setChecking] = useState(true);
  const [premium, setPremium] = useState(false);
  const [text, setText] = useState("");
  const [summary, setSummary] = useState("");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    async function checkPremium() {
      if (loading) return;

      if (!user) {
        router.push("/signin");
        return;
      }

      try {
        const userSnap = await getDoc(doc(db, "users", user.uid));

        if (userSnap.exists()) {
          setPremium(userSnap.data().premium === true);
        }
      } catch (error) {
        console.error(error);
        toast.error("Could not check premium status.");
      } finally {
        setChecking(false);
      }
    }

    checkPremium();
  }, [user, loading, router]);

  async function generateSummary() {
    if (!premium) {
      toast.error("Premium required.");
      return;
    }

    if (!text.trim()) {
      toast.error("Please paste your notes first.");
      return;
    }

    try {
      setGenerating(true);

      const res = await fetch("/api/ai-summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
        }),
      });

      const raw = await res.text();

      const data = raw
        ? JSON.parse(raw)
        : { error: "Empty response from AI API" };

      if (!res.ok) {
        throw new Error(data.error);
      }

      setSummary(data.summary || "");
      toast.success("Summary generated.");
    } catch (error) {
      console.error(error);
      toast.error("AI summary failed.");
    } finally {
      setGenerating(false);
    }
  }

  async function copySummary() {
    if (!summary) return;

    await navigator.clipboard.writeText(summary);
    toast.success("Summary copied.");
  }

  if (loading || checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050505] text-white">
        <Loader2 className="h-8 w-8 animate-spin text-red-500" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050505] px-4 py-8 text-white">
      <section className="mx-auto max-w-6xl">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl md:p-8">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div>
              <div className="flex items-center gap-3">
              <div className="relative h-14 w-14 overflow-hidden rounded-2xl border border-cyan-400/20 bg-cyan-400/10">
                <Image
                  src="/notique-white.png"
                  alt="Notique AI"
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              </div>

                <div>
                  <h1 className="text-3xl font-black md:text-5xl">
                    Notique AI Summary
                  </h1>

                  <p className="mt-2 text-sm text-white/55">
                    Paste your own notes and generate clean revision summaries.
                  </p>
                </div>
              </div>
            </div>

            {!premium && (
              <button
                onClick={() => router.push("/premium")}
                className="flex items-center justify-center gap-2 rounded-2xl bg-yellow-500 px-5 py-3 font-black text-black"
              >
                <Lock size={18} />
                Unlock Premium
              </button>
            )}
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <div className="rounded-[2rem] border border-white/10 bg-black/30 p-5">
              <h2 className="text-xl font-black">Your Notes</h2>

              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste your notes here..."
                className="mt-4 min-h-[420px] w-full resize-none rounded-2xl border border-white/10 bg-[#080808] p-4 text-sm leading-7 text-white outline-none placeholder:text-white/30 focus:border-red-500/50"
              />

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  onClick={generateSummary}
                  disabled={generating || !premium}
                  className="flex items-center gap-2 rounded-2xl bg-red-500 px-5 py-3 font-black text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {generating ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5" />
                      Generate Summary
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    setText("");
                    setSummary("");
                  }}
                  className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-bold text-white/70 transition hover:bg-white/10"
                >
                  <Trash2 size={18} />
                  Clear
                </button>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-black/30 p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-black">AI Summary</h2>

                {summary && (
                  <button
                    onClick={copySummary}
                    className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-bold text-white/70 transition hover:bg-white/10"
                  >
                    <Copy size={16} />
                    Copy
                  </button>
                )}
              </div>

              {summary ? (
                <div className="mt-4 max-h-[500px] overflow-y-auto whitespace-pre-wrap rounded-2xl border border-white/10 bg-[#080808] p-4 text-sm leading-7 text-white/80">
                  {summary}
                </div>
              ) : (
                <div className="mt-4 flex min-h-[420px] items-center justify-center rounded-2xl border border-dashed border-white/10 bg-[#080808] p-6 text-center">
                  <p className="max-w-sm text-sm leading-6 text-white/40">
                    Your AI-generated summary will appear here after you paste
                    notes and click generate.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}