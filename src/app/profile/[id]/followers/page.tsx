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
import { ArrowLeft, RefreshCw, UserRound, Users } from "lucide-react";
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
      if (!id) return;

      try {
        setLoading(true);

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
                followerAvatar: userData.avatarUrl || userData.photoURL || "",
              };
            }

            return {
              id: followDoc.id,
              followerId,
              followerName: followData.followerName || "NotesWallah User",
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
      <main className="min-h-screen bg-[#050505] px-4 py-8 text-white">
        <div className="mx-auto flex min-h-[70vh] max-w-5xl items-center justify-center">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-white/10 bg-white/5">
              <RefreshCw className="animate-spin text-red-500" size={30} />
            </div>

            <h1 className="mt-5 text-xl font-black">Loading followers</h1>

            <p className="mt-2 text-sm text-white/50">
              Fetching this contributor’s network...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#050505] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl pb-28 md:pb-10">
        <button
          onClick={() => router.back()}
          className="mb-5 inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-bold text-white/60 transition hover:text-white"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/10 via-white/[0.04] to-red-500/10 p-5 shadow-2xl shadow-black/30 sm:p-7">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-red-500/20 blur-3xl" />

          <div className="relative flex items-center gap-4">
            <div className="rounded-3xl bg-red-500/10 p-3 text-red-500 ring-1 ring-red-500/20">
              <Users size={26} />
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-red-300">
                Student Network
              </p>
              <h1 className="mt-1 text-3xl font-black">Followers</h1>
              <p className="mt-1 text-sm text-white/50">
                {followers.length} people follow this contributor.
              </p>
            </div>
          </div>
        </section>

        {followers.length === 0 ? (
          <section className="mt-5 rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 text-center shadow-2xl shadow-black/20 sm:p-12">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.5rem] border border-red-500/20 bg-red-500/10 text-red-300">
              <UserRound size={38} />
            </div>

            <h2 className="mt-7 text-2xl font-black">No followers yet</h2>

            <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-white/55">
              When students follow this contributor, they will appear here.
            </p>
          </section>
        ) : (
          <section className="mt-5 grid gap-4 md:grid-cols-2">
            {followers.map((follower) => (
              <Link
                key={follower.id}
                href={`/profile/${follower.followerId}`}
                className="group flex items-center gap-4 rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-black/20 transition hover:border-red-500/30 hover:bg-white/[0.06] sm:p-5"
              >
                <UserAvatar
                  name={follower.followerName}
                  src={follower.followerAvatar || ""}
                  size="md"
                />

                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-base font-black sm:text-lg">
                    {follower.followerName}
                  </h2>
                  <p className="mt-1 text-sm font-semibold text-white/45">
                    View profile
                  </p>
                </div>
              </Link>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}