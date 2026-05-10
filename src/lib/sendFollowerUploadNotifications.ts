import { collection, getDocs, query, where } from "firebase/firestore";

import { db } from "@/firebase/firebase";
import { sendNotification } from "@/lib/sendNotification";

interface SendFollowerUploadNotificationsProps {
  uploaderId: string;
  uploaderName: string;
  noteId: string;
  noteTitle: string;
}

export async function sendFollowerUploadNotifications({
  uploaderId,
  uploaderName,
  noteId,
  noteTitle,
}: SendFollowerUploadNotificationsProps) {
  if (!uploaderId || !noteId) return;

  try {
    const followersQuery = query(
      collection(db, "follows"),
      where("followingId", "==", uploaderId)
    );

    const followersSnap = await getDocs(followersQuery);

    await Promise.all(
      followersSnap.docs.map((followDoc) => {
        const followData = followDoc.data();

        return sendNotification({
          userId: followData.followerId,
          title: "New Note Uploaded 📚",
          message: `${uploaderName || "Someone you follow"} uploaded "${noteTitle}".`,
          type: "system",
          noteId,
        });
      })
    );
  } catch (error) {
    console.error("FOLLOWER UPLOAD NOTIFICATION ERROR:", error);
  }
}