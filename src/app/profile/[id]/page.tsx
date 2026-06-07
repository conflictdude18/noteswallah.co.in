"use client";

import type { CreatorStats } from "@/types/creator";
import type React from "react";
import Image from "next/image";
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
  Award,
  BadgeCheck,
  BookOpen,
  Download,
  Eye,
  FileText,
  Flame,
  GraduationCap,
  Heart,
  Loader2,
  RefreshCw,
  Sparkles,
  UserRound,
  CalendarDays,
  ShieldCheck,
  TrendingUp,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import {
  getCreatorLevelProgress,
  getNextCreatorLevel,
} from "@/lib/creatorLevels";

import { db } from "@/firebase/firebase";
import { useAuth } from "@/contexts/AuthContext";
import UserAvatar from "@/components/UserAvatar";
import type { Note } from "@/types/note";
import { createNotification } from "@/lib/createNotification";

type UserProfile = {
  uid: string;
  displayName?: string;
  name?: string;
  bio?: string;
  occupation?: string;
  avatarUrl?: string;
  photoURL?: string;
  profileImage?: string;
  profileImageUrl?: string;
  imageUrl?: string;
  verified?: boolean;
  createdAt?: unknown;
};

type PublicNote = Note & {
  id: string;
  views?: number;
  likes?: number;
  downloads?: number;
  downloadsCount?: number;
  createdAt?: unknown;
};

export default function PublicProfilePage() {
  const params = useParams<{ id?: string; uid?: string }>();
  const id = params.id || params.uid;
  const router = useRouter();
  const { user } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [notes, setNotes] = useState<PublicNote[]>([]);
  const [creatorStats, setCreatorStats] = useState<CreatorStats | null>(null);
  const [loading, setLoading] = useState(true);

  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followDocId, setFollowDocId] = useState("");
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      if (!id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const userSnap = await getDoc(doc(db, "users", id));

        const creatorStatsSnap = await getDoc(doc(db, "creatorStats", id));

        if (creatorStatsSnap.exists()) {
          setCreatorStats(creatorStatsSnap.data() as CreatorStats);
        } else {
          setCreatorStats(null);
        }

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

        const followersQuery = query(
          collection(db, "follows"),
          where("followingId", "==", id)
        );

        const followingQuery = query(
          collection(db, "follows"),
          where("followerId", "==", id)
        );

        const [notesSnap, followersSnap, followingSnap] = await Promise.all([
          getDocs(notesQuery),
          getDocs(followersQuery),
          getDocs(followingQuery),
        ]);

        const notesData: PublicNote[] = notesSnap.docs.map((noteDoc) => ({
          id: noteDoc.id,
          ...(noteDoc.data() as Omit<PublicNote, "id">),
        }));

        setNotes(notesData);
        setFollowersCount(followersSnap.docs.length);
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

  const totalDownloads = useMemo(
    () => notes.reduce((sum, note) => sum + getDownloads(note), 0),
    [notes]
  );

  const totalLikes = useMemo(
    () => notes.reduce((sum, note) => sum + getNumber(note.likes), 0),
    [notes]
  );

  const totalViews = useMemo(
    () => notes.reduce((sum, note) => sum + getNumber(note.views), 0),
    [notes]
  );

  const topSubjects = useMemo(() => {
    const subjectMap = new Map<string, number>();

    notes.forEach((note) => {
      if (!note.subject) return;
      subjectMap.set(note.subject, (subjectMap.get(note.subject) || 0) + 1);
    });

    return Array.from(subjectMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [notes]);

  const topNotes = useMemo(() => {
    return [...notes]
      .sort((a, b) => getCreatorScore(b) - getCreatorScore(a))
      .slice(0, 3);
  }, [notes]);

  const latestNotes = useMemo(() => {
    return [...notes]
      .sort((a, b) => getCreatedTime(b.createdAt) - getCreatedTime(a.createdAt))
      .slice(0, 6);
  }, [notes]);

  const bestNote = topNotes[0];
  const currentCreatorLevel = creatorStats?.creatorLevel || {
  level: 1,
  title: "Starter",
  minApprovedUploads: 1,
};

  const nextCreatorLevel = getNextCreatorLevel(
    creatorStats?.approvedUploads || 0
  );

  const levelProgress = getCreatorLevelProgress(
    creatorStats?.approvedUploads || 0
  );

  const unlockedBadges =
  creatorStats?.badges?.filter((badge) => badge.unlocked) || [];

  const creatorScore = creatorStats
    ? creatorStats.approvedUploads * 10 +
      creatorStats.totalDownloads * 2 +
      creatorStats.totalLikes * 4 +
      creatorStats.totalViews +
      creatorStats.bestUploadStreak * 8
    : 0;

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

        await createNotification({
          userId: id,
          type: "follow",
          title: "New follower 👋",
          message: `${
            user.displayName || user.email || "Someone"
          } started following you.`,
          link: `/profile/${user.uid}`,
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
      <main className="min-h-screen bg-[#050505] px-4 py-8 text-white">
        <div className="mx-auto flex min-h-[70vh] max-w-6xl items-center justify-center">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-white/10 bg-white/5">
              <RefreshCw className="animate-spin text-red-500" size={30} />
            </div>

            <h1 className="mt-5 text-xl font-black">Loading profile</h1>

            <p className="mt-2 text-sm text-white/50">
              Fetching profile and creator stats...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050505] px-4 text-white">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center">
          <UserRound size={42} className="mx-auto text-red-400" />
          <h1 className="mt-5 text-3xl font-black">User not found</h1>
        </div>
      </main>
    );
  }
  const memberSince = getJoinedDate(profile.createdAt);
  const displayName =
    profile?.displayName || profile?.name || "NotesWallah User";

  const avatarUrl =
    profile?.avatarUrl ||
    profile?.photoURL ||
    profile?.profileImage ||
    profile?.profileImageUrl ||
    profile?.imageUrl ||
    "";

  const trustLabel =
  creatorScore >= 10000
    ? "Elite Creator"
    : creatorScore >= 5000
      ? "Trusted Creator"
      : creatorScore >= 1000
        ? "Rising Creator"
        : "New Creator";

        const featuredNotes = [...notes]
        .sort(
          (a, b) =>
            ((b.downloads || 0) * 3 +
              (b.likes || 0) * 2 +
              (b.views || 0)) -
            ((a.downloads || 0) * 3 +
              (a.likes || 0) * 2 +
              (a.views || 0))
        )
        .slice(0, 3);

        const creatorBadges = [];

  if (notes.length >= 10)
    creatorBadges.push("📚 Contributor");

  if (notes.length >= 50)
    creatorBadges.push("🏆 Top Creator");

  if (followersCount >= 25)
    creatorBadges.push("❤️ Community Favourite");

  if (followersCount >= 100)
    creatorBadges.push("🔥 Influencer");

  if (creatorScore >= 5000)
    creatorBadges.push("⭐ Elite Creator");

  if (profile?.verified)
    creatorBadges.push("✅ Verified");

  return (
    <div className="space-y-5 pb-28 text-white md:pb-10">
        <section className="overflow-hidden rounded-[2.2rem] border border-white/10 bg-[#0d0d0d] shadow-2xl shadow-black/30">
      <div className="relative min-h-[220px] border-b border-white/10 bg-gradient-to-br from-red-700/45 via-red-500/10 to-zinc-950 px-5 py-6 sm:px-7 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_35%)]" />
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#0d0d0d] to-transparent" />

        <div className="relative flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="flex min-w-0 flex-col gap-4 md:flex-row md:items-end">
            <div className="w-fit rounded-[1.9rem] border-4 border-[#0d0d0d] bg-[#050505] shadow-2xl">
              <UserAvatar name={displayName} src={avatarUrl} size="lg" />
            </div>

            <div className="min-w-0 pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="break-words text-3xl font-black sm:text-4xl lg:text-5xl">
                  {displayName}
                </h1>

                {profile.verified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-3 py-1 text-xs font-bold text-blue-300 ring-1 ring-blue-400/20">
                    <BadgeCheck size={14} />
                    Verified
                  </span>
                )}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs font-bold text-red-100">
                  <Award size={14} />
                  {trustLabel}
                </span>

                <span className="inline-flex items-center gap-1 rounded-full border border-yellow-500/20 bg-yellow-500/10 px-3 py-1 text-xs font-bold text-yellow-200">
                  <Sparkles size={14} />
                  Level {currentCreatorLevel.level} · {currentCreatorLevel.title}
                </span>

                <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-bold text-white/65">
                  <GraduationCap size={14} />
                  {profile.occupation || "Student Creator"}
                </span>
              </div>
            </div>
          </div>

          {user?.uid !== id && (
            <button
              onClick={handleFollow}
              disabled={followLoading}
              className={`w-full justify-center md:w-auto ${
                isFollowing ? "btn-secondary" : "btn-primary"
              }`}
            >
              {followLoading && <Loader2 size={16} className="animate-spin" />}
              {followLoading ? "Please wait..." : isFollowing ? "Following" : "Follow Creator"}
            </button>
          )}
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8">
        <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
          <div>
            <p className="rounded-[1.5rem] border border-white/10 bg-black/25 p-4 text-sm leading-7 text-white/65">
              {profile.bio || "This creator has not added a bio yet."}
            </p>

            {topSubjects.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {topSubjects.map(([subject, count]) => (
                  <span
                    key={subject}
                    className="rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs font-bold text-red-200"
                  >
                    {subject} · {count}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-[1.5rem] border border-white/10 bg-black/25 p-4">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-red-300">
              Creator Identity
            </p>

            <div className="mt-4 space-y-3 text-sm font-semibold text-white/60">
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2">
                  <ShieldCheck size={16} />
                  Status
                </span>
                <span className="font-black text-white">{trustLabel}</span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2">
                  <TrendingUp size={16} />
                  Score
                </span>
                <span className="font-black text-white">
                  {Number.isFinite(creatorScore) ? creatorScore : 0}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2">
                  <CalendarDays size={16} />
                  Joined
                </span>
                <span className="font-black text-white">{memberSince}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 md:mt-8 md:grid-cols-6 md:gap-4">
          <StatCard icon={<BookOpen size={22} />} value={notes.length} label="Notes" />
          <StatCard icon={<Users size={22} />} value={followersCount} label="Followers" />
          <StatCard icon={<Download size={22} />} value={totalDownloads} label="Downloads" />
          <StatCard icon={<Heart size={22} />} value={totalLikes} label="Likes" />
          <StatCard icon={<Eye size={22} />} value={totalViews} label="Views" />
          <StatCard icon={<Flame size={22} />} value={creatorStats?.bestUploadStreak || 0} label="Best Streak" />
        </div>

        <div className="mt-6 rounded-[1.6rem] border border-white/10 bg-black/25 p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-red-300">
                Creator Progress
              </p>

              <h3 className="mt-1 text-lg font-black text-white">
                Level {currentCreatorLevel.level} · {currentCreatorLevel.title}
              </h3>
            </div>

            <span className="rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-sm font-black text-red-200">
              {Math.round(levelProgress)}%
            </span>
          </div>

          <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-700"
              style={{
                width: `${Math.min(100, Math.max(0, levelProgress))}%`,
              }}
            />
          </div>

          <div className="mt-3 flex items-center justify-between text-sm">
            <span className="text-white/50">
              Current Score:
              <span className="ml-2 font-black text-white">
                {Number.isFinite(creatorScore) ? creatorScore : 0}
              </span>
            </span>

            {nextCreatorLevel && (
              <span className="text-white/50">
                Next:
                <span className="ml-2 font-black text-red-300">
                  {nextCreatorLevel.title}
                </span>
              </span>
            )}
          </div>
        </div>

        <div className="mt-5 rounded-[1.6rem] border border-white/10 bg-black/25 p-5">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-red-300">
            Achievements
          </p>

          <div className="mt-4 flex flex-wrap gap-3">
            {creatorBadges.length > 0 ? (
              creatorBadges.map((badge) => (
                <span
                  key={badge}
                  className="rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-bold text-red-100"
                >
                  {badge}
                </span>
              ))
            ) : (
              <span className="text-sm text-white/50">
                Upload more notes to unlock achievements.
              </span>
            )}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 md:flex md:flex-wrap">
          <Link
            href={`/profile/${id}/followers`}
            className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-center text-sm font-black text-white/75 transition hover:border-red-500/30 hover:bg-white/[0.05]"
          >
            View followers
          </Link>

          <Link
            href={`/profile/${id}/following`}
            className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-center text-sm font-black text-white/75 transition hover:border-red-500/30 hover:bg-white/[0.05]"
          >
            View following
          </Link>
        </div>
      </div>
    </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-[1fr_360px]">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-none sm:p-6">
            <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-red-300">
              <Award size={15} />
              Creator Badges
            </p>

            <h2 className="mt-2 text-xl font-black">Achievements</h2>

            {unlockedBadges.length > 0 ? (
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {unlockedBadges.map((badge) => (
                  <div
                    key={badge.id}
                    className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-xl bg-red-600 text-white">
                        <Award size={19} />
                      </div>

                      <div>
                        <h3 className="text-sm font-black">{badge.title}</h3>
                        <p className="mt-1 text-xs leading-5 text-white/50">
                          {badge.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyBox text="No creator badges unlocked yet." />
            )}
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-none sm:p-6">
            <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-red-300">
              <Sparkles size={15} />
              Creator Progress
            </p>

            <div className="mt-5 rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-yellow-300">
                    Creator Level
                  </p>
                  <h3 className="mt-1 text-xl font-black">
                    Level {currentCreatorLevel.level} · {currentCreatorLevel.title}
                  </h3>
                </div>

                <div className="rounded-2xl bg-yellow-500/15 px-4 py-2 text-sm font-black text-yellow-300">
                  {creatorStats?.approvedUploads || 0} uploads
                </div>
              </div>

              <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-yellow-400"
                  style={{ width: `${levelProgress}%` }}
                />
              </div>

              <p className="mt-3 text-xs font-semibold text-white/45">
                {nextCreatorLevel
                  ? `Next: Level ${nextCreatorLevel.level} · ${nextCreatorLevel.title} at ${nextCreatorLevel.minApprovedUploads} approved uploads.`
                  : "Maximum creator level reached."}
              </p>
            </div>

            <h2 className="mt-2 text-xl font-black">Profile Strength</h2>

            <div className="mt-5 rounded-2xl border border-white/10 bg-black/25 p-4">
              <div className="flex items-center justify-between text-sm font-black">
                <span>Profile Completion</span>
                <span>{creatorStats?.profileCompletion || 0}%</span>
              </div>

              <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-red-600"
                  style={{ width: `${creatorStats?.profileCompletion || 0}%` }}
                />
              </div>
            </div>

            {(creatorStats?.profileCompletion || 0) >= 100 ? (
              <div className="mt-4 rounded-2xl border border-green-500/20 bg-green-500/10 p-4">
                <p className="text-sm font-black text-green-300">
                  Complete Profile Badge Unlocked ✅
                </p>
                <p className="mt-1 text-xs leading-5 text-white/50">
                  This creator completed their profile and unlocked the Complete Profile reward.
                </p>
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-white/10 bg-black/25 p-4">
                <p className="text-sm font-black text-white/70">
                  Complete your profile to unlock a badge.
                </p>
                <p className="mt-1 text-xs leading-5 text-white/45">
                  Add profile picture, display name, bio and occupation.
                </p>
              </div>
            )}

            <div className="mt-4 grid grid-cols-2 gap-3">
              <MiniCreatorStat label="Creator Score" value={creatorScore} />
              <MiniCreatorStat
                label="Upload Streak"
                value={creatorStats?.uploadStreak || 0}
              />
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-[1fr_1fr]">
          <CreatorPanel
            title="Best Performing Note"
            subtitle="Top note based on downloads, likes and views"
            icon={<Flame size={15} />}
          >
            {bestNote ? (
              <NoteRow note={bestNote} />
            ) : (
              <EmptyBox text="No top note yet." />
            )}
          </CreatorPanel>

          <CreatorPanel
            title="Featured Notes"
            subtitle="Best performing uploads from this creator"
            icon={<Award size={15} />}
          >
            {topNotes.length > 0 ? (
              <div className="space-y-3">
                {topNotes.map((note) => (
                  <NoteRow key={note.id} note={note} />
                ))}
              </div>
            ) : (
              <EmptyBox text="Featured notes will appear here." />
            )}
          </CreatorPanel>
        </section>

        <section className="mt-8 md:mt-12">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-red-300">
                <Sparkles size={15} />
                Public Library
              </p>

              <h2 className="mt-2 text-2xl font-black md:text-3xl">
                Uploaded Notes
              </h2>
            </div>

            <p className="text-xs font-semibold text-white/45">
              {notes.length} notes
            </p>
          </div>

          {latestNotes.length === 0 ? (
            <div className="mt-5 rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center text-white/50 shadow-none md:mt-6 md:p-10">
              No uploaded notes yet.
            </div>
          ) : (
            <div className="mt-5 grid gap-4 md:mt-6 md:grid-cols-2 lg:grid-cols-3">
              {latestNotes.map((note) => (
                <NoteCard key={note.id} note={note} />
              ))}
            </div>
          )}
        </section>
      </div>
  );
}

function CreatorPanel({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-none sm:p-6">
      <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-red-300">
        {icon}
        Creator Stats
      </p>

      <h2 className="mt-2 text-xl font-black">{title}</h2>
      <p className="mt-1 text-sm text-white/45">{subtitle}</p>

      <div className="mt-5">{children}</div>
    </div>
  );
}

function NoteCard({ note }: { note: PublicNote }) {
  return (
    <Link
      href={`/notes/${note.id}`}
      className="group overflow-hidden rounded-[1.6rem] border border-white/10 bg-white/[0.04] shadow-none transition hover:border-red-500/30 hover:bg-white/[0.06]"
    >
      <div className="grid grid-cols-[92px_1fr] md:block">
        <div className="relative min-h-[125px] overflow-hidden border-r border-white/10 bg-zinc-950 md:h-52 md:border-b md:border-r-0">
          {note.thumbnailUrl ? (
            <Image
              src={note.thumbnailUrl}
              alt={note.title || "Note thumbnail"}
              fill
              sizes="(max-width: 768px) 92px, (max-width: 1280px) 50vw, 33vw"
              className="object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-red-500/10">
              <FileText className="text-red-400" size={36} />
            </div>
          )}
        </div>

        <div className="min-w-0 p-4 sm:p-5">
          <h3 className="line-clamp-2 text-base font-black leading-snug sm:text-lg">
            {note.title || "Untitled Note"}
          </h3>

          <p className="mt-2 truncate text-xs font-semibold text-white/50 sm:text-sm">
            {note.subject || "General"} • {formatClassLabel(note.class)}
          </p>

          <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold text-white/45">
            <span className="flex items-center gap-1">
              <Download size={14} />
              {getDownloads(note)}
            </span>

            <span className="flex items-center gap-1">
              <Heart size={14} />
              {getNumber(note.likes)}
            </span>

            <span className="flex items-center gap-1">
              <Eye size={14} />
              {getNumber(note.views)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function NoteRow({ note }: { note: PublicNote }) {
  return (
    <Link
      href={`/notes/${note.id}`}
      className="block rounded-2xl border border-white/10 bg-black/25 p-4 transition hover:border-red-500/30 hover:bg-white/[0.05]"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-500/10 text-red-300">
          <BookOpen size={21} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap gap-2">
            <span className="rounded-full border border-red-500/20 bg-red-500/10 px-2.5 py-1 text-[10px] font-bold text-red-200">
              {note.subject || "General"}
            </span>

            {note.type && (
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-bold text-white/50">
                {note.type}
              </span>
            )}
          </div>

          <h3 className="line-clamp-2 text-sm font-black text-white">
            {note.title || "Untitled Note"}
          </h3>

          <p className="mt-1 line-clamp-1 text-xs text-white/45">
            {note.topic || note.description || "No description"}
          </p>

          <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold text-white/45">
            <span className="flex items-center gap-1">
              <Download size={13} />
              {getDownloads(note)}
            </span>

            <span className="flex items-center gap-1">
              <Heart size={13} />
              {getNumber(note.likes)}
            </span>

            <span className="flex items-center gap-1">
              <Eye size={13} />
              {getNumber(note.views)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function EmptyBox({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-5 text-sm leading-6 text-white/45">
      {text}
    </div>
  );
}

function MiniCreatorStat({
  label,
  value,
}: {
  label: string;
  value: number | string | undefined | null;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
      <p className="text-2xl font-black">
        {Number.isFinite(Number(value)) ? Number(value) : 0}
      </p>
      <p className="mt-1 text-xs font-bold text-white/45">{label}</p>
    </div>
  );
}

function StatCard({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
}) {
  return (
    <div className="min-w-0 rounded-[1.25rem] border border-white/10 bg-black/25 p-3 md:rounded-[1.5rem] md:p-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-500/10 text-red-300 md:h-11 md:w-11">
        {icon}
      </div>

      <p className="mt-3 truncate text-xl font-black md:text-2xl">{value}</p>

      <p className="text-[11px] font-bold text-white/45 md:text-sm">
        {label}
      </p>
    </div>
  );
}

function getNumber(value: unknown) {
  return typeof value === "number" ? value : 0;
}

function getDownloads(note: PublicNote) {
  return getNumber(note.downloads) || getNumber(note.downloadsCount);
}

function getCreatorScore(note: PublicNote) {
  return getDownloads(note) * 3 + getNumber(note.likes) * 2 + getNumber(note.views);
}

function getCreatedTime(value: unknown) {
  if (!value) return 0;

  if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof value.toDate === "function"
  ) {
    return value.toDate().getTime();
  }

  if (typeof value === "string") {
    return new Date(value).getTime() || 0;
  }

  return 0;
}

function normalizeClassName(value?: string) {
  const match = value?.match(/\d+/);
  return match ? match[0] : (value || "").toLowerCase().trim();
}

function formatClassLabel(value?: string) {
  const normalized = normalizeClassName(value);

  if (!normalized) return "Class not set";
  if (/^\d+$/.test(normalized)) return `Class ${normalized}`;

  return value || "Class not set";
}

function getJoinedDate(value: unknown) {
  if (!value) return "Recently";

  if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof value.toDate === "function"
  ) {
    return value.toDate().toLocaleDateString("en-IN", {
      month: "short",
      year: "numeric",
    });
  }

  if (typeof value === "string") {
    const date = new Date(value);

    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString("en-IN", {
        month: "short",
        year: "numeric",
      });
    }
  }

  return "Recently";
}