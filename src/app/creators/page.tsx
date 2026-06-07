"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import {
  BadgeCheck,
  Download,
  FileText,
  Flame,
  Medal,
  RefreshCw,
  Search,
  Sparkles,
  Trophy,
  Users,
  X,
  Crown,
} from "lucide-react";

import { db } from "@/firebase/firebase";
import UserAvatar from "@/components/UserAvatar";
import type {
  CreatorBadge,
  CreatorLevel,
} from "@/types/creator";

type Creator = {
  userId: string;
  displayName: string;
  photoURL?: string;
  uploads: number;
  approvedUploads: number;
  totalDownloads: number;
  totalLikes: number;
  totalViews: number;
  uploadStreak: number;
  bestUploadStreak: number;
  profileCompletion: number;
  badges: CreatorBadge[];
  creatorLevel?: CreatorLevel;
  reputation: number;
  monthlyReputation: number;
  weeklyReputation: number;
  verifiedCreator?: boolean;
};

type SortMode = "overall" | "uploads" | "downloads" | "streak";

function getScore(creator: Creator) {
  return creator.reputation || 0;
}

async function rebuildCreatorStatsFromNotes() {
  const approvedNotesQuery = query(
    collection(db, "notes"),
    where("status", "==", "approved")
  );

  const notesSnap = await getDocs(approvedNotesQuery);

  const creatorsMap = new Map<string, Creator>();

  notesSnap.docs.forEach((noteSnap) => {
    const note = noteSnap.data();
    const uploaderId = note.uploaderId;

    if (!uploaderId) return;

    const old = creatorsMap.get(uploaderId);

    creatorsMap.set(uploaderId, {
      userId: uploaderId,
      displayName:
        note.uploaderName ||
        note.authorName ||
        old?.displayName ||
        "NotesWallah Creator",
      photoURL: old?.photoURL || "",
      uploads: (old?.uploads || 0) + 1,
      approvedUploads: (old?.approvedUploads || 0) + 1,
      totalDownloads:
        (old?.totalDownloads || 0) + Number(note.downloadsCount || 0),
      totalLikes: (old?.totalLikes || 0) + Number(note.likesCount || 0),
      totalViews: (old?.totalViews || 0) + Number(note.viewsCount || 0),
      uploadStreak: old?.uploadStreak || 0,
      bestUploadStreak: old?.bestUploadStreak || 0,
      profileCompletion: old?.profileCompletion || 0,
      reputation: old?.reputation || 0,
      monthlyReputation: old?.monthlyReputation || 0,
      weeklyReputation: old?.weeklyReputation || 0,
      verifiedCreator: old?.verifiedCreator || false,
      badges: old?.badges || [],
      creatorLevel: old?.creatorLevel || undefined,
    });
  });

  await Promise.all(
    Array.from(creatorsMap.values()).map((creator) =>
      setDoc(
        doc(db, "creatorStats", creator.userId),
        {
          ...creator,
          reputation:
            creator.reputation ||
            creator.approvedUploads * 25 + creator.uploads * 10,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      )
    )
  );
}

export default function CreatorsPage() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [search, setSearch] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("overall");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCreators() {
      try {
        const creatorStatsQuery = query(
          collection(db, "creatorStats"),
          orderBy("reputation", "desc")
        );

        let snap = await getDocs(creatorStatsQuery);
        console.log("CREATOR DOCS:", snap.size);

        const data: Creator[] = snap.docs.map((docSnap) => {
          const data = docSnap.data();

          return {
            userId: data.userId || docSnap.id,
            displayName: data.displayName || "NotesWallah Creator",
            photoURL: data.photoURL || "",
            uploads: Number(data.uploads || 0),
            approvedUploads: Number(data.approvedUploads || 0),
            totalDownloads: Number(data.totalDownloads || 0),
            totalLikes: Number(data.totalLikes || 0),
            totalViews: Number(data.totalViews || 0),
            uploadStreak: Number(data.uploadStreak || 0),
            bestUploadStreak: Number(data.bestUploadStreak || 0),
            profileCompletion: Number(data.profileCompletion || 0),

            reputation: Number(data.reputation || 0),
            monthlyReputation: Number(data.monthlyReputation || 0),
            weeklyReputation: Number(data.weeklyReputation || 0),
            verifiedCreator: Boolean(data.verifiedCreator),

            badges: Array.isArray(data.badges) ? data.badges : [],
            creatorLevel: data.creatorLevel || undefined,
          };
        });

        setCreators(data);
      } catch (error) {
        console.error("CREATORS ERROR:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchCreators();
  }, []);

  const filteredCreators = useMemo(() => {
    const term = search.toLowerCase().trim();

    const filtered = creators.filter((creator) => {
      if (!term) return true;

      return creator.displayName.toLowerCase().includes(term);
    });

    return [...filtered].sort((a, b) => {
      if (sortMode === "uploads") {
        return b.approvedUploads - a.approvedUploads;
      }

      if (sortMode === "downloads") {
        return b.totalDownloads - a.totalDownloads;
      }

      if (sortMode === "streak") {
        return b.bestUploadStreak - a.bestUploadStreak;
      }

      return getScore(b) - getScore(a);
    });
  }, [creators, search, sortMode]);

  const topCreator = filteredCreators[0];
  const totalCreators = creators.length;
  const totalApprovedUploads = creators.reduce(
    (sum, creator) => sum + creator.approvedUploads,
    0
  );
  const totalDownloads = creators.reduce(
    (sum, creator) => sum + creator.totalDownloads,
    0
  );

  if (loading) {
    return (
      <main className="min-h-screen bg-[#050505] px-4 py-8 text-white">
        <div className="mx-auto flex min-h-[70vh] max-w-7xl items-center justify-center">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-white/10 bg-white/5">
              <RefreshCw className="animate-spin text-red-500" size={30} />
            </div>
            <h1 className="mt-5 text-xl font-black">Loading leaderboard</h1>
            <p className="mt-2 text-sm text-white/50">
              Ranking NotesWallah creators...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#050505] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl pb-28 md:pb-10">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/10 via-white/[0.04] to-red-500/10 p-5 shadow-2xl shadow-black/30 sm:p-7 lg:p-9">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-red-500/20 blur-3xl" />

          <div className="relative grid gap-7 lg:grid-cols-[1fr_360px] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 text-xs font-black text-red-300">
                <Trophy size={15} />
                Creator Leaderboard
              </div>

              <h1 className="mt-5 text-3xl font-black sm:text-5xl">
                Top Contributors
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/55 sm:text-base">
                Discover creators ranked by approved notes, downloads, likes,
                views, and upload streaks.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <HeroStat label="Creators" value={totalCreators} />
              <HeroStat label="Notes" value={totalApprovedUploads} />
              <HeroStat label="Downloads" value={totalDownloads} />
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-4 lg:grid-cols-[1fr_360px]">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-black/20">
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search
                  size={18}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/40"
                />

                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search creators..."
                  className="w-full rounded-2xl border border-white/10 bg-black/30 py-3.5 pl-11 pr-11 text-sm font-semibold text-white outline-none transition placeholder:text-white/35 focus:border-red-500/40"
                />

                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-xl bg-white/10 text-white/60"
                    aria-label="Clear search"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              <select
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value as SortMode)}
                className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3.5 text-sm font-black text-white outline-none focus:border-red-500/40"
              >
                <option value="overall" className="bg-[#050505]">
                  Overall Rank
                </option>
                <option value="uploads" className="bg-[#050505]">
                  Most Uploads
                </option>
                <option value="downloads" className="bg-[#050505]">
                  Most Downloads
                </option>
                <option value="streak" className="bg-[#050505]">
                  Best Streak
                </option>
              </select>
            </div>
          </div>

          {topCreator && (
            <Link
              href={`/profile/${topCreator.userId}`}
              className="rounded-[2rem] border border-red-500/20 bg-red-500/10 p-5 shadow-2xl shadow-red-950/20 transition hover:bg-red-500/15"
            >
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-red-600 text-white">
                  <Medal size={24} />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-red-200/70">
                    Current #1
                  </p>
                  <h2 className="mt-1 line-clamp-1 text-lg font-black">
                    {topCreator.displayName}
                  </h2>
                  <p className="mt-1 text-xs font-bold text-red-100/70">
                    Level {topCreator.creatorLevel?.level || 1} ·{" "}
                    {topCreator.creatorLevel?.title || "Starter"}
                  </p>
                </div>
              </div>
            </Link>
          )}
        </section>

        {filteredCreators.length === 0 ? (
          <section className="mt-5 rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 text-center shadow-2xl shadow-black/20 sm:p-12">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.5rem] border border-red-500/20 bg-red-500/10 text-red-300">
              <Users size={38} />
            </div>
            <h2 className="mt-7 text-2xl font-black">No creators found</h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-white/55">
              Creators will appear after they upload notes.
            </p>
          </section>
        ) : (
          <section className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredCreators.map((creator, index) => {
              const unlockedBadges = creator.badges.filter(
                (badge) => badge.unlocked
              );

              return (
                <Link
                  key={creator.userId}
                  href={`/profile/${creator.userId}`}
                  className="group rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20 transition hover:border-red-500/30 hover:bg-white/[0.06] sm:p-6"
                >
                  <div className="flex items-start justify-between gap-4">
                    <UserAvatar
                      name={creator.displayName}
                      src={creator.photoURL || ""}
                      size="lg"
                    />

                    <div className="rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs font-black text-red-400">
                    {index === 0
                      ? "🥇"
                      : index === 1
                      ? "🥈"
                      : index === 2
                      ? "🥉"
                      : `#${index + 1}`}
                    </div>
                  </div>

                  <div className="mt-5">
                    <div className="flex min-w-0 items-center gap-2">
                      <div className="flex items-center gap-2">
                        <h2 className="line-clamp-1 text-xl font-black">
                          {creator.displayName}
                        </h2>

                        {creator.verifiedCreator && (
                          <BadgeCheck
                            size={18}
                            className="text-blue-400 shrink-0"
                          />
                        )}
                      </div>

                      {unlockedBadges.length >= 3 && (
                        <BadgeCheck
                          size={18}
                          className="shrink-0 text-blue-400"
                        />
                      )}
                    </div>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-yellow-500/20 bg-yellow-500/10 px-3 py-1 text-xs font-black text-yellow-300">
                      Level {creator.creatorLevel?.level || 1} ·{" "}
                      {creator.creatorLevel?.title || "Starter"}
                    </span>

                    <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-xs font-bold text-white/45">
                      Reputation: {creator.reputation || 0}
                    </span>
                  </div>
                  </div>

                  <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-3">
                    <MiniStat
                      icon={<FileText size={18} />}
                      value={creator.approvedUploads}
                      label="Approved"
                    />
                    <MiniStat
                      icon={<Download size={18} />}
                      value={creator.totalDownloads}
                      label="Downloads"
                    />
                    <MiniStat
                      icon={<Crown size={18} />}
                      value={creator.creatorLevel?.level || 1}
                      label="Level"
                    />
                  </div>

                  <div className="mt-5 rounded-2xl border border-white/10 bg-black/25 p-3">
                    <div className="mb-3 flex items-center gap-2 text-xs font-black text-white/60">
                      <Sparkles size={15} className="text-red-300" />
                      Badges
                    </div>

                    {unlockedBadges.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {unlockedBadges.slice(0, 3).map((badge) => (
                          <span
                            key={badge.id}
                            className="rounded-full border border-red-400/20 bg-red-500/10 px-3 py-1 text-[10px] font-black text-red-100"
                          >
                            {badge.title}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs font-semibold text-white/35">
                        No badges unlocked yet.
                      </p>
                    )}
                  </div>

                  <div className="mt-6 rounded-2xl bg-red-600 px-5 py-3 text-center text-sm font-black text-white transition group-hover:bg-red-500">
                    View Profile
                  </div>
                </Link>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}

function HeroStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-4 text-center">
      <p className="text-xl font-black sm:text-2xl">{value}</p>
      <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-white/35">
        {label}
      </p>
    </div>
  );
}

function MiniStat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/10 bg-black/25 p-3 text-center">
      <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-xl bg-red-500/10 text-red-300">
        {icon}
      </div>
      <p className="mt-2 truncate text-lg font-black">{value}</p>
      <p className="truncate text-[10px] font-bold text-white/40">{label}</p>
    </div>
  );
}