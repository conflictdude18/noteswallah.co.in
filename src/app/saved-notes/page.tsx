"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { toast } from "sonner";
import { db } from "@/firebase/firebase";
import { useAuth } from "@/contexts/AuthContext";
import LoadingSpinner from "@/components/LoadingSpinner";

type Bookmark = {
  id: string;
  userId: string;
  noteId: string;
  title: string;
  subject: string;
  class: string;
  topic: string;
  pdfURL: string;
  createdAt: string;
};

export default function SavedNotesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [fetching, setFetching] = useState(true);

  async function fetchBookmarks() {
    if (!user) return;

    setFetching(true);

    try {
      const q = query(
        collection(db, "bookmarks"),
        where("userId", "==", user.uid)
      );

      const snap = await getDocs(q);

      const data: Bookmark[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Bookmark, "id">),
      }));

      setBookmarks(data);
    } catch (err: unknown) {
      console.error("BOOKMARK FETCH ERROR:", err);
      toast.error("Failed to load saved notes.");
    } finally {
      setFetching(false);
    }
  }

  async function removeBookmark(bookmarkId: string) {
    try {
      await deleteDoc(doc(db, "bookmarks", bookmarkId));
      setBookmarks((prev) => prev.filter((item) => item.id !== bookmarkId));
      toast.success("Removed from saved notes.");
    } catch (err: unknown) {
      console.error("BOOKMARK DELETE ERROR:", err);
      toast.error("Failed to remove saved note.");
    }
  }

  useEffect(() => {
    if (!loading && !user) {
      router.push("/signin");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) fetchBookmarks();
  }, [user]);

  if (loading || fetching) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container-max py-10">
      <h1 className="text-3xl font-bold">Saved Notes</h1>
      <p className="mt-2 text-white/70">
        Notes you bookmarked for later.
      </p>

      {bookmarks.length === 0 && (
        <div className="mt-10 glass-card p-8">
          <p className="text-white/70">You have not saved any notes yet.</p>
          <button
            onClick={() => router.push("/browse")}
            className="btn-primary mt-6"
          >
            Browse Notes
          </button>
        </div>
      )}

      <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {bookmarks.map((item) => (
          <div key={item.id} className="glass-card p-6">
            <h2 className="text-lg font-semibold">{item.title}</h2>

            <div className="mt-4 space-y-1 text-xs text-white/50">
              <p>
                <span className="text-white/70">Class:</span> {item.class}
              </p>
              <p>
                <span className="text-white/70">Subject:</span>{" "}
                {item.subject}
              </p>
              <p>
                <span className="text-white/70">Topic:</span> {item.topic}
              </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <button
                onClick={() => router.push(`/notes/${item.noteId}`)}
                className="btn-secondary text-xs px-4 py-2"
              >
                Open
              </button>

              <button
                onClick={() => removeBookmark(item.id)}
                className="rounded-xl bg-red-600 px-4 py-2 text-xs text-white transition hover:bg-red-700"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}