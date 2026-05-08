"use client";

import { useState } from "react";
import { toast } from "sonner";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebase/firebase";

export default function FeedbackPage() {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
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
        message: message.trim(),
        createdAt: serverTimestamp(),
      });

      toast.success("Feedback submitted successfully!");
      setName("");
      setMessage("");
    } catch (err: unknown) {
      console.error("FEEDBACK ERROR:", err);
      toast.error(err instanceof Error ? err.message : "Failed to send feedback.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container-max py-10">
      <h1 className="text-3xl font-bold">Feedback</h1>
      <p className="mt-2 text-white/70">
        Help us improve NotesWallah by sharing your feedback.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-8 glass-card p-8 space-y-5 max-w-2xl"
      >
        <div>
          <label htmlFor="name" className="block text-sm text-white/80 mb-2">
            Your Name
          </label>
          <input
            id="name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Eg: Anshul"
            className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2 outline-none focus:border-red-500"
          />
        </div>

        <div>
          <label htmlFor="message" className="block text-sm text-white/80 mb-2">
            Message <span className="text-red-400">*</span>
          </label>
          <textarea
            id="message"
            name="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write your feedback here..."
            rows={5}
            className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2 outline-none focus:border-red-500"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Sending..." : "Submit Feedback"}
        </button>
      </form>
    </div>
  );
}