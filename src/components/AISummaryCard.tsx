"use client";

import { useState } from "react";
import {
  Loader2,
  Lock,
  Sparkles,
} from "lucide-react";

import { toast } from "sonner";

type Props = {
  text: string;
  premium: boolean;
};

export default function AISummaryCard({
  text,
  premium,
}: Props) {
  const [loading, setLoading] = useState(false);

  const [summary, setSummary] = useState("");

  async function generateSummary() {
    if (!premium) {
      toast.error("Premium required.");
      return;
    }

    try {
      setLoading(true);

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

      setSummary(data.summary);
    } catch (error) {
      console.error(error);

      toast.error(
        "AI service unavailable. Please try again later."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-5 rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles
              className="text-yellow-400"
              size={20}
            />

            <h2 className="text-2xl font-black text-white">
              AI Summary
            </h2>
          </div>

          <p className="mt-2 text-sm text-white/50">
            Generate concise AI-powered revision notes.
          </p>
        </div>

        {!premium && (
          <div className="rounded-full border border-yellow-500/20 bg-yellow-500/10 px-3 py-1 text-xs font-bold text-yellow-300">
            Premium
          </div>
        )}
      </div>

      <button
        onClick={generateSummary}
        disabled={loading || !premium}
        className="mt-5 flex items-center gap-2 rounded-2xl bg-red-500 px-5 py-3 font-black text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? (
          <>
            <Loader2
              className="animate-spin"
              size={18}
            />
            Generating...
          </>
        ) : premium ? (
          <>
            <Sparkles size={18} />
            Generate Summary
          </>
        ) : (
          <>
            <Lock size={18} />
            Premium Required
          </>
        )}
      </button>

      {summary && (
        <div className="mt-5 max-h-[420px] overflow-y-auto whitespace-pre-wrap rounded-2xl border border-white/10 bg-black/30 p-4 text-sm leading-7 text-white/80">
          {summary}
        </div>
      )}
    </section>
  );
}