import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "@/firebase/firebase";

export async function createUserProfile(
  user: {
    uid: string;
    email?: string | null;
    displayName?: string | null;
  }
) {
  const userRef = doc(db, "users", user.uid);

  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    await setDoc(userRef, {
      uid: user.uid,

      email: user.email || "",

      displayName:
        user.displayName ||
        `user_${user.uid.slice(0, 6)}`,

      bio: "",

      occupation: "Student",

      avatarUrl: "",

      joinedAt: serverTimestamp(),

      verified: false,
    });
  }
}