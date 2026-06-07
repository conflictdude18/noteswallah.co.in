"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import {
  BookOpen,
  ExternalLink,
  FileText,
  RefreshCw,
  Search,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

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

      setPageLoading(true);

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
        toast.error("Failed to load following feed.");
      } finally {
        setPageLoading(false);
      }
    }

    fetchFollowingNotes();
  }, [user, loading, router]);

  if (loading || pageLoading) {
    return (
        <div className="flex min-h-[70vh] items-center justify-center text-white">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-white/10 bg-white/5">
              <RefreshCw className="animate-spin text-red-500" size={30} />
            </div>

            <h1 className="mt-5 text-xl font-black">
              Loading following feed
            </h1>

            <p className="mt-2 text-sm text-white/50">
              Finding latest notes from people you follow...
            </p>
          </div>
        </div>
    );
  }

  return (
     <div className="space-y-5 pb-28 text-white md:pb-10">
        <section className="relative overflow-hidden">

          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 text-xs font-black text-red-300">
                <Users size={16} />
                Following Feed
              </div>

              <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-5xl">
                Notes from people you follow
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/55 sm:text-base">
                See the latest approved uploads from your favourite
                contributors in one clean feed.
              </p>
            </div>

            <Link
              href="/browse"
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-4 text-sm font-black text-white transition hover:bg-red-500 sm:w-fit"
            >
              <Search size={18} />
              Discover Notes
            </Link>
          </div>

          <div className="relative mt-6 grid grid-cols-2 gap-3 sm:max-w-md">
            <StatCard label="Feed Notes" value={notes.length} />
            <StatCard
              label="Contributors"
              value={
                new Set(notes.map((note) => note.uploaderId).filter(Boolean))
                  .size
              }
            />
          </div>
        </section>

        {notes.length === 0 ? (
          <section className="mt-5 rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 text-center shadow-2xl shadow-black/20 sm:p-12">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.5rem] border border-red-500/20 bg-red-500/10 text-red-300">
              <BookOpen size={38} />
            </div>

            <h2 className="mt-7 text-2xl font-black">
              No notes from followed users yet
            </h2>

            <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-white/55">
              Follow contributors from Browse or Profile pages. Their latest
              approved notes will appear here.
            </p>

            <Link
              href="/browse"
              className="mt-8 inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-black text-white transition hover:bg-red-500"
            >
              <BookOpen size={18} />
              Browse Notes
            </Link>
          </section>
        ) : (
          <section className="grid gap-3 pb-24 md:grid-cols-2 xl:grid-cols-3">
            {notes.map((note) => (
              <Link
                key={note.id}
                href={`/notes/${note.id}`}
                className="group overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] transition hover:border-red-500/30 hover:bg-white/[0.055]"
              >
                <div className="relative h-44 overflow-hidden bg-zinc-950 sm:h-52">
                  {note.thumbnailUrl ? (
                    <img
                      src={note.thumbnailUrl}
                      alt={note.title || "Note thumbnail"}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-red-500/10">
                      <FileText className="text-red-400" size={48} />
                    </div>
                  )}

                  <div className="absolute left-3 top-3 rounded-full border border-white/10 bg-black/60 px-3 py-1 text-[10px] font-black text-white/75 backdrop-blur-md">
                    Approved
                  </div>
                </div>

                <div className="p-4 sm:p-5">
                  <h3 className="line-clamp-2 text-base font-black leading-snug sm:text-lg">
                    {note.title || "Untitled Note"}
                  </h3>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <MiniTag>{note.subject || "Subject not set"}</MiniTag>
                    <MiniTag>Class {note.class || "N/A"}</MiniTag>
                    {note.topic && <MiniTag>{note.topic}</MiniTag>}
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/10 pt-4">
                    <p className="min-w-0 truncate text-xs font-semibold text-white/45">
                      By {note.uploaderName || "NotesWallah User"}
                    </p>

                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white px-3 py-1.5 text-[10px] font-black text-black transition group-hover:bg-red-500 group-hover:text-white">
                      Open
                      <ExternalLink size={12} />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </section>
        )}
      </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-4 text-center">
      <p className="text-2xl font-black text-white sm:text-3xl">{value}</p>
      <p className="mt-1 text-[11px] font-bold text-white/45 sm:text-xs">
        {label}
      </p>
    </div>
  );
}

function MiniTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="max-w-full truncate rounded-full border border-white/10 bg-black/25 px-2.5 py-1 text-[10px] font-bold text-white/55">
      {children}
    </span>
  );
}