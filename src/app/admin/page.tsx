"use client";

import { createNotification } from "@/lib/createNotification";
import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import {
  AlertTriangle,
  BarChart3,
  Bell,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileText,
  RefreshCw,
  Search,
  Shield,
  Sparkles,
  Trash2,
  Users,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/firebase/firebase";
import type { Note } from "@/types/note";

type UserDoc = {
  role?: string;
  email?: string;
  name?: string;
};

type Report = {
  id: string;
  noteId?: string;
  noteTitle?: string;
  noteUploaderId?: string;
  reporterId?: string;
  reporterEmail?: string;
  reason?: string;
  details?: string;
  status?: "pending" | "resolved";
  createdAt?: string;
};

type AdminTab = "pending" | "approved" | "rejected" | "reported";

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [notes, setNotes] = useState<Note[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [fetching, setFetching] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<AdminTab>("pending");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function checkAdmin() {
      if (!user) return;

      setChecking(true);

      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        const data = snap.exists() ? (snap.data() as UserDoc) : null;
        setIsAdmin(data?.role === "admin");
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

  async function fetchAdminData() {
    setFetching(true);

    try {
      const notesSnap = await getDocs(collection(db, "notes"));
      const reportsSnap = await getDocs(collection(db, "reports"));

      const notesData: Note[] = notesSnap.docs.map((item) => ({
        id: item.id,
        ...(item.data() as Omit<Note, "id">),
      }));

      const reportsData: Report[] = reportsSnap.docs.map((item) => ({
        id: item.id,
        ...(item.data() as Omit<Report, "id">),
      }));

      setNotes(notesData);
      setReports(reportsData);
    } catch (err) {
      console.error("ADMIN DATA FETCH ERROR:", err);
      toast.error("Failed to load admin data.");
    } finally {
      setFetching(false);
    }
  }

  useEffect(() => {
    if (isAdmin) fetchAdminData();
  }, [isAdmin]);

  async function approveNote(noteId?: string) {
    if (!noteId) return;

    setActionLoadingId(noteId);

    try {
      const selectedNote = notes.find((note) => note.id === noteId);

      await updateDoc(doc(db, "notes", noteId), {
        status: "approved",
      });

      if (selectedNote?.uploaderId) {
        await createNotification({
          userId: selectedNote.uploaderId,
          type: "approved",
          title: "Note approved ✅",
          message: `Your note "${selectedNote.title || "Untitled Note"}" has been approved.`,
          link: `/notes/${noteId}`,
        });
      }

      toast.success("Note approved.");
      await fetchAdminData();
    } catch (err) {
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
      const selectedNote = notes.find((note) => note.id === noteId);

      await updateDoc(doc(db, "notes", noteId), {
        status: "rejected",
      });

      if (selectedNote?.uploaderId) {
        await createNotification({
          userId: selectedNote.uploaderId,
          type: "rejected",
          title: "Note rejected",
          message: `Your note "${selectedNote.title || "Untitled Note"}" was rejected after review.`,
          link: "/my-notes",
        });
      }

      toast.success("Note rejected.");
      await fetchAdminData();
    } catch (err) {
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

      toast.success("Note deleted.");
      await fetchAdminData();
    } catch (err) {
      console.error("DELETE NOTE ERROR:", err);
      toast.error("Failed to delete note.");
    } finally {
      setActionLoadingId(null);
    }
  }

  async function resolveReport(reportId?: string) {
    if (!reportId) return;

    setActionLoadingId(reportId);

    try {
      await updateDoc(doc(db, "reports", reportId), {
        status: "resolved",
      });

      toast.success("Report marked as resolved.");
      await fetchAdminData();
    } catch (err) {
      console.error("RESOLVE REPORT ERROR:", err);
      toast.error("Failed to resolve report.");
    } finally {
      setActionLoadingId(null);
    }
  }

  const stats = useMemo(() => {
    return {
      total: notes.length,
      pending: notes.filter((note) => note.status === "pending").length,
      approved: notes.filter((note) => note.status === "approved").length,
      rejected: notes.filter((note) => note.status === "rejected").length,
      reports: reports.filter((report) => report.status !== "resolved").length,
      users: new Set(notes.map((note) => note.uploaderId).filter(Boolean)).size,
    };
  }, [notes, reports]);

  const filteredNotes = useMemo(() => {
    const queryText = search.toLowerCase().trim();

    return notes
      .filter((note) => note.status === activeTab)
      .filter((note) => {
        if (!queryText) return true;

        return `${note.title || ""} ${note.subject || ""} ${note.class || ""} ${
          note.topic || ""
        } ${note.uploaderEmail || ""} ${note.uploaderName || ""}`
          .toLowerCase()
          .includes(queryText);
      });
  }, [notes, activeTab, search]);

  const filteredReports = useMemo(() => {
    const queryText = search.toLowerCase().trim();

    return reports
      .filter((report) => report.status !== "resolved")
      .filter((report) => {
        if (!queryText) return true;

        return `${report.noteTitle || ""} ${report.reason || ""} ${
          report.details || ""
        } ${report.reporterEmail || ""}`
          .toLowerCase()
          .includes(queryText);
      });
  }, [reports, search]);

  if (loading || checking) {
    return <AdminLoading />;
  }

  if (!isAdmin) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center px-4">
        <section className="glass-card w-full max-w-md rounded-[2rem] p-8 text-center">
          <Shield className="mx-auto text-red-300" size={48} />
          <h1 className="mt-6 text-3xl font-black text-red-300">
            Access Denied
          </h1>
          <p className="mt-3 text-sm text-white/55">
            You do not have admin permission for this page.
          </p>
          <button
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
        <div className="absolute right-[-140px] top-[-140px] h-[380px] w-[380px] rounded-full bg-red-500/20 blur-[130px]" />
        <div className="absolute bottom-[-160px] left-[-160px] h-[360px] w-[360px] rounded-full bg-yellow-500/10 blur-[140px]" />

        <div className="relative z-10 flex flex-col gap-7 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-black text-red-300">
              <Sparkles size={16} />
              Premium Admin Control
            </div>

            <h1 className="mt-6 text-4xl font-black tracking-tight text-white md:text-6xl">
              Moderation Dashboard
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/60">
              Review uploads, approve notes, manage rejected content, and handle
              reports from one powerful admin workspace.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:w-[420px]">
            <button
              type="button"
              onClick={() => router.push("/admin/users")}
              className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-3 text-sm font-black text-white transition hover:border-red-500/30 hover:bg-red-500/10"
            >
              <Users size={17} />
              Manage Users
            </button>

            <button
              type="button"
              onClick={fetchAdminData}
              disabled={fetching}
              className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-3 text-sm font-black text-white transition hover:border-red-500/30 hover:bg-red-500/10 disabled:opacity-60"
            >
              <RefreshCw size={17} className={fetching ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <StatCard label="Total Notes" value={stats.total} icon={<FileText size={22} />} />
        <StatCard label="Pending" value={stats.pending} icon={<Clock3 size={22} />} />
        <StatCard label="Approved" value={stats.approved} icon={<CheckCircle2 size={22} />} />
        <StatCard label="Rejected" value={stats.rejected} icon={<XCircle size={22} />} />
        <StatCard label="Reports" value={stats.reports} icon={<AlertTriangle size={22} />} />
        <StatCard label="Uploaders" value={stats.users} icon={<Users size={22} />} />
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-4 shadow-card">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-2">
            <TabButton active={activeTab === "pending"} onClick={() => setActiveTab("pending")}>
              Pending
            </TabButton>
            <TabButton active={activeTab === "approved"} onClick={() => setActiveTab("approved")}>
              Approved
            </TabButton>
            <TabButton active={activeTab === "rejected"} onClick={() => setActiveTab("rejected")}>
              Rejected
            </TabButton>
            <TabButton active={activeTab === "reported"} onClick={() => setActiveTab("reported")}>
              Reported
            </TabButton>
          </div>

          <div className="relative w-full xl:max-w-sm">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35" size={18} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title, subject, uploader..."
              className="w-full rounded-2xl border border-white/10 bg-black/30 py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-red-500/40"
            />
          </div>
        </div>
      </section>

      {fetching ? (
        <section className="glass-card rounded-[2rem] p-8">
          <div className="flex items-center gap-3 text-sm font-semibold text-white/60">
            <RefreshCw size={18} className="animate-spin text-red-300" />
            Loading admin data...
          </div>
        </section>
      ) : activeTab === "reported" ? (
        <section className="space-y-5">
          {filteredReports.length === 0 ? (
            <EmptyState
              title="No pending reports"
              text="All reports are resolved or no report matches your search."
            />
          ) : (
            filteredReports.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                busy={actionLoadingId === report.id}
                onResolve={() => resolveReport(report.id)}
              />
            ))
          )}
        </section>
      ) : (
        <section className="space-y-5">
          {filteredNotes.length === 0 ? (
            <EmptyState
              title="No notes found"
              text="No notes match this tab or search filter."
            />
          ) : (
            filteredNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                busy={actionLoadingId === note.id}
                onApprove={() => approveNote(note.id)}
                onReject={() => rejectNote(note.id)}
                onDelete={() => deleteNote(note.id)}
              />
            ))
          )}
        </section>
      )}
    </main>
  );
}

function AdminLoading() {
  return (
    <main className="flex min-h-[70vh] items-center justify-center px-4">
      <section className="w-full max-w-md rounded-[2rem] border border-white/10 bg-[#07090d] p-8 text-center shadow-card">
        <Shield className="mx-auto text-red-300" size={48} />
        <h1 className="mt-6 text-2xl font-black text-white">
          Checking Admin Access
        </h1>
        <p className="mt-3 text-sm text-white/55">
          Verifying your permission before opening the dashboard.
        </p>
      </section>
    </main>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-5 shadow-card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-white/50">{label}</p>
          <h2 className="mt-2 text-4xl font-black text-white">{value}</h2>
        </div>

        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-300">
          {icon}
        </div>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl px-5 py-3 text-sm font-black transition ${
        active
          ? "border border-red-500/25 bg-red-500/10 text-red-200"
          : "border border-white/10 bg-white/[0.04] text-white/55 hover:bg-white/[0.07] hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

function NoteCard({
  note,
  busy,
  onApprove,
  onReject,
  onDelete,
}: {
  note: Note;
  busy: boolean;
  onApprove: () => void;
  onReject: () => void;
  onDelete: () => void;
}) {
  return (
    <article className="rounded-[2rem] border border-white/10 bg-[#07090d] p-5 shadow-card md:p-6">
      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div>
          <StatusBadge status={note.status || "pending"} />

          <h2 className="mt-4 text-2xl font-black text-white">
            {note.title || "Untitled Note"}
          </h2>

          <p className="mt-3 line-clamp-3 text-sm leading-7 text-white/55">
            {note.description || "No description provided."}
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <InfoRow label="Class" value={note.class} />
            <InfoRow label="Subject" value={note.subject} />
            <InfoRow label="Topic" value={note.topic} />
            <InfoRow
              label="Uploader"
              value={note.uploaderEmail || note.uploaderName || "Unknown"}
            />
          </div>
        </div>

        <div className="rounded-[1.7rem] border border-white/10 bg-white/[0.035] p-4">
          <p className="mb-4 text-xs font-black uppercase tracking-[0.22em] text-white/35">
            Actions
          </p>

          <div className="grid gap-3">
            <a
              href={note.pdfURL}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-black text-white transition hover:bg-white/[0.1]"
            >
              <ExternalLink size={16} />
              Open PDF
            </a>

            {note.status !== "approved" && (
              <button disabled={busy} onClick={onApprove} className="admin-green-btn">
                <CheckCircle2 size={16} />
                Approve
              </button>
            )}

            {note.status !== "rejected" && (
              <button disabled={busy} onClick={onReject} className="admin-yellow-btn">
                <XCircle size={16} />
                Reject
              </button>
            )}

            <button disabled={busy} onClick={onDelete} className="admin-red-btn">
              <Trash2 size={16} />
              Delete
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function ReportCard({
  report,
  busy,
  onResolve,
}: {
  report: Report;
  busy: boolean;
  onResolve: () => void;
}) {
  return (
    <article className="rounded-[2rem] border border-yellow-500/20 bg-yellow-500/[0.04] p-5 shadow-card md:p-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/20 bg-yellow-500/10 px-3 py-1.5 text-xs font-black text-yellow-200">
            <Bell size={13} />
            Pending Report
          </div>

          <h2 className="mt-4 text-2xl font-black text-white">
            {report.noteTitle || "Reported Note"}
          </h2>

          <p className="mt-3 text-sm text-white/60">
            <strong>Reason:</strong> {report.reason || "Not provided"}
          </p>

          <p className="mt-2 max-w-3xl text-sm leading-7 text-white/55">
            {report.details || "No extra details provided."}
          </p>

          <p className="mt-3 text-xs text-white/35">
            Reporter: {report.reporterEmail || "Unknown"}
          </p>
        </div>

        <div className="grid gap-3 xl:w-64">
          {report.noteId && (
            <a
              href={`/notes/${report.noteId}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-black text-white transition hover:bg-white/[0.1]"
            >
              <ExternalLink size={16} />
              View Note
            </a>
          )}

          <button disabled={busy} onClick={onResolve} className="admin-green-btn">
            <CheckCircle2 size={16} />
            Mark Resolved
          </button>
        </div>
      </div>
    </article>
  );
}

function StatusBadge({ status }: { status: string }) {
  const classes =
    status === "approved"
      ? "border-green-500/20 bg-green-500/10 text-green-200"
      : status === "rejected"
        ? "border-red-500/20 bg-red-500/10 text-red-200"
        : "border-yellow-500/20 bg-yellow-500/10 text-yellow-200";

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-black ${classes}`}
    >
      <BarChart3 size={13} />
      {status.toUpperCase()}
    </span>
  );
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
      <span className="text-xs font-black uppercase tracking-wide text-white/35">
        {label}
      </span>
      <span className="line-clamp-1 break-all text-right text-sm font-bold text-white/75">
        {value || "Not set"}
      </span>
    </div>
  );
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-10 text-center shadow-card">
      <CheckCircle2 className="mx-auto text-green-300" size={48} />
      <h2 className="mt-5 text-2xl font-black text-white">{title}</h2>
      <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-white/55">
        {text}
      </p>
    </section>
  );
}