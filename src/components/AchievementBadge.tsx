import { getAchievementById } from "@/lib/achievements";

export default function AchievementBadge({ id }: { id: string }) {
  const achievement = getAchievementById(id);

  if (!achievement) return null;

  return (
    <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white">
      <span>{achievement.emoji}</span>
      <span>{achievement.title}</span>
    </div>
  );
}