"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { ArrowLeft, UserRoundCheck } from "lucide-react";
import { useParams, useRouter } from "next/navigation";

import { db } from "@/firebase/firebase";
import UserAvatar from "@/components/UserAvatar";

type FollowingUser = {
  id: string;
  followingId: string;
  followingName: string;
  followingAvatar?: string;
};

export default function FollowingPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [following, setFollowing] = useState<FollowingUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFollowing() {
      try {
        const q = query(
          collection(db, "follows"),
          where("followerId", "==", id)
        );

        const snap = await getDocs(q);

        const data: FollowingUser[] = await Promise.all(
          snap.docs.map(async (followDoc) => {
            const followData = followDoc.data();
            const followingId = followData.followingId;

            const userSnap = await getDoc(doc(db, "users", followingId));

            if (userSnap.exists()) {
              const userData = userSnap.data();

              return {
                id: followDoc.id,
                followingId,
                followingName:
                  userData.displayName ||
                  userData.name ||
                  followData.followingName ||
                  "NotesWallah User",
                followingAvatar:
                  userData.avatarUrl ||
                  userData.photoURL ||
                  "",
              };
            }

            return {
              id: followDoc.id,
              followingId,
              followingName:
                followData.followingName || "NotesWallah User",
              followingAvatar: "",
            };
          })
        );

        setFollowing(data);
      } catch (err) {
        console.error("FOLLOWING ERROR:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchFollowing();
  }, [id]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        Loading following...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="container-max py-10">
        <button
          onClick={() => router.back()}
          className="mb-8 flex items-center gap-2 text-sm text-white/60 transition hover:text-white"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <div className="mb-8 flex items-center gap-3">
          <div className="rounded-2xl bg-red-500/10 p-3 text-red-500">
            <UserRoundCheck size={24} />
          </div>

          <div>
            <h1 className="text-3xl font-black">Following</h1>
            <p className="text-sm text-white/50">
              Contributors this user follows.
            </p>
          </div>
        </div>

        {following.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center text-white/50">
            Not following anyone yet.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {following.map((item) => (
              <Link
                key={item.id}
                href={`/profile/${item.followingId}`}
                className="flex items-center gap-4 rounded-3xl border border-white/10 bg-white/5 p-5 transition hover:border-red-500/30 hover:bg-white/10"
              >
                <UserAvatar
                  name={item.followingName}
                  src={item.followingAvatar || ""}
                  size="md"
                />

                <div>
                  <h2 className="font-bold">{item.followingName}</h2>
                  <p className="text-sm text-white/50">View profile</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}