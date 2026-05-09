"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { useParams } from "next/navigation";
import {
  BadgeCheck,
  BookOpen,
  Download,
  FileText,
  GraduationCap,
  UserRound,
} from "lucide-react";

import { db } from "@/firebase/firebase";
import type { Note } from "@/types/note";

type UserProfile = {
  uid: string;
  displayName?: string;
  name?: string;
  email?: string;
  bio?: string;
  occupation?: string;
  avatarUrl?: string;
  photoURL?: string;
  verified?: boolean;
};

export default function PublicProfilePage() {
  const { id } = useParams<{ id: string }>();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const userSnap = await getDoc(doc(db, "users", id));

        if (userSnap.exists()) {
          setProfile(userSnap.data() as UserProfile);
        }

        const q = query(
          collection(db, "notes"),
          where("uploaderId", "==", id),
          where("status", "==", "approved")
        );

        const notesSnap = await getDocs(q);

        const uploadedNotes: Note[] = notesSnap.docs.map((noteDoc) => ({
          id: noteDoc.id,
          ...(noteDoc.data() as Omit<Note, "id">),
        }));

        setNotes(uploadedNotes);
      } catch (err) {
        console.error("PROFILE ERROR:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [id]);

  const displayName =
    profile?.displayName || profile?.name || "NotesWallah User";

  const avatarUrl = profile?.avatarUrl || profile?.photoURL || "";

  const totalDownloads = useMemo(() => {
    return notes.reduce((sum, note) => sum + (note.downloadsCount ?? 0), 0);
  }, [notes]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-white/10 border-t-red-500" />
          <p className="mt-4 text-white/60">Loading profile...</p>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        <div className="glass-card max-w-md p-8 text-center">
          <h1 className="text-3xl font-black">User not found</h1>
          <p className="mt-3 text-white/60">
            This profile does not exist or has been removed.
          </p>
          <Link href="/browse" className="btn-primary mt-6">
            Browse Notes
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="container-max py-10">
        {/* PROFILE HERO */}
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-zinc-950">
          <div className="h-32 border-b border-white/10 bg-gradient-to-r from-red-600/30 via-red-500/10 to-zinc-950" />

          <div className="p-6 md:p-8">
            <div className="-mt-20 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div className="flex flex-col gap-5 md:flex-row md:items-end">
                <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-3xl border-4 border-black bg-red-600 text-5xl font-black shadow-xl">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    displayName.charAt(0).toUpperCase()
                  )}
                </div>

                <div className="pb-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-4xl font-black">{displayName}</h1>

                    {profile.verified && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs text-blue-400">
                        <BadgeCheck size={14} />
                        Verified
                      </span>
                    )}
                  </div>

                  <p className="mt-2 flex items-center gap-2 text-white/55">
                    <GraduationCap size={18} />
                    {profile.occupation || "Student"}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-green-500/20 bg-green-500/10 px-4 py-2 text-sm text-green-400">
                Trusted Contributor
              </div>
            </div>

            <p className="mt-8 max-w-3xl leading-relaxed text-white/65">
              {profile.bio || "This user has not added a bio yet."}
            </p>

            {/* STATS */}
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="glass-card p-5">
                <div className="flex items-center gap-3">
                  <BookOpen className="text-red-500" size={22} />
                  <div>
                    <p className="text-2xl font-black">{notes.length}</p>
                    <p className="text-sm text-white/50">Approved Notes</p>
                  </div>
                </div>
              </div>

              <div className="glass-card p-5">
                <div className="flex items-center gap-3">
                  <Download className="text-red-500" size={22} />
                  <div>
                    <p className="text-2xl font-black">{totalDownloads}</p>
                    <p className="text-sm text-white/50">Total Downloads</p>
                  </div>
                </div>
              </div>

              <div className="glass-card p-5">
                <div className="flex items-center gap-3">
                  <UserRound className="text-red-500" size={22} />
                  <div>
                    <p className="text-2xl font-black">
                      {profile.verified ? "Verified" : "Active"}
                    </p>
                    <p className="text-sm text-white/50">Contributor Status</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* UPLOADED NOTES */}
        <div className="mt-12">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-black">Uploaded Notes</h2>
              <p className="mt-2 text-white/50">
                Public notes approved by NotesWallah.
              </p>
            </div>

            <span className="hidden rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/50 sm:block">
              {notes.length} notes
            </span>
          </div>

          {notes.length === 0 ? (
            <div className="glass-card p-10 text-center">
              <FileText className="mx-auto text-white/30" size={54} />
              <h3 className="mt-5 text-2xl font-bold">No notes yet</h3>
              <p className="mt-3 text-white/55">
                This contributor has not uploaded approved notes yet.
              </p>
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
                    <div className="mb-3 inline-flex rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs text-red-400">
                      {note.subject}
                    </div>

                    <h3 className="line-clamp-2 text-lg font-bold transition group-hover:text-red-400">
                      {note.title}
                    </h3>

                    <p className="mt-3 line-clamp-2 text-sm text-white/55">
                      {note.description || "No description provided."}
                    </p>

                    <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4 text-xs text-white/45">
                      <span>
                        Class {note.class} • {note.topic}
                      </span>

                      <span>{note.downloadsCount ?? 0} downloads</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}