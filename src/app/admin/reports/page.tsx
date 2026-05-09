"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  orderBy,
} from "firebase/firestore";
import { AlertTriangle, ExternalLink, Trash2, CheckCircle } from "lucide-react";
import { toast } from "sonner";

import { db } from "@/firebase/firebase";
import { useAuth } from "@/contexts/AuthContext";
import LoadingSpinner from "@/components/LoadingSpinner";

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

  useEffect(() => {
    async function checkAdmin() {
      if (!user) return;

      const snap = await getDoc(doc(db, "users", user.uid));

      if (snap.exists()) {
        const data = snap.data() as UserDoc;
        setIsAdmin(data.role === "admin");
      }

      setChecking(false);
    }

    if (!loading && !user) {
      router.push("/signin");
    }

    if (user) {
      checkAdmin();
    }
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
    if (isAdmin) {
      fetchReports();
    }
  }, [isAdmin]);

  async function markResolved(reportId: string) {
    try {
      await updateDoc(doc(db, "reports", reportId), {
        status: "resolved",
      });

      toast.success("Report marked resolved.");
      fetchReports();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update report.");
    }
  }

  async function deleteReport(reportId: string) {
    const ok = confirm("Delete this report?");
    if (!ok) return;

    try {
      await deleteDoc(doc(db, "reports", reportId));
      toast.success("Report deleted.");
      fetchReports();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete report.");
    }
  }

  async function deleteReportedNote(noteId: string) {
    const ok = confirm("Delete the reported note permanently?");
    if (!ok) return;

    try {
      await deleteDoc(doc(db, "notes", noteId));
      toast.success("Reported note deleted.");
      fetchReports();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete note.");
    }
  }

  if (loading || checking || fetching) {
    return <LoadingSpinner />;
  }

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="container-max py-10">
          <h1 className="text-3xl font-black text-red-400">Access Denied</h1>
          <p className="mt-2 text-white/60">Only admins can view reports.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="container-max py-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-yellow-500/20 bg-yellow-500/10 px-4 py-2 text-sm text-yellow-400">
              <AlertTriangle size={16} />
              Moderation
            </div>

            <h1 className="text-4xl font-black">Reported Notes</h1>

            <p className="mt-2 text-white/60">
              Review reports submitted by students.
            </p>
          </div>

          <Link href="/admin" className="btn-secondary">
            Back to Admin
          </Link>
        </div>

        {reports.length === 0 ? (
          <div className="glass-card mt-10 p-10 text-center">
            <CheckCircle className="mx-auto text-green-400" size={54} />
            <h2 className="mt-5 text-2xl font-bold">No reports</h2>
            <p className="mt-2 text-white/50">Everything looks clean.</p>
          </div>
        ) : (
          <div className="mt-10 grid gap-6">
            {reports.map((report) => (
              <div key={report.id} className="glass-card p-6">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-xl font-bold">{report.noteTitle}</h2>

                      <span
                        className={`rounded-full px-3 py-1 text-xs ${
                          report.status === "resolved"
                            ? "bg-green-500/10 text-green-400"
                            : "bg-yellow-500/10 text-yellow-400"
                        }`}
                      >
                        {report.status}
                      </span>
                    </div>

                    <p className="mt-3 text-sm text-white/60">
                      <span className="text-white/80">Reason:</span>{" "}
                      {report.reason}
                    </p>

                    {report.details && (
                      <p className="mt-2 text-sm text-white/60">
                        <span className="text-white/80">Details:</span>{" "}
                        {report.details}
                      </p>
                    )}

                    <div className="mt-4 space-y-1 text-xs text-white/40">
                      <p>Reporter: {report.reporterEmail || report.reporterId}</p>
                      <p>Reported note ID: {report.noteId}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/notes/${report.noteId}`}
                      className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/75 transition hover:bg-white/10 hover:text-white"
                    >
                      <ExternalLink size={16} />
                      Open Note
                    </Link>

                    <button
                      onClick={() => markResolved(report.id)}
                      className="inline-flex items-center gap-2 rounded-2xl border border-green-500/20 bg-green-500/10 px-4 py-2 text-sm text-green-400 transition hover:bg-green-500/20"
                    >
                      <CheckCircle size={16} />
                      Resolve
                    </button>

                    <button
                      onClick={() => deleteReportedNote(report.noteId)}
                      className="inline-flex items-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm text-red-400 transition hover:bg-red-500/20"
                    >
                      <Trash2 size={16} />
                      Delete Note
                    </button>

                    <button
                      onClick={() => deleteReport(report.id)}
                      className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/60 transition hover:bg-white/10"
                    >
                      Delete Report
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}