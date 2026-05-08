"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import type { Note } from "@/types/note";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [notes, setNotes] = useState<Note[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/signin");
    }
  }, [user, loading, router]);

  useEffect(() => {
    async function fetchDashboard() {
      if (!user) return;

      setFetching(true);

      const q = query(collection(db, "notes"), where("uploaderId", "==", user.uid));
      const snap = await getDocs(q);

      const data: Note[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Note, "id">),
      }));

      setNotes(data);
      setFetching(false);
    }

    if (user) fetchDashboard();
  }, [user]);

  if (loading || fetching) {
    return <p className="p-10">Loading dashboard...</p>;
  }

  const totalUploads = notes.length;

  const totalDownloads = notes.reduce((sum, note) => {
    return sum + (note.downloadsCount ?? 0);
  }, 0);

  const pendingNotes = notes.filter((n) => n.status === "pending").length;
  const approvedNotes = notes.filter((n) => n.status === "approved").length;
  const rejectedNotes = notes.filter((n) => n.status === "rejected").length;

  return (
    <div className="container-max py-10">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <p className="mt-2 text-white/70">
        Welcome, {user?.email}
      </p>

      <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="glass-card p-6">
          <p className="text-sm text-white/60">Total Uploads</p>
          <p className="mt-2 text-3xl font-bold text-white">{totalUploads}</p>
        </div>

        <div className="glass-card p-6">
          <p className="text-sm text-white/60">Total Downloads</p>
          <p className="mt-2 text-3xl font-bold text-white">{totalDownloads}</p>
        </div>

        <div className="glass-card p-6">
          <p className="text-sm text-white/60">Pending Notes</p>
          <p className="mt-2 text-3xl font-bold text-yellow-400">
            {pendingNotes}
          </p>
        </div>

        <div className="glass-card p-6">
          <p className="text-sm text-white/60">Approved Notes</p>
          <p className="mt-2 text-3xl font-bold text-green-400">
            {approvedNotes}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="glass-card p-6">
          <p className="text-sm text-white/60">Rejected Notes</p>
          <p className="mt-2 text-3xl font-bold text-red-400">
            {rejectedNotes}
          </p>
        </div>

        <div className="glass-card p-6">
          <p className="text-sm text-white/60">Account Type</p>
          <p className="mt-2 text-2xl font-bold text-white">Free</p>
          <p className="mt-2 text-xs text-white/50">
            Premium system will be added later.
          </p>
        </div>
      </div>

      <div className="mt-10">
        <button
          onClick={() => router.push("/upload")}
          className="btn-primary"
        >
          Upload New Notes
        </button>
      </div>
    </div>
  );
}