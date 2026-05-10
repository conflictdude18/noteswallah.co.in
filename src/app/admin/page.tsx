"use client";

import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import {
  Activity,
  AlertTriangle,
  Bot,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileCheck2,
  FileText,
  Gauge,
  Layers3,
  RefreshCw,
  Shield,
  Sparkles,
  Trash2,
  UploadCloud,
  XCircle,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/firebase/firebase";
import type { Note } from "@/types/note";

type UserDoc = {
  role: string;
  email: string;
  name: string;
};

type AIModerationResult = {
  score: number;
  risk: "Low" | "Medium" | "High";
  suggestion: "Approve" | "Review Carefully" | "Reject";
  issues: string[];
};

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [notes, setNotes] = useState<Note[]>([]);
  const [fetching, setFetching] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  useEffect(() => {
    async function checkAdmin() {
      if (!user) return;

      setChecking(true);

      try {
        const snap = await getDoc(doc(db, "users", user.uid));

        if (snap.exists()) {
          const data = snap.data() as UserDoc;
          setIsAdmin(data.role === "admin");
        }
      } catch (err: unknown) {
        console.error("ADMIN CHECK ERROR:", err);
        toast.error("Failed to verify admin access.");
      } finally {
        setChecking(false);
      }
    }

    if (!loading && !user) {
      router.push("/signin");
      return;
    }

    if (user) {
      checkAdmin();
    }
  }, [user, loading, router]);

  async function fetchPendingNotes() {
    setFetching(true);

    try {
      const q = query(collection(db, "notes"), where("status", "==", "pending"));
      const snap = await getDocs(q);

      const data: Note[] = snap.docs.map((document) => ({
        id: document.id,
        ...(document.data() as Omit<Note, "id">),
      }));

      setNotes(data);
    } catch (err: unknown) {
      console.error("PENDING NOTES FETCH ERROR:", err);
      toast.error("Failed to load pending notes.");
    } finally {
      setFetching(false);
    }
  }

  useEffect(() => {
    if (isAdmin) {
      fetchPendingNotes();
    }
  }, [isAdmin]);

  async function approveNote(noteId?: string) {
    if (!noteId) return;

    setActionLoadingId(noteId);

    try {
      await updateDoc(doc(db, "notes", noteId), {
        status: "approved",
      });

      toast.success("Note approved.");
      await fetchPendingNotes();
    } catch (err: unknown) {
      console.error("APPROVE NOTE ERROR:", err);
      toast.error("Failed to approve note.");
    } finally {
      setActionLoadingId(null);
    }
  }

  async function rejectNote(noteId?: string) {
    if (!noteId) return;

    setActionLoadingId(noteId);

    try {
      await updateDoc(doc(db, "notes", noteId), {
        status: "rejected",
      });

      toast.success("Note rejected.");
      await fetchPendingNotes();
    } catch (err: unknown) {
      console.error("REJECT NOTE ERROR:", err);
      toast.error("Failed to reject note.");
    } finally {
      setActionLoadingId(null);
    }
  }

  async function deleteNote(noteId?: string) {
    if (!noteId) return;

    const ok = confirm("Delete this note permanently?");
    if (!ok) return;

    setActionLoadingId(noteId);

    try {
      await deleteDoc(doc(db, "notes", noteId));

      toast.success("Note deleted permanently.");
      await fetchPendingNotes();
    } catch (err: unknown) {
      console.error("DELETE NOTE ERROR:", err);
      toast.error("Failed to delete note.");
    } finally {
      setActionLoadingId(null);
    }
  }

  const analytics = useMemo(() => {
    const subjects = new Set(notes.map((note) => note.subject).filter(Boolean));
    const classes = new Set(notes.map((note) => note.class).filter(Boolean));
    const uploaders = new Set(
      notes.map((note) => note.uploaderEmail).filter(Boolean)
    );

    const aiResults = notes.map((note) => analyzeNote(note));
    const highRisk = aiResults.filter((item) => item.risk === "High").length;

    return {
      pending: notes.length,
      subjects: subjects.size,
      classes: classes.size,
      uploaders: uploaders.size,
      highRisk,
    };
  }, [notes]);

  if (loading || checking) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center px-4">
        <section className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-white/10 bg-[#07090d] p-8 text-center shadow-card">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(239,68,68,0.18),transparent_55%)]" />

          <div className="relative z-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-300">
              <Shield size={34} />
            </div>

            <h1 className="mt-6 text-2xl font-black text-white">
              Checking Admin Access
            </h1>

            <p className="mt-3 text-sm leading-6 text-white/55">
              Verifying your permission before opening the moderation dashboard.
            </p>
          </div>
        </section>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center px-4">
        <section className="glass-card w-full max-w-md rounded-[2rem] p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-300">
            <Shield size={34} />
          </div>

          <h1 className="mt-6 text-3xl font-black text-red-300">
            Access Denied
          </h1>

          <p className="mt-3 text-sm leading-6 text-white/55">
            You do not have admin permission for this page.
          </p>

          <button
            type="button"
            onClick={() => router.push("/")}
            className="btn-primary mt-7 w-full"
          >
            Go Home
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="space-y-8 pb-24 md:pb-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#06070b] p-6 shadow-card md:p-10">
        <div className="absolute right-[-120px] top-[-120px] h-[340px] w-[340px] rounded-full bg-red-500/25 blur-[130px]" />
        <div className="absolute bottom-[-140px] left-[-140px] h-[320px] w-[320px] rounded-full bg-red-800/20 blur-[130px]" />
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.08),transparent_35%,rgba(239,68,68,0.08))]" />

        <div className="relative z-10 grid gap-8 xl:grid-cols-[1.2fr_0.8fr] xl:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-black text-red-300">
              <Bot size={16} />
              AI-Assisted Admin Moderation
            </div>

            <h1 className="mt-6 max-w-3xl text-4xl font-black tracking-tight text-white md:text-6xl">
              Moderation Command Center
            </h1>

            <p className="mt-5 max-w-2xl text-sm leading-7 text-white/60 md:text-base">
              Review pending uploads with AI-style quality checks, risk scoring,
              spam detection, and suggested moderation actions.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Pill icon={<Activity size={15} />} text="Live Firebase Data" />
              <Pill icon={<Bot size={15} />} text="AI Quality Scanner" />
              <Pill icon={<Sparkles size={15} />} text="Risk Detection" />
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.25em] text-white/35">
                  AI Queue Status
                </p>
                <h2 className="mt-2 text-4xl font-black text-white">
                  {analytics.pending}
                </h2>
              </div>

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/25 bg-red-500/10 text-red-300">
                <Zap size={28} />
              </div>
            </div>

            <button
              type="button"
              onClick={fetchPendingNotes}
              disabled={fetching}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-3 text-sm font-black text-white transition hover:border-red-500/30 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                size={17}
                className={fetching ? "animate-spin text-red-300" : ""}
              />
              Refresh AI Queue
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <AdminStatCard
          label="Pending"
          value={analytics.pending}
          caption="Uploads waiting"
          icon={<AlertTriangle size={22} />}
        />

        <AdminStatCard
          label="High Risk"
          value={analytics.highRisk}
          caption="Need careful review"
          icon={<Bot size={22} />}
        />

        <AdminStatCard
          label="Subjects"
          value={analytics.subjects}
          caption="Unique subjects"
          icon={<Layers3 size={22} />}
        />

        <AdminStatCard
          label="Classes"
          value={analytics.classes}
          caption="Groups detected"
          icon={<FileCheck2 size={22} />}
        />

        <AdminStatCard
          label="Uploaders"
          value={analytics.uploaders}
          caption="Students waiting"
          icon={<Shield size={22} />}
        />
      </section>

      {fetching && (
        <section className="glass-card rounded-[2rem] p-8">
          <div className="flex items-center gap-3 text-sm font-semibold text-white/60">
            <RefreshCw size={18} className="animate-spin text-red-300" />
            Loading pending notes...
          </div>
        </section>
      )}

      {!fetching && notes.length === 0 && (
        <section className="glass-card rounded-[2rem] p-8 text-center md:p-12">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.5rem] border border-green-500/20 bg-green-500/10 text-green-300">
            <CheckCircle2 size={38} />
          </div>

          <h2 className="mt-7 text-2xl font-black text-white">
            Queue Cleared
          </h2>

          <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-white/55 md:text-base">
            No pending notes right now. New student uploads will appear here
            automatically after refresh.
          </p>
        </section>
      )}

      {!fetching && notes.length > 0 && (
        <section className="space-y-5">
          {notes.map((note, index) => {
            const isBusy = actionLoadingId === note.id;
            const ai = analyzeNote(note);

            return (
              <article
                key={note.id}
                className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#07090d] p-5 shadow-card backdrop-blur-xl transition hover:border-red-500/30 md:p-6"
              >
                <div className="absolute right-[-110px] top-[-110px] h-64 w-64 rounded-full bg-red-500/10 blur-[100px] transition group-hover:bg-red-500/20" />

                <div className="relative z-10 grid gap-6 xl:grid-cols-[1fr_360px] xl:items-start">
                  <div>
                    <div className="mb-5 flex flex-wrap items-center gap-3">
                      <span className="inline-flex items-center gap-2 rounded-full border border-yellow-500/20 bg-yellow-500/10 px-3 py-1.5 text-xs font-black text-yellow-200">
                        <Clock3 size={13} />
                        Pending Review
                      </span>

                      <span className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-bold text-white/45">
                        Queue #{index + 1}
                      </span>

                      <RiskBadge risk={ai.risk} />
                    </div>

                    <div className="flex gap-4">
                      <div className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-red-300 sm:flex">
                        <FileText size={26} />
                      </div>

                      <div className="min-w-0">
                        <h2 className="line-clamp-2 text-2xl font-black leading-tight text-white">
                          {note.title || "Untitled Note"}
                        </h2>

                        <p className="mt-3 line-clamp-3 text-sm leading-7 text-white/55">
                          {note.description || "No description provided."}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                      <InfoRow label="Class" value={note.class} />
                      <InfoRow label="Subject" value={note.subject} />
                      <InfoRow label="Topic" value={note.topic} />
                      <InfoRow
                        label="Uploader"
                        value={note.uploaderEmail || "Unknown"}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <AIPanel ai={ai} />

                    <div className="rounded-[1.7rem] border border-white/10 bg-white/[0.035] p-4">
                      <p className="mb-4 text-xs font-black uppercase tracking-[0.22em] text-white/35">
                        Moderation Controls
                      </p>

                      <div className="grid gap-3">
                        <a
                          href={note.pdfURL}
                          target="_blank"
                          rel="noreferrer"
                          className="flex min-h-[2.9rem] items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-black text-white transition hover:border-red-500/30 hover:bg-red-500/10"
                        >
                          <ExternalLink size={16} />
                          Open PDF
                        </a>

                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => approveNote(note.id)}
                          className="flex min-h-[2.9rem] items-center justify-center gap-2 rounded-2xl border border-green-500/25 bg-green-500/10 px-4 py-3 text-sm font-black text-green-200 transition hover:bg-green-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <CheckCircle2 size={16} />
                          Approve Note
                        </button>

                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => rejectNote(note.id)}
                          className="flex min-h-[2.9rem] items-center justify-center gap-2 rounded-2xl border border-yellow-500/25 bg-yellow-500/10 px-4 py-3 text-sm font-black text-yellow-200 transition hover:bg-yellow-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <XCircle size={16} />
                          Reject Note
                        </button>

                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => deleteNote(note.id)}
                          className="flex min-h-[2.9rem] items-center justify-center gap-2 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm font-black text-red-200 transition hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Trash2 size={16} />
                          Delete Permanently
                        </button>
                      </div>

                      {isBusy && (
                        <div className="mt-4 flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-xs font-bold text-white/50">
                          <RefreshCw size={14} className="animate-spin" />
                          Processing action...
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}

function analyzeNote(note: Note): AIModerationResult {
  let score = 100;
  const issues: string[] = [];

  const title = note.title?.trim() || "";
  const description = note.description?.trim() || "";
  const subject = note.subject?.trim() || "";
  const className = note.class?.trim() || "";
  const topic = note.topic?.trim() || "";

  const combinedText = `${title} ${description} ${subject} ${topic}`.toLowerCase();

  const spamWords = [
    "free money",
    "earn money",
    "click here",
    "telegram",
    "whatsapp group",
    "hack",
    "cheat",
    "adult",
    "betting",
    "casino",
    "crypto profit",
  ];

  if (title.length < 6) {
    score -= 18;
    issues.push("Title is too short.");
  }

  if (description.length < 20) {
    score -= 20;
    issues.push("Description is missing or too short.");
  }

  if (!className) {
    score -= 12;
    issues.push("Class is missing.");
  }

  if (!subject) {
    score -= 12;
    issues.push("Subject is missing.");
  }

  if (!topic) {
    score -= 10;
    issues.push("Topic is missing.");
  }

  const detectedSpam = spamWords.filter((word) => combinedText.includes(word));

  if (detectedSpam.length > 0) {
    score -= 35;
    issues.push("Suspicious spam-like words detected.");
  }

  if (!note.pdfURL) {
    score -= 30;
    issues.push("PDF link is missing.");
  }

  const cleanScore = Math.max(0, Math.min(100, score));

  if (cleanScore >= 75) {
    return {
      score: cleanScore,
      risk: "Low",
      suggestion: "Approve",
      issues: issues.length ? issues : ["No major quality issues detected."],
    };
  }

  if (cleanScore >= 45) {
    return {
      score: cleanScore,
      risk: "Medium",
      suggestion: "Review Carefully",
      issues,
    };
  }

  return {
    score: cleanScore,
    risk: "High",
    suggestion: "Reject",
    issues,
  };
}

function AdminStatCard({
  label,
  value,
  caption,
  icon,
}: {
  label: string;
  value: string | number;
  caption: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.035] p-5 shadow-card backdrop-blur-xl transition hover:-translate-y-1 hover:border-red-500/25 hover:bg-white/[0.055]">
      <div className="absolute right-[-70px] top-[-70px] h-36 w-36 rounded-full bg-red-500/10 blur-[75px] transition group-hover:bg-red-500/20" />

      <div className="relative z-10 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-white/50">{label}</p>
          <h2 className="mt-2 text-4xl font-black text-white">{value}</h2>
          <p className="mt-2 text-xs font-medium text-white/35">{caption}</p>
        </div>

        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-300">
          {icon}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
      <span className="shrink-0 text-xs font-black uppercase tracking-wide text-white/35">
        {label}
      </span>

      <span className="line-clamp-1 break-all text-right text-sm font-bold text-white/75">
        {value || "Not set"}
      </span>
    </div>
  );
}

function Pill({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-xs font-black text-white/60">
      <span className="text-red-300">{icon}</span>
      {text}
    </div>
  );
}

function RiskBadge({ risk }: { risk: AIModerationResult["risk"] }) {
  const classes =
    risk === "Low"
      ? "border-green-500/20 bg-green-500/10 text-green-200"
      : risk === "Medium"
        ? "border-yellow-500/20 bg-yellow-500/10 text-yellow-200"
        : "border-red-500/20 bg-red-500/10 text-red-200";

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-black ${classes}`}
    >
      <Bot size={13} />
      {risk} Risk
    </span>
  );
}

function AIPanel({ ai }: { ai: AIModerationResult }) {
  const barClass =
    ai.risk === "Low"
      ? "bg-green-400"
      : ai.risk === "Medium"
        ? "bg-yellow-400"
        : "bg-red-400";

  return (
    <div className="rounded-[1.7rem] border border-red-500/20 bg-red-500/[0.055] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-red-200/70">
            AI Scan
          </p>
          <h3 className="mt-1 text-lg font-black text-white">
            {ai.score}/100 Quality
          </h3>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-300">
          <Bot size={22} />
        </div>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full ${barClass}`}
          style={{ width: `${ai.score}%` }}
        />
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-3">
        <p className="text-xs font-bold text-white/35">Suggested Action</p>
        <p className="mt-1 text-sm font-black text-white">{ai.suggestion}</p>
      </div>

      <div className="mt-4 space-y-2">
        {ai.issues.slice(0, 3).map((issue) => (
          <div
            key={issue}
            className="flex gap-2 rounded-2xl border border-white/10 bg-white/[0.035] p-3"
          >
            <AlertTriangle size={14} className="mt-0.5 shrink-0 text-red-300" />
            <p className="text-xs leading-5 text-white/55">{issue}</p>
          </div>
        ))}
      </div>
    </div>
  );
}