import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { db } from "@/firebase/firebase";
import { createNotification } from "@/lib/createNotification";

type SendFollowerUploadNotificationsInput = {
  uploaderId: string;
  uploaderName: string;
  noteId: string;
  noteTitle: string;
};

export async function sendFollowerUploadNotifications({
  uploaderId,
  uploaderName,
  noteId,
  noteTitle,
}: SendFollowerUploadNotificationsInput) {
  const followersQuery = query(
    collection(db, "follows"),
    where("followingId", "==", uploaderId)
  );

  const followersSnap = await getDocs(followersQuery);

  if (followersSnap.empty) return;

  await Promise.all(
    followersSnap.docs.map((followDoc) => {
      const data = followDoc.data();

      const followerId = data.followerId;

      if (!followerId || followerId === uploaderId) return Promise.resolve();

      return createNotification({
        userId: followerId,
        type: "upload",
        title: "New notes uploaded 📚",
        message: `${uploaderName} uploaded "${noteTitle}".`,
        link: `/notes/${noteId}`,
      });
    })
  );
}