"use client";

import type React from "react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowRight,
  Mail,
  RefreshCw,
  Settings,
  ShieldCheck,
  UserPlus,
  UserRound,
  Users,
} from "lucide-react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { db } from "@/firebase/firebase";
import { useAuth } from "@/contexts/AuthContext";
import UserAvatar from "@/components/UserAvatar";

type UserProfile = {
  uid?: string;
  displayName?: string;
  name?: string;
  bio?: string;
  occupation?: string;
  avatarUrl?: string;
  photoURL?: string;
  profileImage?: string;
  profileImageUrl?: string;
  imageUrl?: string;
  verified?: boolean;
  role?: string;
};

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
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
          setProfile(snap.data() as UserProfile);
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
    return (
      <main className="min-h-screen bg-[#050505] px-4 py-8 text-white">
        <div className="mx-auto flex min-h-[70vh] max-w-6xl items-center justify-center">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-white/10 bg-white/5">
              <RefreshCw className="animate-spin text-red-500" size={30} />
            </div>

            <h1 className="mt-5 text-xl font-black">Loading profile</h1>

            <p className="mt-2 text-sm text-white/50">
              Fetching your profile and network details...
            </p>
          </div>
        </div>
      </main>
    );
  }

  const displayName =
    profile?.displayName || profile?.name || user?.displayName || "User";

  const avatarUrl =
    profile?.avatarUrl ||
    profile?.photoURL ||
    profile?.profileImage ||
    profile?.profileImageUrl ||
    profile?.imageUrl ||
    "";

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#050505] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl pb-28 md:pb-10">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/10 via-white/[0.04] to-red-500/10 p-5 shadow-2xl shadow-black/30 sm:p-7 lg:p-9">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-red-500/20 blur-3xl" />

          <div className="relative">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 items-center gap-4 sm:gap-5">
                <UserAvatar name={displayName} src={avatarUrl} size="lg" />

                <div className="min-w-0">
                  <h1 className="line-clamp-1 text-3xl font-black sm:text-5xl">
                    {displayName}
                  </h1>

                  <p className="mt-1 truncate text-sm font-semibold text-white/50 sm:text-base">
                    {profile?.occupation || "Student"}
                  </p>

                  <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-xs font-black text-green-300">
                    <Activity size={13} />
                    Active Profile
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:flex">
                <Link
                  href="/settings/profile"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 py-3 text-sm font-black text-white transition hover:bg-red-500"
                >
                  <Settings size={17} />
                  Edit
                </Link>

                <Link
                  href={`/profile/${user?.uid}`}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-black text-white/80 transition hover:bg-white/[0.08]"
                >
                  <UserRound size={17} />
                  Public
                </Link>
              </div>
            </div>

            <p className="mt-5 rounded-[1.5rem] border border-white/10 bg-black/25 p-4 text-sm leading-7 text-white/65 lg:max-w-3xl">
              {profile?.bio || "You have not added a bio yet."}
            </p>
          </div>
        </section>

        <section className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-2 lg:grid-cols-5">
          <ProfileCard
            href={`/profile/${user?.uid}/followers`}
            icon={<Users size={22} />}
            label="Followers"
            value={followersCount}
          />

          <ProfileCard
            href={`/profile/${user?.uid}/following`}
            icon={<UserPlus size={22} />}
            label="Following"
            value={followingCount}
          />

          <InfoCard
            icon={<ShieldCheck size={22} />}
            label="Account"
            value={profile?.role === "admin" ? "Admin" : "User"}
          />

          <InfoCard
            icon={<Activity size={22} />}
            label="Status"
            value="Active"
            green
          />

          <div className="col-span-2 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-black/20 lg:col-span-1">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-500/10 text-red-300">
                <Mail size={22} />
              </div>

              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wide text-white/40">
                  Email
                </p>

                <p className="mt-1 truncate text-sm font-bold text-white/80">
                  {user?.email || "No email"}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-5 rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20 sm:p-6">
          <h2 className="text-xl font-black">Quick Actions</h2>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <QuickAction href="/my-notes" label="My Notes" />
            <QuickAction href="/saved-notes" label="Saved Notes" />
            <QuickAction href="/upload" label="Upload Notes" />
          </div>
        </section>
      </div>
    </main>
  );
}

function ProfileCard({
  href,
  icon,
  label,
  value,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <Link
      href={href}
      className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-black/20 transition hover:border-red-500/30 hover:bg-white/[0.06]"
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-500/10 text-red-300">
        {icon}
      </div>

      <p className="mt-4 text-xs font-bold uppercase tracking-wide text-white/40">
        {label}
      </p>

      <p className="mt-1 text-3xl font-black">{value}</p>
    </Link>
  );
}

function InfoCard({
  icon,
  label,
  value,
  green = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  green?: boolean;
}) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-black/20">
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
          green
            ? "bg-green-500/10 text-green-300"
            : "bg-red-500/10 text-red-300"
        }`}
      >
        {icon}
      </div>

      <p className="mt-4 text-xs font-bold uppercase tracking-wide text-white/40">
        {label}
      </p>

      <p
        className={`mt-1 text-2xl font-black ${
          green ? "text-green-300" : "text-white"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function QuickAction({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/25 px-4 py-4 text-sm font-black text-white/75 transition hover:border-red-500/30 hover:text-white"
    >
      {label}
      <ArrowRight size={17} />
    </Link>
  );
}