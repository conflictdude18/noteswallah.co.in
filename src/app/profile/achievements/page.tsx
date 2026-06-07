"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Award, CheckCircle2, Lock, RefreshCw, Sparkles, Trophy } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";

import { db } from "@/firebase/firebase";
import { useAuth } from "@/contexts/AuthContext";
import AchievementProgress from "@/components/AchievementProgress";
import AchievementBadge from "@/components/AchievementBadge";
import { ACHIEVEMENTS } from "@/lib/achievements";
import { updateUserAchievements } from "@/lib/updateUserAchievements";

type AchievementStats = {
  approvedNotes?: number;
  totalDownloads?: number;
  totalViews?: number;
  totalLikes?: number;
};

type UserData = {
  achievements?: string[];
  achievementStats?: AchievementStats;
};

export default function AchievementsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [userData, setUserData] = useState<UserData | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push("/signin");
  }, [loading, user, router]);

  useEffect(() => {
    async function fetchAchievements() {
      if (!user) return;

      try {
        await updateUserAchievements(user.uid);

        const userSnap = await getDoc(doc(db, "users", user.uid));

        if (userSnap.exists()) {
          setUserData(userSnap.data() as UserData);
        }
      } catch (err) {
        console.error("ACHIEVEMENTS FETCH ERROR:", err);
      } finally {
        setFetching(false);
      }
    }

    if (user) fetchAchievements();
  }, [user]);

  const achievements = userData?.achievements || [];
  const achievementStats = userData?.achievementStats || {};

  const unlockedCount = achievements.length;
  const totalCount = ACHIEVEMENTS.length;
  const lockedCount = totalCount - unlockedCount;

  const unlockedBadges = useMemo(() => {
    return ACHIEVEMENTS.filter((achievement) =>
      achievements.includes(achievement.id)
    );
  }, [achievements]);

  const lockedBadges = useMemo(() => {
    return ACHIEVEMENTS.filter(
      (achievement) => !achievements.includes(achievement.id)
    );
  }, [achievements]);

  if (loading || fetching) {
    return (
      <main className="min-h-screen bg-[#050505] px-4 py-8 text-white">
        <div className="mx-auto flex min-h-[70vh] max-w-6xl items-center justify-center">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-white/10 bg-white/5">
              <RefreshCw className="animate-spin text-red-500" size={30} />
            </div>

            <h1 className="mt-5 text-xl font-black">Loading achievements</h1>

            <p className="mt-2 text-sm text-white/50">
              Updating your creator progress...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#050505] px-4 py-4 text-white sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto max-w-7xl pb-28 md:pb-10">
        <Link
          href="/profile"
          className="mb-4 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-bold text-white/65 transition hover:border-red-500/30 hover:text-white"
        >
          <ArrowLeft size={16} />
          Back to Profile
        </Link>

        <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/10 via-white/[0.04] to-red-500/10 p-5 shadow-2xl shadow-black/30 sm:p-7 lg:p-9">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-red-500/20 blur-3xl" />

          <div className="relative">
            <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-red-300">
              <Trophy size={15} />
              Achievement Center
            </p>

            <h1 className="mt-3 text-3xl font-black sm:text-5xl">
              Creator Achievements
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/55">
              Track your badges, unlock creator milestones, and build trust with students on NotesWallah.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <SummaryCard icon={<Award size={22} />} label="Total Badges" value={totalCount} />
              <SummaryCard icon={<CheckCircle2 size={22} />} label="Unlocked" value={unlockedCount} />
              <SummaryCard icon={<Lock size={22} />} label="Locked" value={lockedCount} />
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20 sm:p-6">
            <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-red-300">
              <Sparkles size={15} />
              Unlocked Badges
            </p>

            <h2 className="mt-2 text-xl font-black">
              Your Earned Achievements
            </h2>

            <div className="mt-5">
              {unlockedBadges.length === 0 ? (
                <EmptyBox text="No badges unlocked yet. Upload approved notes to start earning achievements." />
              ) : (
                <div className="flex flex-wrap gap-3">
                  {unlockedBadges.map((achievement) => (
                    <AchievementBadge key={achievement.id} id={achievement.id} />
                  ))}
                </div>
              )}
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-white/40">
                Creator Progress
              </p>

              <p className="mt-1 text-3xl font-black text-white">
                {unlockedCount} / {totalCount}
              </p>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-red-500"
                  style={{ width: `${Math.round((unlockedCount / totalCount) * 100)}%` }}
                />
              </div>
            </div>

            <div className="mt-5 rounded-[2rem] border border-white/10 bg-black/25 p-5">
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-red-300">
                <Lock size={15} />
                Locked Badges
              </p>

              <div className="mt-4 space-y-3">
                {lockedBadges.length === 0 ? (
                  <EmptyBox text="You have unlocked every achievement. More badges can be added later." />
                ) : (
                  lockedBadges.map((achievement) => (
                    <div
                      key={achievement.id}
                      className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 opacity-75"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/5 text-lg grayscale">
                        {achievement.emoji}
                      </div>

                      <div className="min-w-0">
                        <h3 className="text-sm font-black text-white/80">
                          {achievement.title}
                        </h3>
                        <p className="line-clamp-1 text-xs text-white/40">
                          {achievement.description}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20 sm:p-6">
            <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-red-300">
              <Award size={15} />
              Badge Progress
            </p>

            <h2 className="mt-2 text-xl font-black">Next Milestones</h2>

            <p className="mt-1 text-sm text-white/45">
              Complete these goals to unlock more creator badges.
            </p>

            <div className="mt-5">
              <AchievementProgress
                unlockedAchievements={achievements}
                stats={achievementStats}
              />
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-black/25 p-4">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-500/10 text-red-300">
        {icon}
      </div>

      <p className="mt-4 text-xs font-bold uppercase tracking-wide text-white/40">
        {label}
      </p>

      <p className="mt-1 text-3xl font-black">{value}</p>
    </div>
  );
}

function EmptyBox({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-5 text-sm leading-6 text-white/45">
      {text}
    </div>
  );
}