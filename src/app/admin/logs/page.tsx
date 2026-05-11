"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  Timestamp,
} from "firebase/firestore";
import {
  Activity,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  FileText,
  Shield,
  Trash2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/firebase/firebase";

type UserDoc = {
  role?: string;
};

type AdminLog = {
  id: string;
  action?: "approved" | "rejected" | "deleted";
  noteId?: string;
  noteTitle?: string;
  adminId?: string;
  adminEmail?: string;
  createdAt?: Timestamp;
};

export default function AdminLogsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    async function checkAdmin() {
      if (!user) return;

      setChecking(true);

      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        const data = snap.data() as UserDoc | undefined;

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

  useEffect(() => {
    async function fetchLogs() {
      if (!isAdmin) return;

      setFetching(true);

      try {
        const q = query(
          collection(db, "adminLogs"),
          orderBy("createdAt", "desc")
        );

        const snap = await getDocs(q);

        const data: AdminLog[] = snap.docs.map((document) => ({
          id: document.id,
          ...(document.data() as Omit<AdminLog, "id">),
        }));

        setLogs(data);
      } catch (err) {
        console.error("ADMIN LOGS FETCH ERROR:", err);
        toast.error("Failed to load admin logs.");
      } finally {
        setFetching(false);
      }
    }

    fetchLogs();
  }, [isAdmin]);

  if (loading || checking) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center px-4">
        <section className="glass-card w-full max-w-md rounded-[2rem] p-8 text-center">
          <Shield className="mx-auto text-red-300" size={42} />
          <h1 className="mt-5 text-2xl font-black text-white">
            Checking Admin Access
          </h1>
          <p className="mt-3 text-sm text-white/55">
            Verifying permission before opening admin logs.
          </p>
        </section>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center px-4">
        <section className="glass-card w-full max-w-md rounded-[2rem] p-8 text-center">
          <Shield className="mx-auto text-red-300" size={42} />
          <h1 className="mt-5 text-3xl font-black text-red-300">
            Access Denied
          </h1>
          <p className="mt-3 text-sm text-white/55">
            You do not have admin permission for this page.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="space-y-8 pb-24 md:pb-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#06070b] p-6 shadow-card md:p-10">
        <div className="absolute right-[-120px] top-[-120px] h-[320px] w-[320px] rounded-full bg-red-500/25 blur-[130px]" />

        <div className="relative z-10">
          <button
            type="button"
            onClick={() => router.push("/admin")}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-black text-white/60 transition hover:border-red-500/30 hover:text-white"
          >
            <ArrowLeft size={16} />
            Back to Admin
          </button>

          <div className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-black text-red-300">
            <Activity size={16} />
            Admin Activity Logs
          </div>

          <h1 className="mt-6 text-4xl font-black tracking-tight text-white md:text-6xl">
            Moderation History
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/60 md:text-base">
            View every approve, reject, and delete action performed by admins.
          </p>
        </div>
      </section>

      {fetching && (
        <section className="glass-card rounded-[2rem] p-8">
          <div className="flex items-center gap-3 text-sm font-semibold text-white/60">
            <Clock3 size={18} className="text-red-300" />
            Loading admin logs...
          </div>
        </section>
      )}

      {!fetching && logs.length === 0 && (
        <section className="glass-card rounded-[2rem] p-10 text-center">
          <FileText className="mx-auto text-white/35" size={42} />
          <h2 className="mt-5 text-2xl font-black text-white">
            No Logs Yet
          </h2>
          <p className="mt-3 text-sm text-white/55">
            Admin actions will appear here after approval, rejection, or delete.
          </p>
        </section>
      )}

      {!fetching && logs.length > 0 && (
        <section className="space-y-4">
          {logs.map((log) => (
            <article
              key={log.id}
              className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-5 shadow-card backdrop-blur-xl md:p-6"
            >
              <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div className="flex gap-4">
                  <LogIcon action={log.action} />

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-black text-white">
                        {formatAction(log.action)}
                      </h2>

                      <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs font-bold text-white/45">
                        {formatDate(log.createdAt)}
                      </span>
                    </div>

                    <p className="mt-2 text-sm font-semibold text-white/65">
                      {log.noteTitle || "Untitled Note"}
                    </p>

                    <p className="mt-2 break-all text-xs text-white/35">
                      Note ID: {log.noteId || "Unknown"}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-left md:text-right">
                  <p className="text-xs font-bold text-white/35">
                    Action by
                  </p>
                  <p className="mt-1 break-all text-sm font-black text-white/70">
                    {log.adminEmail || "Unknown Admin"}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}

function LogIcon({ action }: { action?: AdminLog["action"] }) {
  const className =
    action === "approved"
      ? "border-green-500/25 bg-green-500/10 text-green-300"
      : action === "rejected"
        ? "border-yellow-500/25 bg-yellow-500/10 text-yellow-300"
        : "border-red-500/25 bg-red-500/10 text-red-300";

  const Icon =
    action === "approved" ? CheckCircle2 : action === "rejected" ? XCircle : Trash2;

  return (
    <div
      className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border ${className}`}
    >
      <Icon size={26} />
    </div>
  );
}

function formatAction(action?: AdminLog["action"]) {
  if (action === "approved") return "Note Approved";
  if (action === "rejected") return "Note Rejected";
  if (action === "deleted") return "Note Deleted";
  return "Unknown Action";
}

function formatDate(timestamp?: Timestamp) {
  if (!timestamp) return "Just now";

  return timestamp.toDate().toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}