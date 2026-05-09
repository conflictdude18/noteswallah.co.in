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
import { useParams } from "next/navigation";
import { UserRound } from "lucide-react";

import { db } from "@/firebase/firebase";
import LoadingSpinner from "@/components/LoadingSpinner";
import UserAvatar from "@/components/UserAvatar";

type UserProfile = {
  uid: string;
  displayName?: string;
  name?: string;
  occupation?: string;
  avatarUrl?: string;
  photoURL?: string;
};

export default function FollowersPage() {
  const { id } = useParams<{ id: string }>();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFollowers() {
      try {
        const q = query(
          collection(db, "follows"),
          where("followingId", "==", id)
        );

        const snap = await getDocs(q);
        const profiles: UserProfile[] = [];

        for (const followDoc of snap.docs) {
          const followerId = followDoc.data().followerId;
          const userSnap = await getDoc(doc(db, "users", followerId));

          if (userSnap.exists()) {
            profiles.push(userSnap.data() as UserProfile);
          }
        }

        setUsers(profiles);
      } catch (err) {
        console.error("FOLLOWERS ERROR:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchFollowers();
  }, [id]);

  if (loading) return <LoadingSpinner />;

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="container-max py-10">
        <h1 className="text-4xl font-black">Followers</h1>
        <p className="mt-2 text-white/50">
          People following this contributor.
        </p>

        {users.length === 0 ? (
          <div className="glass-card mt-10 p-10 text-center">
            <UserRound className="mx-auto text-white/30" size={52} />
            <p className="mt-4 text-white/60">No followers yet.</p>
          </div>
        ) : (
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {users.map((profile) => {
              const displayName =
                profile.displayName || profile.name || "NotesWallah User";

              const avatarUrl = profile.avatarUrl || profile.photoURL || "";

              return (
                <Link
                  key={profile.uid}
                  href={`/profile/${profile.uid}`}
                  className="glass-card flex items-center gap-4 p-5 transition hover:border-red-500/30"
                >
                  <UserAvatar name={displayName} src={avatarUrl} size="md" />

                  <div>
                    <h2 className="font-bold">{displayName}</h2>
                    <p className="text-sm text-white/50">
                      {profile.occupation || "Student"}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}