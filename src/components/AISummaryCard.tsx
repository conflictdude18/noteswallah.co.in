"use client";

import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

type Props = {
  text: string;
};

export default function AISummaryCard({ text }: Props) {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState("");

  async function generateSummary() {
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

    if (data.error) {
      toast.error(data.error);
      return;
    }

    if (!res.ok) {
      toast.error(
        data.error || "AI service unavailable. Please try again later."
      );
      return;
    }

      setSummary(data.summary);
    } catch (error) {
      console.error(error);
      toast.error("AI service unavailable. Please try again later.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-5 rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="text-yellow-400" size={20} />

            <h2 className="text-2xl font-black text-white">
              AI Summary
            </h2>
          </div>

          <p className="mt-2 text-sm text-white/50">
            Generate concise AI-powered revision notes.
          </p>
        </div>
      </div>

      <button
        onClick={generateSummary}
        disabled={loading}
        className="mt-5 flex items-center gap-2 rounded-2xl bg-red-500 px-5 py-3 font-black text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? (
          <>
            <Loader2 className="animate-spin" size={18} />
            Generating...
          </>
        ) : (
          <>
            <Sparkles size={18} />
            Generate Summary
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