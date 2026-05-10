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
import { ArrowLeft, Users } from "lucide-react";
import { useParams, useRouter } from "next/navigation";

import { db } from "@/firebase/firebase";
import UserAvatar from "@/components/UserAvatar";

type FollowUser = {
  id: string;
  followerId: string;
  followerName: string;
  followerAvatar?: string;
};

export default function FollowersPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [followers, setFollowers] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFollowers() {
      try {
        const q = query(
          collection(db, "follows"),
          where("followingId", "==", id)
        );

        const snap = await getDocs(q);

        const data: FollowUser[] = await Promise.all(
          snap.docs.map(async (followDoc) => {
            const followData = followDoc.data();
            const followerId = followData.followerId;

            const userSnap = await getDoc(doc(db, "users", followerId));

            if (userSnap.exists()) {
              const userData = userSnap.data();

              return {
                id: followDoc.id,
                followerId,
                followerName:
                  userData.displayName ||
                  userData.name ||
                  followData.followerName ||
                  "NotesWallah User",
                followerAvatar:
                  userData.avatarUrl ||
                  userData.photoURL ||
                  "",
              };
            }

            return {
              id: followDoc.id,
              followerId,
              followerName:
                followData.followerName || "NotesWallah User",
              followerAvatar: "",
            };
          })
        );

        setFollowers(data);
      } catch (err) {
        console.error("FOLLOWERS ERROR:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchFollowers();
  }, [id]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        Loading followers...
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
            <Users size={24} />
          </div>

          <div>
            <h1 className="text-3xl font-black">Followers</h1>
            <p className="text-sm text-white/50">
              People following this contributor.
            </p>
          </div>
        </div>

        {followers.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center text-white/50">
            No followers yet.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {followers.map((follower) => (
              <Link
                key={follower.id}
                href={`/profile/${follower.followerId}`}
                className="flex items-center gap-4 rounded-3xl border border-white/10 bg-white/5 p-5 transition hover:border-red-500/30 hover:bg-white/10"
              >
                <UserAvatar
                  name={follower.followerName}
                  src={follower.followerAvatar || ""}
                  size="md"
                />

                <div>
                  <h2 className="font-bold">{follower.followerName}</h2>
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