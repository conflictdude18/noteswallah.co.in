import { ACHIEVEMENTS } from "@/lib/achievements";

type AchievementStats = {
  approvedNotes?: number;
  totalDownloads?: number;
  totalViews?: number;
  totalLikes?: number;
};

type Props = {
  unlockedAchievements?: string[];
  stats?: AchievementStats;
};

function getProgress(id: string, stats: AchievementStats) {
  switch (id) {
    case "first_upload":
      return {
        current: stats.approvedNotes || 0,
        target: 1,
        label: "approved note",
      };

    case "approved_5":
      return {
        current: stats.approvedNotes || 0,
        target: 5,
        label: "approved notes",
      };

    case "approved_10":
      return {
        current: stats.approvedNotes || 0,
        target: 10,
        label: "approved notes",
      };

    case "downloads_100":
      return {
        current: stats.totalDownloads || 0,
        target: 100,
        label: "downloads",
      };

    case "views_500":
      return {
        current: stats.totalViews || 0,
        target: 500,
        label: "views",
      };

    case "likes_50":
      return {
        current: stats.totalLikes || 0,
        target: 50,
        label: "likes",
      };

    case "trusted_creator": {
      const completed =
        Number((stats.approvedNotes || 0) >= 10) +
        Number((stats.totalDownloads || 0) >= 100) +
        Number((stats.totalViews || 0) >= 500);

      return {
        current: completed,
        target: 3,
        label: "requirements",
      };
    }

    default:
      return {
        current: 0,
        target: 1,
        label: "progress",
      };
  }
}

export default function AchievementProgress({
  unlockedAchievements = [],
  stats = {},
}: Props) {
  return (
    <div className="space-y-3">
      {ACHIEVEMENTS.map((achievement) => {
        const unlocked = unlockedAchievements.includes(achievement.id);
        const progress = getProgress(achievement.id, stats);
        const safeCurrent = Math.min(progress.current, progress.target);
        const percent = Math.min(
          100,
          Math.round((safeCurrent / progress.target) * 100)
        );

        return (
          <div
            key={achievement.id}
            className="rounded-2xl border border-white/10 bg-black/25 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-500/10 text-xl">
                  {achievement.emoji}
                </div>

                <div className="min-w-0">
                  <h3 className="text-sm font-black text-white">
                    {achievement.title}
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-white/45">
                    {achievement.description}
                  </p>
                </div>
              </div>

              <span
                className={
                  unlocked
                    ? "shrink-0 rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-[10px] font-black text-green-300"
                    : "shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-black text-white/45"
                }
              >
                {unlocked ? "Unlocked" : "Locked"}
              </span>
            </div>

            {unlocked ? (
              <div className="mt-4 rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-xs font-bold text-green-300">
                ✅ Unlocked Achievement
              </div>
            ) : (
              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between text-xs font-bold text-white/45">
                  <span>
                    {safeCurrent} / {progress.target} {progress.label}
                  </span>
                  <span>{percent}%</span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-red-500"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}