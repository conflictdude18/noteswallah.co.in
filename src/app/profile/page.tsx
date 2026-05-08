"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/firebase/firebase";
import { doc, getDoc } from "firebase/firestore";

type UserDoc = {
  name: string;
  email: string;
  role: string;
  photoURL?: string;
};

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [userDoc, setUserDoc] = useState<UserDoc | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/signin");
    }
  }, [user, loading, router]);

  useEffect(() => {
    async function fetchProfile() {
      if (!user) return;

      setFetching(true);

      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) {
        setUserDoc(snap.data() as UserDoc);
      }

      setFetching(false);
    }

    if (user) fetchProfile();
  }, [user]);

  if (loading || fetching) {
    return <p className="p-10">Loading profile...</p>;
  }

  return (
    <div className="container-max py-10">
      <h1 className="text-3xl font-bold">Profile</h1>
      <p className="mt-2 text-white/70">Your account details.</p>

      <div className="mt-8 glass-card p-8 max-w-xl">
        <div className="flex items-center gap-4">
          {userDoc?.photoURL ? (
            <img
              src={userDoc.photoURL}
              alt="profile"
              className="w-16 h-16 rounded-full border border-white/10"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-white/70">
              👤
            </div>
          )}

          <div>
            <p className="text-lg font-semibold">
              {userDoc?.name || "Anonymous"}
            </p>
            <p className="text-sm text-white/60">{userDoc?.email}</p>
          </div>
        </div>

        <div className="mt-6 space-y-2 text-sm text-white/70">
          <p>
            <span className="text-white/90 font-medium">Role:</span>{" "}
            {userDoc?.role || "user"}
          </p>
          <p>
            <span className="text-white/90 font-medium">UID:</span>{" "}
            {user?.uid}
          </p>
        </div>

        <div className="mt-8">
          <button
            onClick={() => router.push("/my-notes")}
            className="btn-primary w-full"
          >
            View My Notes
          </button>
        </div>
      </div>
    </div>
  );
}