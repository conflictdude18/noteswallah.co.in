import { addDoc, collection, serverTimestamp } from "firebase/firestore";

import { db } from "@/firebase/firebase";

export type NotificationType =
  | "follow"
  | "upload"
  | "approved"
  | "rejected"
  | "admin";

type CreateNotificationInput = {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
};

export async function createNotification({
  userId,
  type,
  title,
  message,
  link = "/notifications",
}: CreateNotificationInput) {
  if (!userId) return;

  await addDoc(collection(db, "notifications"), {
    userId,
    type,
    title,
    message,
    link,
    read: false,
    createdAt: serverTimestamp(),
  });
}