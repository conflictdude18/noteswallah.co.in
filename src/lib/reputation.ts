import {
  addDoc,
  collection,
  doc,
  increment,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { db } from "@/firebase/firebase";

export type ReputationReason =
  | "note_uploaded"
  | "note_approved"
  | "download_milestone"
  | "like_milestone"
  | "featured_note"
  | "note_removed";

export const reputationPoints: Record<ReputationReason, number> = {
  note_uploaded: 10,
  note_approved: 25,
  download_milestone: 20,
  like_milestone: 10,
  featured_note: 100,
  note_removed: -50,
};

const reasonLabels: Record<ReputationReason, string> = {
  note_uploaded: "Uploaded a note",
  note_approved: "Note approved",
  download_milestone: "Download milestone reached",
  like_milestone: "Like milestone reached",
  featured_note: "Note featured",
  note_removed: "Note removed after report",
};

type AwardReputationParams = {
  userId: string;
  reason: ReputationReason;
  noteId?: string;
  noteTitle?: string;
};

export async function awardReputation({
  userId,
  reason,
  noteId = "",
  noteTitle = "",
}: AwardReputationParams) {
  if (!userId) return;

  const points = reputationPoints[reason];

  const userRef = doc(db, "users", userId);

  await updateDoc(userRef, {
    reputation: increment(points),
    monthlyReputation: increment(points),
    weeklyReputation: increment(points),
    updatedAt: serverTimestamp(),
  });

  await addDoc(collection(db, "reputationHistory"), {
    userId,
    reason,
    label: reasonLabels[reason],
    points,
    noteId,
    noteTitle,
    createdAt: serverTimestamp(),
  });
}