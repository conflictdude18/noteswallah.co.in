"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { useParams, useRouter } from "next/navigation";
import {
  BadgeCheck,
  BookOpen,
  Download,
  FileText,
  GraduationCap,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";

import { db } from "@/firebase/firebase";
import { useAuth } from "@/contexts/AuthContext";
import UserAvatar from "@/components/UserAvatar";
import type { Note } from "@/types/note";
import { sendNotification } from "@/lib/sendNotification";

type UserProfile = {
  uid: string;
  displayName?: string;
  name?: string;
  bio?: string;
  occupation?: string;
  avatarUrl?: string;
  photoURL?: string;
  verified?: boolean;
};

export default function PublicProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followDocId, setFollowDocId] = useState("");
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      if (!id) return;

      try {
        setLoading(true);

        const userSnap = await getDoc(doc(db, "users", id));

        if (userSnap.exists()) {
          setProfile({
            uid: id,
            ...(userSnap.data() as Omit<UserProfile, "uid">),
          });
        } else {
          setProfile(null);
        }

        const notesQuery = query(
          collection(db, "notes"),
          where("uploaderId", "==", id),
          where("status", "==", "approved")
        );

        const notesSnap = await getDocs(notesQuery);

        setNotes(
          notesSnap.docs.map((noteDoc) => ({
            id: noteDoc.id,
            ...(noteDoc.data() as Omit<Note, "id">),
          }))
        );

        const followersQuery = query(
          collection(db, "follows"),
          where("followingId", "==", id)
        );

        const followersSnap = await getDocs(followersQuery);
        setFollowersCount(followersSnap.docs.length);

        const followingQuery = query(
          collection(db, "follows"),
          where("followerId", "==", id)
        );

        const followingSnap = await getDocs(followingQuery);
        setFollowingCount(followingSnap.docs.length);

        if (user) {
          const currentFollowQuery = query(
            collection(db, "follows"),
            where("followerId", "==", user.uid),
            where("followingId", "==", id)
          );

          const currentFollowSnap = await getDocs(currentFollowQuery);

          if (!currentFollowSnap.empty) {
            setIsFollowing(true);
            setFollowDocId(currentFollowSnap.docs[0].id);
          } else {
            setIsFollowing(false);
            setFollowDocId("");
          }
        }
      } catch (err) {
        console.error("PROFILE ERROR:", err);
        toast.error("Failed to load profile.");
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [id, user]);

  const displayName =
    profile?.displayName || profile?.name || "NotesWallah User";

  const avatarUrl = profile?.avatarUrl || profile?.photoURL || "";

  const totalDownloads = useMemo(() => {
    return notes.reduce((sum, note) => sum + (note.downloadsCount ?? 0), 0);
  }, [notes]);

  async function handleFollow() {
    if (!user) {
      router.push("/signin");
      return;
    }

    if (!id || user.uid === id) return;

    try {
      setFollowLoading(true);

      if (isFollowing && followDocId) {
        await deleteDoc(doc(db, "follows", followDocId));

        setIsFollowing(false);
        setFollowDocId("");
        setFollowersCount((prev) => Math.max(0, prev - 1));
        toast.success("Unfollowed.");
      } else {
        const newFollow = await addDoc(collection(db, "follows"), {
          followerId: user.uid,
          followerName: user.displayName || user.email || "NotesWallah User",
          followerAvatar: user.photoURL || "",
          followingId: id,
          followingName: displayName,
          createdAt: new Date().toISOString(),
        });

        await sendNotification({
          userId: id,
          title: "New Follower 👋",
          message: `${
            user.displayName || user.email || "Someone"
          } started following you.`,
          type: "system",
        });

        setFollowDocId(newFollow.id);
        setIsFollowing(true);
        setFollowersCount((prev) => prev + 1);
        toast.success("Following.");
      }
    } catch (err) {
      console.error("FOLLOW ERROR:", err);
      toast.error("Follow action failed.");
    } finally {
      setFollowLoading(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        Loading profile...
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        User not found.
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="container-max py-10">
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-zinc-950">
          <div className="h-32 border-b border-white/10 bg-gradient-to-r from-red-600/30 via-red-500/10 to-zinc-950" />

          <div className="p-6 md:p-8">
            <div className="-mt-20 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div className="flex flex-col gap-5 md:flex-row md:items-end">
                <div className="rounded-3xl border-4 border-black shadow-xl">
                  <UserAvatar name={displayName} src={avatarUrl} size="xl" />
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-4xl font-black">{displayName}</h1>

                    {profile.verified && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-3 py-1 text-xs text-blue-400">
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

              <div className="flex flex-wrap items-center gap-3">
                <div className="rounded-2xl border border-green-500/20 bg-green-500/10 px-4 py-2 text-sm text-green-400">
                  Trusted Contributor
                </div>

                <Link
                  href={`/profile/${id}/followers`}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
                >
                  {followersCount} followers
                </Link>

                <Link
                  href={`/profile/${id}/following`}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
                >
                  {followingCount} following
                </Link>

                {user && user.uid !== id && (
                  <button
                    onClick={handleFollow}
                    disabled={followLoading}
                    className={`rounded-2xl px-5 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
                      isFollowing
                        ? "border border-white/10 bg-white/10 hover:bg-white/15"
                        : "bg-red-600 hover:bg-red-500"
                    }`}
                  >
                    {followLoading
                      ? "Please wait..."
                      : isFollowing
                        ? "Following"
                        : "Follow"}
                  </button>
                )}

                {!user && (
                  <button
                    onClick={handleFollow}
                    className="rounded-2xl bg-red-600 px-5 py-2 text-sm font-medium transition hover:bg-red-500"
                  >
                    Follow
                  </button>
                )}
              </div>
            </div>

            <p className="mt-8 max-w-3xl text-white/65">
              {profile.bio || "This user has not added a bio yet."}
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="glass-card p-5">
                <BookOpen className="text-red-500" />
                <p className="mt-3 text-2xl font-black">{notes.length}</p>
                <p className="text-sm text-white/50">Approved Notes</p>
              </div>

              <div className="glass-card p-5">
                <Download className="text-red-500" />
                <p className="mt-3 text-2xl font-black">{totalDownloads}</p>
                <p className="text-sm text-white/50">Total Downloads</p>
              </div>

              <div className="glass-card p-5">
                <UserRound className="text-red-500" />
                <p className="mt-3 text-2xl font-black">
                  {profile.verified ? "Verified" : "Active"}
                </p>
                <p className="text-sm text-white/50">Contributor Status</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12">
          <h2 className="text-3xl font-black">Uploaded Notes</h2>

          {notes.length === 0 ? (
            <div className="glass-card mt-6 p-10 text-center text-white/50">
              No uploaded notes yet.
            </div>
          ) : (
            <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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