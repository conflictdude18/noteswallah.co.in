"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { toast } from "sonner";
import { db } from "@/firebase/firebase";
import { useAuth } from "@/contexts/AuthContext";
import type { Note } from "@/types/note";

export default function NoteDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);

  const [bookmarkId, setBookmarkId] = useState<string | null>(null);
  const isBookmarked = Boolean(bookmarkId);

  useEffect(() => {
    async function fetchNote() {
      setLoading(true);

      const snap = await getDoc(doc(db, "notes", id));

      if (!snap.exists()) {
        setNote(null);
        setLoading(false);
        return;
      }

      setNote({
        id: snap.id,
        ...(snap.data() as Omit<Note, "id">),
      });

      setLoading(false);
    }

    fetchNote();
  }, [id]);

  useEffect(() => {
    async function checkBookmark() {
      if (!user || !id) return;

      const q = query(
        collection(db, "bookmarks"),
        where("userId", "==", user.uid),
        where("noteId", "==", id)
      );

      const snap = await getDocs(q);

      if (!snap.empty) {
        setBookmarkId(snap.docs[0].id);
      } else {
        setBookmarkId(null);
      }
    }

    checkBookmark();
  }, [user, id]);

  async function handleBookmark() {
    if (!user) {
      router.push("/signin");
      return;
    }

    if (!note?.id) return;

    try {
      if (bookmarkId) {
        await deleteDoc(doc(db, "bookmarks", bookmarkId));
        setBookmarkId(null);
        toast.success("Removed from saved notes.");
      } else {
        const newBookmark = await addDoc(collection(db, "bookmarks"), {
          userId: user.uid,
          noteId: note.id,
          title: note.title,
          subject: note.subject,
          class: note.class,
          topic: note.topic,
          pdfURL: note.pdfURL,
          createdAt: new Date().toISOString(),
        });

        setBookmarkId(newBookmark.id);
        toast.success("Saved to your notes.");
      }
    } catch (err: unknown) {
      console.error("BOOKMARK ERROR:", err);
      toast.error("Bookmark action failed.");
    }
  }

  async function handleDownload() {
    if (!note?.id) return;

    if (!user) {
      router.push("/signin");
      return;
    }

    await updateDoc(doc(db, "notes", note.id), {
      downloadsCount: increment(1),
    });

    window.open(note.pdfURL, "_blank");
  }

  if (loading) {
    return <p className="p-10">Loading...</p>;
  }

  if (!note) {
    return (
      <div className="container-max py-10">
        <h1 className="text-2xl font-bold">Note not found</h1>

        <button
          onClick={() => router.push("/browse")}
          className="btn-primary mt-6"
        >
          Back to Browse
        </button>
      </div>
    );
  }

  return (
    <div className="container-max py-10">
      <button
        onClick={() => router.push("/browse")}
        className="text-sm text-white/60 hover:text-white"
      >
        ← Back to Browse
      </button>

      <div className="mt-6 glass-card p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">{note.title}</h1>
            <p className="mt-3 text-white/70">{note.description}</p>
          </div>

          <button onClick={handleBookmark} className="btn-secondary shrink-0">
            {isBookmarked ? "Saved ✓" : "Save Note"}
          </button>
        </div>

        <div className="mt-6 grid gap-3 text-sm text-white/70 md:grid-cols-2">
          <p>
            <span className="font-medium text-white/90">Class:</span>{" "}
            {note.class}
          </p>

          <p>
            <span className="font-medium text-white/90">Subject:</span>{" "}
            {note.subject}
          </p>

          <p>
            <span className="font-medium text-white/90">Topic:</span>{" "}
            {note.topic}
          </p>

          <p>
            <span className="font-medium text-white/90">Downloads:</span>{" "}
            {note.downloadsCount ?? 0}
          </p>
        </div>

        {note.tags?.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {note.tags.map((tag, index) => (
              <span
                key={index}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-black/40">
          <iframe
            src={note.pdfURL}
            title={note.title}
            className="h-[75vh] w-full"
          />
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button onClick={handleDownload} className="btn-primary">
            {user ? "Download PDF" : "Login to Download"}
          </button>

          <a
            href={note.pdfURL}
            target="_blank"
            rel="noreferrer"
            className="btn-secondary text-center"
          >
            Open Original PDF
          </a>
        </div>

        <p className="mt-6 text-xs text-white/40">
          Uploaded by: {note.uploaderName} ({note.uploaderEmail})
        </p>
      </div>
    </div>
  );
}