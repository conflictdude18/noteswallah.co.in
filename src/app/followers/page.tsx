"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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
  RefreshCw,
  Search,
  Sparkles,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { db } from "@/firebase/firebase";
import { useAuth } from "@/contexts/AuthContext";

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
      } catch (err) {
        console.error("FOLLOWERS ERROR:", err);
        toast.error("Failed to load followers.");
      } finally {
        setFetching(false);
      }
    }

    fetchFollowers();
  }, [user]);

  const filteredFollowers = useMemo(() => {
    const term = search.toLowerCase().trim();

    return followers.filter((person) => {
      const displayName = getDisplayName(person);
      const value = `${displayName} ${person.email || ""} ${
        person.occupation || ""
      }`;

      return value.toLowerCase().includes(term);
    });
  }, [followers, search]);

  if (loading || fetching) {
    return (
      <main className="min-h-screen bg-[#050505] px-4 py-8 text-white">
        <div className="mx-auto flex min-h-[70vh] max-w-5xl items-center justify-center">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-white/10 bg-white/5">
              <RefreshCw className="animate-spin text-red-500" size={30} />
            </div>

            <h1 className="mt-5 text-xl font-black">Loading followers</h1>

            <p className="mt-2 text-sm text-white/50">
              Checking your student network...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050505] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/10 via-white/[0.04] to-red-500/10 p-5 shadow-2xl shadow-black/30 sm:p-7 lg:p-9">
          <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-red-500/20 blur-3xl" />

          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 text-xs font-black text-red-300">
                <Users size={16} />
                Student Network
              </div>

              <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-5xl">
                Followers
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/55 sm:text-base">
                Students who follow your profile and want updates from your
                notes, uploads and study material.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/25 p-4 text-center sm:min-w-36">
              <p className="text-3xl font-black">{followers.length}</p>
              <p className="mt-1 text-xs font-bold text-white/45">
                Total Followers
              </p>
            </div>
          </div>
        </section>

        {followers.length > 0 && (
          <section className="sticky top-0 z-30 -mx-4 mt-4 border-b border-white/10 bg-[#050505]/90 px-4 py-3 backdrop-blur-xl sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0">
            <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-3 sm:mt-5">
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-3.5">
                <Search size={18} className="shrink-0 text-white/40" />

                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search followers..."
                  className="w-full bg-transparent text-sm font-semibold text-white outline-none placeholder:text-white/35"
                />

                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="rounded-full bg-white/10 p-1 text-white/50"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>
            </div>
          </section>
        )}

        {followers.length === 0 ? (
          <EmptyState
            icon={<UserPlus size={38} />}
            title="No followers yet"
            text="Upload helpful notes and complete your profile so students can discover and follow you."
            href="/upload"
            buttonText="Upload Notes"
          />
        ) : filteredFollowers.length === 0 ? (
          <EmptyState
            icon={<Search size={36} />}
            title="No matching followers"
            text="Try searching with another name, email, or role."
          />
        ) : (
          <section className="mt-5 grid gap-4 pb-24 md:grid-cols-2 xl:grid-cols-3">
            {filteredFollowers.map((person) => {
              const displayName = getDisplayName(person);
              const photoURL = person.photoURL || person.avatarUrl || "";

              return (
                <Link
                  key={person.id}
                  href={`/profile/${person.id}`}
                  className="group overflow-hidden rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-black/20 transition hover:border-red-500/30 hover:bg-white/[0.06] sm:p-5"
                >
                  <div className="flex items-center gap-4">
                    {photoURL ? (
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                        <Image
                          src={photoURL}
                          alt={displayName}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-xl font-black text-red-300">
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <h2 className="truncate text-base font-black sm:text-lg">
                        {displayName}
                      </h2>

                      <p className="mt-1 truncate text-sm font-semibold text-white/45">
                        {person.occupation || "Student"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between gap-3 border-t border-white/10 pt-4">
                    <span className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs font-bold text-red-200">
                      <Users size={13} />
                      Follower
                    </span>

                    <span className="inline-flex items-center gap-1 text-xs font-black text-white/50 transition group-hover:text-red-300">
                      Profile
                      <ArrowRight size={15} />
                    </span>
                  </div>
                </Link>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}

function EmptyState({
  icon,
  title,
  text,
  href,
  buttonText,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  href?: string;
  buttonText?: string;
}) {
  return (
    <section className="mt-5 rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 text-center shadow-2xl shadow-black/20 sm:p-12">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.5rem] border border-red-500/20 bg-red-500/10 text-red-300">
        {icon}
      </div>

      <h2 className="mt-7 text-2xl font-black">{title}</h2>

      <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-white/55">
        {text}
      </p>

      {href && buttonText && (
        <Link
          href={href}
          className="mt-8 inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-black text-white transition hover:bg-red-500"
        >
          <Sparkles size={18} />
          {buttonText}
        </Link>
      )}
    </section>
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