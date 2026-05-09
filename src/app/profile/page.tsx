"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import {
  Settings,
  UserRound,
  Users,
  UserPlus,
  ShieldCheck,
  Mail,
  Activity,
} from "lucide-react";

import { db } from "@/firebase/firebase";
import { useAuth } from "@/contexts/AuthContext";
import LoadingSpinner from "@/components/LoadingSpinner";
import UserAvatar from "@/components/UserAvatar";

type UserDoc = {
  displayName?: string;
  name?: string;
  email?: string;
  bio?: string;
  occupation?: string;
  avatarUrl?: string;
  photoURL?: string;
  role?: string;
};

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<UserDoc | null>(null);
  const [fetching, setFetching] = useState(true);

  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/signin");
    }
  }, [user, loading, router]);

  useEffect(() => {
    async function fetchProfile() {
      if (!user) return;

      try {
        const snap = await getDoc(doc(db, "users", user.uid));

        if (snap.exists()) {
          setProfile(snap.data() as UserDoc);
        }

        const followersQuery = query(
          collection(db, "follows"),
          where("followingId", "==", user.uid)
        );

        const followingQuery = query(
          collection(db, "follows"),
          where("followerId", "==", user.uid)
        );

        const followersSnap = await getDocs(followersQuery);
        const followingSnap = await getDocs(followingQuery);

        setFollowersCount(followersSnap.docs.length);
        setFollowingCount(followingSnap.docs.length);
      } catch (err) {
        console.error("PROFILE FETCH ERROR:", err);
      } finally {
        setFetching(false);
      }
    }

    if (user) fetchProfile();
  }, [user]);

  if (loading || fetching) {
    return <LoadingSpinner />;
  }

  const displayName =
    profile?.displayName || profile?.name || user?.displayName || "User";

  const avatarUrl = profile?.avatarUrl || profile?.photoURL || "";

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="container-max py-10">
        <div className="glass-card p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-5">
              <UserAvatar name={displayName} src={avatarUrl} size="lg" />

              <div>
                <h1 className="text-4xl font-black">{displayName}</h1>

                <p className="mt-2 text-white/50">
                  {profile?.occupation || "Student"}
                </p>

                <p className="mt-3 max-w-xl text-white/65">
                  {profile?.bio || "You have not added a bio yet."}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/settings/profile" className="btn-primary gap-2">
                <Settings size={18} />
                Edit Profile
              </Link>

              <Link href={`/profile/${user?.uid}`} className="btn-secondary gap-2">
                <UserRound size={18} />
                Public Profile
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-5">
          <Link
            href={`/profile/${user?.uid}/followers`}
            className="glass-card p-6 transition hover:border-red-500/30"
          >
            <div className="flex items-center gap-3">
              <Users className="text-red-500" size={22} />
              <div>
                <p className="text-sm text-white/50">Followers</p>
                <p className="mt-1 text-2xl font-black">{followersCount}</p>
              </div>
            </div>
          </Link>

          <Link
            href={`/profile/${user?.uid}/following`}
            className="glass-card p-6 transition hover:border-red-500/30"
          >
            <div className="flex items-center gap-3">
              <UserPlus className="text-red-500" size={22} />
              <div>
                <p className="text-sm text-white/50">Following</p>
                <p className="mt-1 text-2xl font-black">{followingCount}</p>
              </div>
            </div>
          </Link>

          <div className="glass-card p-6">
            <div className="flex items-center gap-3">
              <ShieldCheck className="text-red-500" size={22} />
              <div>
                <p className="text-sm text-white/50">Account Type</p>
                <p className="mt-1 text-2xl font-black">
                  {profile?.role === "admin" ? "Admin" : "User"}
                </p>
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center gap-3">
              <Mail className="text-red-500" size={22} />
              <div>
                <p className="text-sm text-white/50">Email</p>
                <p className="mt-1 break-all text-sm text-white/80">
                  {user?.email}
                </p>
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center gap-3">
              <Activity className="text-green-400" size={22} />
              <div>
                <p className="text-sm text-white/50">Profile Status</p>
                <p className="mt-1 text-2xl font-black text-green-400">
                  Active
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}