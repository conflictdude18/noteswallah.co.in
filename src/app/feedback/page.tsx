"use client";

import { useState } from "react";
import { toast } from "sonner";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import {
  Bug,
  Lightbulb,
  MessageSquare,
  Send,
  Sparkles,
  User,
} from "lucide-react";

import { db } from "@/firebase/firebase";

export default function FeedbackPage() {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("suggestion");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!message.trim()) {
      toast.error("Please write your feedback message.");
      return;
    }

    setLoading(true);

    try {
      await addDoc(collection(db, "feedback"), {
        name: name.trim() || "Anonymous",
        type,
        message: message.trim(),
        createdAt: serverTimestamp(),
      });

      toast.success("Feedback submitted successfully!");

      setName("");
      setMessage("");
      setType("suggestion");
    } catch (err: unknown) {
      console.error("FEEDBACK ERROR:", err);

      toast.error(
        err instanceof Error ? err.message : "Failed to send feedback."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="space-y-8 pb-24 md:pb-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#07090d] p-6 shadow-card md:p-10">
        <div className="absolute right-[-90px] top-[-90px] h-[280px] w-[280px] rounded-full bg-red-500/20 blur-[120px]" />
        <div className="absolute bottom-[-130px] left-[-130px] h-[280px] w-[280px] rounded-full bg-red-700/10 blur-[120px]" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-bold text-red-300">
            <Sparkles size={16} />
            Community Feedback
          </div>

          <h1 className="mt-6 text-4xl font-black tracking-tight text-white md:text-6xl">
            Feedback
          </h1>

          <p className="mt-4 text-sm leading-7 text-white/60 md:text-base">
            Share bugs, ideas, improvements, feature requests, or anything that
            can make NotesWallah better for students.
          </p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_0.75fr]">
        <div className="glass-card rounded-[2rem] p-6 md:p-8">
          <div className="mb-8 flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-300">
              <MessageSquare size={26} />
            </div>

            <div>
              <h2 className="text-2xl font-black text-white">
                Send Feedback
              </h2>

              <p className="mt-1 text-sm leading-6 text-white/50">
                Your feedback helps improve NotesWallah for real students.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-bold text-white/75"
              >
                Your Name
              </label>

              <div className="relative">
                <User
                  size={18}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/35"
                />

                <input
                  id="name"
                  name="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Eg: Anshul"
                  className="nw-input input-icon-left"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="type"
                className="mb-2 block text-sm font-bold text-white/75"
              >
                Feedback Type
              </label>

              <select
                id="type"
                name="type"
                value={type}
                onChange={(event) => setType(event.target.value)}
                className="nw-input"
              >
                <option value="suggestion">Suggestion</option>
                <option value="bug">Bug Report</option>
                <option value="feature">Feature Request</option>
                <option value="design">Design Improvement</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="message"
                className="mb-2 block text-sm font-bold text-white/75"
              >
                Message <span className="text-red-400">*</span>
              </label>

              <textarea
                id="message"
                name="message"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Write your feedback here..."
                rows={7}
                className="nw-input min-h-[180px] resize-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send size={18} />
              {loading ? "Sending..." : "Submit Feedback"}
            </button>
          </form>
        </div>

        <aside className="space-y-4">
          <InfoCard
            icon={<Lightbulb size={24} />}
            title="Suggest Ideas"
            description="Tell us what features would make studying easier."
          />

          <InfoCard
            icon={<Bug size={24} />}
            title="Report Problems"
            description="Found something broken? Send details so it can be fixed."
          />

          <InfoCard
            icon={<Sparkles size={24} />}
            title="Improve Experience"
            description="Share UI, speed, upload, search, or note-viewing improvements."
          />
        </aside>
      </section>
    </main>
  );
}

function InfoCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="glass-card rounded-[2rem] p-6">
      <div className="flex h-13 w-13 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-300">
        {icon}
      </div>

      <h3 className="mt-5 text-xl font-black text-white">{title}</h3>

      <p className="mt-2 text-sm leading-6 text-white/55">{description}</p>
    </div>
  );
}