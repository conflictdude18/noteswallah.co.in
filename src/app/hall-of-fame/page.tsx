"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import {
  ArrowRight,
  Award,
  Crown,
  Download,
  Flame,
  Medal,
  RefreshCw,
  Sparkles,
  Trophy,
  UploadCloud,
} from "lucide-react";

import { db } from "@/firebase/firebase";
import UserAvatar from "@/components/UserAvatar";
import type { CreatorBadge, CreatorLevel } from "@/types/creator";

type HallCreator = {
  userId: string;
  displayName: string;
  photoURL?: string;
  approvedUploads: number;
  totalDownloads: number;
  totalLikes: number;
  totalViews: number;
  bestUploadStreak: number;
  badges: CreatorBadge[];
  creatorLevel?: CreatorLevel;
};

function getScore(creator: HallCreator) {
  const unlockedBadges = creator.badges.filter((badge) => badge.unlocked).length;

  return (
    creator.approvedUploads * 10 +
    creator.totalDownloads * 2 +
    creator.totalLikes * 4 +
    creator.totalViews +
    creator.bestUploadStreak * 8 +
    unlockedBadges * 15
  );
}

export default function HallOfFamePage() {
  const [creators, setCreators] = useState<HallCreator[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCreators() {
      try {
        const snap = await getDocs(collection(db, "creatorStats"));

        const data: HallCreator[] = snap.docs.map((item) => {
          const value = item.data();

          return {
            userId: value.userId || item.id,
            displayName: value.displayName || "NotesWallah Creator",
            photoURL: value.photoURL || "",
            approvedUploads: Number(value.approvedUploads || 0),
            totalDownloads: Number(value.totalDownloads || 0),
            totalLikes: Number(value.totalLikes || 0),
            totalViews: Number(value.totalViews || 0),
            bestUploadStreak: Number(value.bestUploadStreak || 0),
            badges: Array.isArray(value.badges) ? value.badges : [],
            creatorLevel: value.creatorLevel || undefined,
          };
        });

        setCreators(data.filter((creator) => creator.approvedUploads > 0));
      } catch (error) {
        console.error("HALL OF FAME ERROR:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchCreators();
  }, []);

  const legends = useMemo(() => {
    return [...creators].sort((a, b) => getScore(b) - getScore(a)).slice(0, 10);
  }, [creators]);

  const downloadKings = useMemo(() => {
    return [...creators]
      .sort((a, b) => b.totalDownloads - a.totalDownloads)
      .slice(0, 5);
  }, [creators]);

  const uploadMasters = useMemo(() => {
    return [...creators]
      .sort((a, b) => b.approvedUploads - a.approvedUploads)
      .slice(0, 5);
  }, [creators]);

  const streakChampions = useMemo(() => {
    return [...creators]
      .sort((a, b) => b.bestUploadStreak - a.bestUploadStreak)
      .slice(0, 5);
  }, [creators]);

  const badgeCollectors = useMemo(() => {
    return [...creators]
      .sort(
        (a, b) =>
          b.badges.filter((badge) => badge.unlocked).length -
          a.badges.filter((badge) => badge.unlocked).length
      )
      .slice(0, 5);
  }, [creators]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#050505] px-4 py-8 text-white">
        <div className="mx-auto flex min-h-[70vh] max-w-7xl items-center justify-center">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-white/10 bg-white/5">
              <RefreshCw className="animate-spin text-red-500" size={30} />
            </div>
            <h1 className="mt-5 text-xl font-black">Loading Hall of Fame</h1>
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
        <section className="relative overflow-hidden rounded-[2rem] border border-yellow-500/20 bg-gradient-to-br from-yellow-500/10 via-white/[0.04] to-red-500/10 p-5 shadow-2xl shadow-black/30 sm:p-7 lg:p-9">
          <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-yellow-500/20 blur-3xl" />

          <div className="relative grid gap-7 lg:grid-cols-[1fr_360px] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/25 bg-yellow-500/10 px-4 py-2 text-xs font-black text-yellow-300">
                <Trophy size={16} />
                Creator Hall of Fame
              </div>

              <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-6xl">
                NotesWallah Legends
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/55 sm:text-base">
                The most consistent, helpful, and trusted creators on
                NotesWallah.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <HeroStat label="Creators" value={creators.length} />
              <HeroStat
                label="Uploads"
                value={creators.reduce(
                  (sum, creator) => sum + creator.approvedUploads,
                  0
                )}
              />
              <HeroStat
                label="Downloads"
                value={creators.reduce(
                  (sum, creator) => sum + creator.totalDownloads,
                  0
                )}
              />
            </div>
          </div>
        </section>

        {creators.length === 0 ? (
          <section className="mt-5 rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 text-center shadow-2xl shadow-black/20">
            <Trophy className="mx-auto text-white/35" size={46} />
            <h2 className="mt-5 text-2xl font-black">No legends yet</h2>
            <p className="mt-2 text-sm text-white/50">
              Creators will appear after they upload approved notes.
            </p>
          </section>
        ) : (
          <>
            <section className="mt-5 grid gap-4 lg:grid-cols-3">
              {legends.slice(0, 3).map((creator, index) => (
                <TopLegendCard
                  key={creator.userId}
                  creator={creator}
                  rank={index + 1}
                />
              ))}
            </section>

            <section className="mt-5 rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20 sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-yellow-300">
                    <Crown size={15} />
                    Overall Ranking
                  </p>
                  <h2 className="mt-2 text-2xl font-black">Top Legends</h2>
                </div>

                <Link
                  href="/creators"
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-black text-white/75 transition hover:bg-white/[0.08] hover:text-white"
                >
                  Full Leaderboard
                  <ArrowRight size={16} />
                </Link>
              </div>

              <div className="mt-5 grid gap-3">
                {legends.map((creator, index) => (
                  <CreatorRow
                    key={creator.userId}
                    creator={creator}
                    rank={index + 1}
                    value={getScore(creator)}
                    valueLabel="Score"
                  />
                ))}
              </div>
            </section>

            <section className="mt-5 grid gap-5 lg:grid-cols-2">
              <RankingPanel
                title="Download Kings"
                icon={<Download size={16} />}
                creators={downloadKings}
                valueLabel="Downloads"
                getValue={(creator) => creator.totalDownloads}
              />

              <RankingPanel
                title="Upload Masters"
                icon={<UploadCloud size={16} />}
                creators={uploadMasters}
                valueLabel="Approved"
                getValue={(creator) => creator.approvedUploads}
              />

              <RankingPanel
                title="Streak Champions"
                icon={<Flame size={16} />}
                creators={streakChampions}
                valueLabel="Best Streak"
                getValue={(creator) => creator.bestUploadStreak}
              />

              <RankingPanel
                title="Badge Collectors"
                icon={<Award size={16} />}
                creators={badgeCollectors}
                valueLabel="Badges"
                getValue={(creator) =>
                  creator.badges.filter((badge) => badge.unlocked).length
                }
              />
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function TopLegendCard({
  creator,
  rank,
}: {
  creator: HallCreator;
  rank: number;
}) {
  const unlockedBadges = creator.badges.filter((badge) => badge.unlocked);

  return (
    <Link
      href={`/profile/${creator.userId}`}
      className="group rounded-[2rem] border border-yellow-500/20 bg-gradient-to-br from-yellow-500/10 via-white/[0.04] to-red-500/10 p-5 shadow-2xl shadow-black/20 transition hover:border-yellow-400/40 sm:p-6"
    >
      <div className="flex items-start justify-between gap-4">
        <UserAvatar
          name={creator.displayName}
          src={creator.photoURL || ""}
          size="lg"
        />

        <div className="rounded-full border border-yellow-500/20 bg-yellow-500/10 px-3 py-1 text-xs font-black text-yellow-300">
          #{rank}
        </div>
      </div>

      <h2 className="mt-5 line-clamp-1 text-xl font-black">
        {creator.displayName}
      </h2>

      <p className="mt-1 text-xs font-black text-yellow-300">
        Level {creator.creatorLevel?.level || 1} ·{" "}
        {creator.creatorLevel?.title || "Starter"}
      </p>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <MiniStat label="Score" value={getScore(creator)} />
        <MiniStat label="Badges" value={unlockedBadges.length} />
      </div>

      <div className="mt-5 rounded-2xl bg-red-600 px-5 py-3 text-center text-sm font-black text-white transition group-hover:bg-red-500">
        View Profile
      </div>
    </Link>
  );
}

function RankingPanel({
  title,
  icon,
  creators,
  valueLabel,
  getValue,
}: {
  title: string;
  icon: React.ReactNode;
  creators: HallCreator[];
  valueLabel: string;
  getValue: (creator: HallCreator) => number;
}) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20 sm:p-6">
      <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-red-300">
        {icon}
        Hall Category
      </p>

      <h2 className="mt-2 text-2xl font-black">{title}</h2>

      <div className="mt-5 grid gap-3">
        {creators.map((creator, index) => (
          <CreatorRow
            key={creator.userId}
            creator={creator}
            rank={index + 1}
            value={getValue(creator)}
            valueLabel={valueLabel}
          />
        ))}
      </div>
    </section>
  );
}

function CreatorRow({
  creator,
  rank,
  value,
  valueLabel,
}: {
  creator: HallCreator;
  rank: number;
  value: number;
  valueLabel: string;
}) {
  return (
    <Link
      href={`/profile/${creator.userId}`}
      className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/25 p-4 transition hover:border-red-500/30 hover:bg-white/[0.05]"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-yellow-500/10 text-yellow-300">
        {rank <= 3 ? <Medal size={20} /> : <span className="text-sm font-black">#{rank}</span>}
      </div>

      <UserAvatar
        name={creator.displayName}
        src={creator.photoURL || ""}
        size="sm"
      />

      <div className="min-w-0 flex-1">
        <h3 className="line-clamp-1 text-sm font-black">
          {creator.displayName}
        </h3>
        <p className="mt-1 text-xs font-semibold text-white/40">
          Level {creator.creatorLevel?.level || 1} ·{" "}
          {creator.creatorLevel?.title || "Starter"}
        </p>
      </div>

      <div className="text-right">
        <p className="text-sm font-black">{value}</p>
        <p className="text-[10px] font-bold text-white/35">{valueLabel}</p>
      </div>
    </Link>
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

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
      <p className="text-xl font-black">{value}</p>
      <p className="mt-1 text-xs font-bold text-white/40">{label}</p>
    </div>
  );
}