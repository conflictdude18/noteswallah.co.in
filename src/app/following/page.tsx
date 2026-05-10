"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { BookOpen, FileText, Users } from "lucide-react";
import { useRouter } from "next/navigation";

import { db } from "@/firebase/firebase";
import { useAuth } from "@/contexts/AuthContext";
import type { Note } from "@/types/note";

export default function FollowingFeedPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [notes, setNotes] = useState<Note[]>([]);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    async function fetchFollowingNotes() {
      if (loading) return;

      if (!user) {
        router.push("/signin");
        return;
      }

      try {
        const followsQuery = query(
          collection(db, "follows"),
          where("followerId", "==", user.uid)
        );

        const followsSnap = await getDocs(followsQuery);

        const followingIds = followsSnap.docs
          .map((followDoc) => followDoc.data().followingId)
          .filter((id): id is string => typeof id === "string");

        if (followingIds.length === 0) {
          setNotes([]);
          return;
        }

        const allNotes: Note[] = [];

        for (const followingId of followingIds) {
          const notesQuery = query(
            collection(db, "notes"),
            where("uploaderId", "==", followingId),
            where("status", "==", "approved")
          );

          const notesSnap = await getDocs(notesQuery);

          notesSnap.docs.forEach((noteDoc) => {
            allNotes.push({
              id: noteDoc.id,
              ...(noteDoc.data() as Omit<Note, "id">),
            });
          });
        }

        allNotes.sort((a, b) => {
          const dateA = new Date(String(a.uploadDate || "")).getTime();
          const dateB = new Date(String(b.uploadDate || "")).getTime();

          return dateB - dateA;
        });

        setNotes(allNotes);
      } catch (err) {
        console.error("FOLLOWING FEED ERROR:", err);
      } finally {
        setPageLoading(false);
      }
    }

    fetchFollowingNotes();
  }, [user, loading, router]);

  if (loading || pageLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050505] text-white">
        <div className="text-center">
          <div className="mx-auto h-14 w-14 animate-spin rounded-full border-4 border-red-500 border-t-transparent" />
          <p className="mt-5 text-white/60">Loading following feed...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <section className="container-max py-10">
        <div className="mb-8 flex items-center gap-3">
          <div className="rounded-2xl bg-red-500/10 p-3 text-red-500">
            <Users size={24} />
          </div>

          <div>
            <h1 className="text-3xl font-black">Following Feed</h1>
            <p className="text-sm text-white/50">
              Latest approved notes from contributors you follow.
            </p>
          </div>
        </div>

        {notes.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center">
            <BookOpen size={44} className="mx-auto text-white/30" />

            <h2 className="mt-4 text-2xl font-bold">
              No notes from followed users yet
            </h2>

            <p className="mt-2 text-sm text-white/50">
              Follow contributors to see their notes here.
            </p>

            <Link
              href="/browse"
              className="mt-6 inline-flex rounded-2xl bg-red-600 px-6 py-3 font-semibold text-white transition hover:bg-red-500"
            >
              Browse Notes
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {notes.map((note) => (
              <Link
                key={note.id}
                href={`/notes/${note.id}`}
                className="group overflow-hidden rounded-3xl border border-white/10 bg-white/5 transition hover:-translate-y-1 hover:border-red-500/30"
              >
                <div className="h-52 overflow-hidden bg-zinc-950">
                  {note.thumbnailUrl ? (
                    <img
                      src={note.thumbnailUrl}
                      alt={note.title}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <FileText className="text-red-500" size={48} />
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <h3 className="line-clamp-2 text-lg font-bold">
                    {note.title}
                  </h3>

                  <p className="mt-2 text-sm text-white/50">
                    {note.subject} • Class {note.class}
                  </p>

                  <p className="mt-3 text-xs text-white/40">
                    By {note.uploaderName || "NotesWallah User"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}