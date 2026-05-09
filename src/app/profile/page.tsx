"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { Settings, UserRound } from "lucide-react";

import { db } from "@/firebase/firebase";
import { useAuth } from "@/contexts/AuthContext";
import LoadingSpinner from "@/components/LoadingSpinner";

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

  useEffect(() => {
    if (!loading && !user) {
      router.push("/signin");
    }
  }, [user, loading, router]);

  useEffect(() => {
    async function fetchProfile() {
      if (!user) return;

      const snap = await getDoc(doc(db, "users", user.uid));

      if (snap.exists()) {
        setProfile(snap.data() as UserDoc);
      }

      setFetching(false);
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
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl bg-red-600 text-4xl font-black">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  displayName.charAt(0).toUpperCase()
                )}
              </div>

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

              <Link
                href={`/profile/${user?.uid}`}
                className="btn-secondary gap-2"
              >
                <UserRound size={18} />
                Public Profile
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          <div className="glass-card p-6">
            <p className="text-sm text-white/50">Account Type</p>
            <p className="mt-2 text-2xl font-black">
              {profile?.role === "admin" ? "Admin" : "User"}
            </p>
          </div>

          <div className="glass-card p-6">
            <p className="text-sm text-white/50">Email</p>
            <p className="mt-2 break-all text-white/80">{user?.email}</p>
          </div>

          <div className="glass-card p-6">
            <p className="text-sm text-white/50">Profile Status</p>
            <p className="mt-2 text-2xl font-black text-green-400">Active</p>
          </div>
        </div>
      </div>
    </main>
  );
}