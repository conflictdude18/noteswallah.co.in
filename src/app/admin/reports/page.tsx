"use client";

import type React from "react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  ExternalLink,
  FileWarning,
  RefreshCw,
  Shield,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { db } from "@/firebase/firebase";
import { useAuth } from "@/contexts/AuthContext";

type Report = {
  id: string;
  noteId: string;
  noteTitle: string;
  noteUploaderId: string;
  reporterId: string;
  reporterEmail: string;
  reason: string;
  details: string;
  status: "pending" | "resolved";
  createdAt: string;
};

type UserDoc = {
  role?: string;
};

export default function AdminReportsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [reports, setReports] = useState<Report[]>([]);
  const [fetching, setFetching] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  useEffect(() => {
    async function checkAdmin() {
      if (!user) return;

      try {
        const snap = await getDoc(doc(db, "users", user.uid));

        if (snap.exists()) {
          const data = snap.data() as UserDoc;
          setIsAdmin(data.role === "admin");
        }
      } catch (err) {
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

    if (user) checkAdmin();
  }, [user, loading, router]);

  async function fetchReports() {
    setFetching(true);

    try {
      const q = query(collection(db, "reports"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);

      const data: Report[] = snap.docs.map((reportDoc) => ({
        id: reportDoc.id,
        ...(reportDoc.data() as Omit<Report, "id">),
      }));

      setReports(data);
    } catch (err) {
      console.error("REPORT FETCH ERROR:", err);
      toast.error("Failed to load reports.");
    } finally {
      setFetching(false);
    }
  }

  useEffect(() => {
    if (isAdmin) fetchReports();
  }, [isAdmin]);

  async function markResolved(reportId: string) {
    setActionId(reportId);

    try {
      await updateDoc(doc(db, "reports", reportId), {
        status: "resolved",
      });

      toast.success("Report marked resolved.");
      await fetchReports();
    } catch (err) {
      console.error("RESOLVE REPORT ERROR:", err);
      toast.error("Failed to update report.");
    } finally {
      setActionId(null);
    }
  }

  async function deleteReport(reportId: string) {
    const ok = confirm("Delete this report?");
    if (!ok) return;

    setActionId(reportId);

    try {
      await deleteDoc(doc(db, "reports", reportId));
      toast.success("Report deleted.");
      await fetchReports();
    } catch (err) {
      console.error("DELETE REPORT ERROR:", err);
      toast.error("Failed to delete report.");
    } finally {
      setActionId(null);
    }
  }

  async function deleteReportedNote(report: Report) {
    const ok = confirm("Delete the reported note permanently?");
    if (!ok) return;

    setActionId(report.id);

    try {
      await deleteDoc(doc(db, "notes", report.noteId));
      await updateDoc(doc(db, "reports", report.id), {
        status: "resolved",
      });

      toast.success("Reported note deleted.");
      await fetchReports();
    } catch (err) {
      console.error("DELETE NOTE ERROR:", err);
      toast.error("Failed to delete note.");
    } finally {
      setActionId(null);
    }
  }

  const stats = useMemo(() => {
    const pending = reports.filter((item) => item.status !== "resolved").length;
    const resolved = reports.filter((item) => item.status === "resolved").length;

    return {
      total: reports.length,
      pending,
      resolved,
    };
  }, [reports]);

  if (loading || checking) {
    return (
      <AccessState
        title="Checking Admin Access"
        text="Verifying permission before opening report moderation."
      />
    );
  }

  if (!isAdmin) {
    return (
      <AccessState
        title="Access Denied"
        text="Only admins can view reports."
        danger
      />
    );
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#050505] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl pb-28 md:pb-10">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/10 via-white/[0.04] to-red-500/10 p-5 shadow-2xl shadow-black/30 sm:p-7 lg:p-9">
          <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-red-500/20 blur-3xl" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <button
                type="button"
                onClick={() => router.push("/admin")}
                className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-black text-white/60 transition hover:border-red-500/30 hover:text-white"
              >
                <ArrowLeft size={16} />
                Back to Admin
              </button>

              <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/20 bg-yellow-500/10 px-4 py-2 text-xs font-black text-yellow-300">
                <AlertTriangle size={16} />
                Report Moderation
              </div>

              <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                Reported Notes
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-6 text-white/55 sm:text-base">
                Review student reports, open reported notes, resolve valid
                cases, and delete harmful or incorrect uploads.
              </p>
            </div>

            <button
              type="button"
              onClick={fetchReports}
              disabled={fetching}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-4 text-sm font-black text-white transition hover:border-red-500/30 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-60 sm:w-fit"
            >
              <RefreshCw
                size={18}
                className={fetching ? "animate-spin text-red-300" : ""}
              />
              Refresh Reports
            </button>
          </div>
        </section>

        <section className="mt-5 grid grid-cols-3 gap-3">
          <StatCard label="Total" value={stats.total} icon={<FileWarning size={22} />} />
          <StatCard label="Pending" value={stats.pending} icon={<AlertTriangle size={22} />} tone="yellow" />
          <StatCard label="Resolved" value={stats.resolved} icon={<CheckCircle size={22} />} tone="green" />
        </section>

        {fetching ? (
          <section className="mt-5 rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 shadow-2xl shadow-black/20">
            <div className="flex items-center gap-3 text-sm font-semibold text-white/60">
              <RefreshCw size={18} className="animate-spin text-red-300" />
              Loading reports...
            </div>
          </section>
        ) : reports.length === 0 ? (
          <section className="mt-5 rounded-[2rem] border border-white/10 bg-white/[0.04] p-10 text-center shadow-2xl shadow-black/20">
            <CheckCircle className="mx-auto text-green-400" size={54} />
            <h2 className="mt-5 text-2xl font-black">No reports</h2>
            <p className="mt-2 text-sm text-white/50">
              Everything looks clean.
            </p>
          </section>
        ) : (
          <section className="mt-5 space-y-4">
            {reports.map((report) => {
              const isBusy = actionId === report.id;

              return (
                <article
                  key={report.id}
                  className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-5 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-6"
                >
                  <div className="grid gap-5 xl:grid-cols-[1fr_380px] xl:items-start">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="break-words text-xl font-black">
                          {report.noteTitle || "Untitled Reported Note"}
                        </h2>

                        <StatusBadge status={report.status} />
                      </div>

                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <InfoBox label="Reason" value={report.reason || "Not provided"} />
                        <InfoBox
                          label="Reporter"
                          value={report.reporterEmail || report.reporterId || "Unknown"}
                        />
                      </div>

                      {report.details && (
                        <div className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-4">
                          <p className="text-xs font-bold uppercase tracking-wide text-white/35">
                            Details
                          </p>
                          <p className="mt-2 text-sm leading-6 text-white/65">
                            {report.details}
                          </p>
                        </div>
                      )}

                      <p className="mt-3 break-all text-xs text-white/35">
                        Reported note ID: {report.noteId}
                      </p>
                    </div>

                    <div className="grid gap-3">
                      <Link
                        href={`/notes/${report.noteId}`}
                        className="flex min-h-[2.9rem] items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-black text-white/75 transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-white"
                      >
                        <ExternalLink size={16} />
                        Open Note
                      </Link>

                      <ActionButton
                        icon={<CheckCircle size={16} />}
                        label="Resolve Report"
                        tone="green"
                        disabled={isBusy || report.status === "resolved"}
                        onClick={() => markResolved(report.id)}
                      />

                      <ActionButton
                        icon={<Trash2 size={16} />}
                        label="Delete Reported Note"
                        tone="red"
                        disabled={isBusy}
                        onClick={() => deleteReportedNote(report)}
                      />

                      <ActionButton
                        icon={<Trash2 size={16} />}
                        label="Delete Report"
                        disabled={isBusy}
                        onClick={() => deleteReport(report.id)}
                      />

                      {isBusy && (
                        <div className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-xs font-bold text-white/50">
                          <RefreshCw size={14} className="animate-spin" />
                          Updating report...
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}

function AccessState({
  title,
  text,
  danger = false,
}: {
  title: string;
  text: string;
  danger?: boolean;
}) {
  return (
    <main className="min-h-screen bg-[#050505] px-4 py-8 text-white">
      <div className="mx-auto flex min-h-[70vh] max-w-5xl items-center justify-center">
        <section className="w-full max-w-md rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 text-center shadow-2xl shadow-black/20">
          <Shield className="mx-auto text-red-300" size={42} />

          <h1
            className={`mt-5 text-2xl font-black ${
              danger ? "text-red-300" : "text-white"
            }`}
          >
            {title}
          </h1>

          <p className="mt-3 text-sm text-white/55">{text}</p>
        </section>
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  icon,
  tone = "red",
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  tone?: "red" | "yellow" | "green";
}) {
  const styles = {
    red: "bg-red-500/10 text-red-300 border-red-500/20",
    yellow: "bg-yellow-500/10 text-yellow-300 border-yellow-500/20",
    green: "bg-green-500/10 text-green-300 border-green-500/20",
  };

  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-white/45 sm:text-sm">{label}</p>
          <h2 className="mt-2 text-2xl font-black sm:text-4xl">{value}</h2>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${styles[tone]}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: Report["status"] }) {
  const styles =
    status === "resolved"
      ? "border-green-500/20 bg-green-500/10 text-green-300"
      : "border-yellow-500/20 bg-yellow-500/10 text-yellow-300";

  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-black capitalize ${styles}`}
    >
      {status}
    </span>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
      <p className="text-xs font-bold text-white/35">{label}</p>
      <p className="mt-1 line-clamp-2 break-words text-sm font-black text-white/75">
        {value}
      </p>
    </div>
  );
}

function ActionButton({
  icon,
  label,
  onClick,
  disabled = false,
  tone = "neutral",
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  tone?: "neutral" | "red" | "green";
}) {
  const styles = {
    neutral:
      "border-white/10 bg-white/[0.06] text-white/75 hover:border-red-500/30 hover:bg-red-500/10 hover:text-white",
    red: "border-red-500/25 bg-red-500/10 text-red-200 hover:bg-red-500 hover:text-white",
    green:
      "border-green-500/25 bg-green-500/10 text-green-200 hover:bg-green-500 hover:text-white",
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex min-h-[2.9rem] items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-50 ${styles[tone]}`}
    >
      {icon}
      {label}
    </button>
  );
}