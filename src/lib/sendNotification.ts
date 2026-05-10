import { addDoc, collection } from "firebase/firestore";

import { db } from "@/firebase/firebase";

interface SendNotificationProps {
  userId: string;
  title: string;
  message: string;
  type: "like" | "comment" | "bookmark" | "system";
  noteId?: string;
}

export async function sendNotification({
  userId,
  title,
  message,
  type,
  noteId,
}: SendNotificationProps) {
  if (!userId) return;

  try {
    await addDoc(collection(db, "notifications"), {
      userId,
      title,
      message,
      type,
      noteId: noteId || null,
      read: false,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("NOTIFICATION ERROR:", error);
  }
}