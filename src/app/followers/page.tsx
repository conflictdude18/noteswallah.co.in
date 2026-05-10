"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  documentId,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import {
  ArrowRight,
  Search,
  Sparkles,
  UserPlus,
  Users,
} from "lucide-react";

import { db } from "@/firebase/firebase";
import { useAuth } from "@/contexts/AuthContext";
import LoadingSpinner from "@/components/LoadingSpinner";

type FollowDoc = {
  id: string;
  followerId: string;
  followingId: string;
};

type UserDoc = {
  id: string;
  name?: string;
  displayName?: string;
  email?: string;
  photoURL?: string;
  avatarUrl?: string;
  occupation?: string;
};

export default function FollowersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [followers, setFollowers] = useState<UserDoc[]>([]);
  const [fetching, setFetching] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/signin");
    }
  }, [user, loading, router]);

  useEffect(() => {
    async function fetchFollowers() {
      if (!user) return;

      setFetching(true);

      try {
        const followsQuery = query(
          collection(db, "follows"),
          where("followingId", "==", user.uid)
        );

        const followsSnap = await getDocs(followsQuery);

        const followsData: FollowDoc[] = followsSnap.docs.map((document) => ({
          id: document.id,
          ...(document.data() as Omit<FollowDoc, "id">),
        }));

        const followerIds = followsData.map((follow) => follow.followerId);

        if (followerIds.length === 0) {
          setFollowers([]);
          return;
        }

        const followerChunks = chunkArray(followerIds, 10);
        const allFollowers: UserDoc[] = [];

        for (const chunk of followerChunks) {
          const usersQuery = query(
            collection(db, "users"),
            where(documentId(), "in", chunk)
          );

          const usersSnap = await getDocs(usersQuery);

          const usersData: UserDoc[] = usersSnap.docs.map((document) => ({
            id: document.id,
            ...(document.data() as Omit<UserDoc, "id">),
          }));

          allFollowers.push(...usersData);
        }

        setFollowers(allFollowers);
      } catch (err: unknown) {
        console.error("FOLLOWERS ERROR:", err);
      } finally {
        setFetching(false);
      }
    }

    fetchFollowers();
  }, [user]);

  const filteredFollowers = followers.filter((person) => {
    const displayName = getDisplayName(person);
    const value = `${displayName} ${person.email || ""} ${
      person.occupation || ""
    }`;

    return value.toLowerCase().includes(search.toLowerCase());
  });

  if (loading || fetching) {
    return <LoadingSpinner />;
  }

  return (
    <main className="space-y-8 pb-24 md:pb-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#07090d] p-6 shadow-card md:p-10">
        <div className="absolute right-[-90px] top-[-90px] h-[280px] w-[280px] rounded-full bg-red-500/20 blur-[120px]" />
        <div className="absolute bottom-[-130px] left-[-130px] h-[280px] w-[280px] rounded-full bg-red-700/10 blur-[120px]" />

        <div className="relative z-10 flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-bold text-red-300">
              <Users size={16} />
              Student Network
            </div>

            <h1 className="mt-6 text-4xl font-black tracking-tight text-white md:text-6xl">
              Followers
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/60 md:text-base">
              Students who follow your NotesWallah profile and want to stay
              connected with your notes, uploads and study material.
            </p>
          </div>

          <div className="glass-card rounded-[1.5rem] p-5">
            <p className="text-sm font-semibold text-white/50">
              Followers
            </p>

            <h2 className="mt-2 text-4xl font-black text-white">
              {followers.length}
            </h2>
          </div>
        </div>
      </section>

      {followers.length > 0 && (
        <section className="glass-card rounded-[2rem] p-4 md:p-5">
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <Search size={18} className="text-white/40" />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search followers by name, email, or role..."
              className="w-full bg-transparent text-sm font-semibold text-white outline-none placeholder:text-white/35"
            />
          </div>
        </section>
      )}

      {followers.length === 0 ? (
        <section className="glass-card rounded-[2rem] p-8 text-center md:p-12">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.5rem] border border-red-500/20 bg-red-500/10 text-red-300">
            <UserPlus size={38} />
          </div>

          <h2 className="mt-7 text-2xl font-black text-white">
            No Followers Yet
          </h2>

          <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-white/55 md:text-base">
            Upload helpful notes and complete your profile so students can
            discover and follow you.
          </p>

          <Link href="/upload" className="btn-primary mt-8">
            <Sparkles size={18} />
            Upload Notes
          </Link>
        </section>
      ) : filteredFollowers.length === 0 ? (
        <section className="glass-card rounded-[2rem] p-8 text-center md:p-12">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.5rem] border border-white/10 bg-white/5 text-white/60">
            <Search size={36} />
          </div>

          <h2 className="mt-7 text-2xl font-black text-white">
            No Matching Followers
          </h2>

          <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-white/55 md:text-base">
            Try searching with another name, email, or role.
          </p>
        </section>
      ) : (
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredFollowers.map((person) => {
            const displayName = getDisplayName(person);
            const photoURL = person.photoURL || person.avatarUrl || "";

            return (
              <Link
                key={person.id}
                href={`/profile/${person.id}`}
                className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.035] p-6 shadow-card backdrop-blur-xl transition hover:-translate-y-1 hover:border-red-500/30 hover:bg-white/[0.055]"
              >
                <div className="absolute right-[-80px] top-[-80px] h-44 w-44 rounded-full bg-red-500/10 blur-[90px] transition group-hover:bg-red-500/20" />

                <div className="relative z-10">
                  <div className="flex items-center gap-4">
                    {photoURL ? (
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[1.35rem] border border-white/10 bg-white/5">
                        <Image
                          src={photoURL}
                          alt={displayName}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.35rem] border border-red-500/20 bg-red-500/10 text-xl font-black text-red-300">
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <h2 className="truncate text-lg font-black text-white">
                        {displayName}
                      </h2>

                      <p className="mt-1 truncate text-sm font-semibold text-white/45">
                        {person.occupation || "Student"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-5">
                    <div className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs font-bold text-red-200">
                      <Users size={13} />
                      Follower
                    </div>

                    <div className="inline-flex items-center gap-2 text-sm font-black text-white/50 transition group-hover:text-red-300">
                      View Profile
                      <ArrowRight size={16} />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </section>
      )}
    </main>
  );
}

function getDisplayName(person: UserDoc) {
  return person.displayName || person.name || "NotesWallah User";
}

function chunkArray<T>(items: T[], size: number) {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}