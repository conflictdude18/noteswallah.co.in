import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  updateDoc,
  query,
  where,
} from "firebase/firestore";

import { db } from "@/firebase/firebase";
import type { AchievementId } from "@/lib/achievements";

type UserAchievementStats = {
  approvedNotes: number;
  totalDownloads: number;
  totalViews: number;
  totalLikes: number;
};

function getUnlockedAchievements(stats: UserAchievementStats): AchievementId[] {
  const unlocked: AchievementId[] = [];

  if (stats.approvedNotes >= 1) unlocked.push("first_upload");
  if (stats.approvedNotes >= 5) unlocked.push("approved_5");
  if (stats.approvedNotes >= 10) unlocked.push("approved_10");
  if (stats.totalDownloads >= 100) unlocked.push("downloads_100");
  if (stats.totalViews >= 500) unlocked.push("views_500");
  if (stats.totalLikes >= 50) unlocked.push("likes_50");

  if (
    stats.approvedNotes >= 10 &&
    stats.totalDownloads >= 100 &&
    stats.totalViews >= 500
  ) {
    unlocked.push("trusted_creator");
  }

  return unlocked;
}

export async function updateUserAchievements(userId: string) {
  if (!userId) return;

  const notesQuery = query(
    collection(db, "notes"),
    where("uploaderId", "==", userId),
    where("status", "==", "approved")
  );

  const snapshot = await getDocs(notesQuery);

  let totalDownloads = 0;
  let totalViews = 0;
  let totalLikes = 0;

  snapshot.forEach((noteDoc) => {
    const data = noteDoc.data();

    totalDownloads += Number(data.downloads || 0);
    totalViews += Number(data.views || 0);
    totalLikes += Number(data.likes || 0);
  });

  const stats: UserAchievementStats = {
    approvedNotes: snapshot.size,
    totalDownloads,
    totalViews,
    totalLikes,
  };

  const achievements = getUnlockedAchievements(stats);

  await updateDoc(doc(db, "users", userId), {
    achievements,
    achievementStats: stats,
    achievementsUpdatedAt: serverTimestamp(),
  });
}