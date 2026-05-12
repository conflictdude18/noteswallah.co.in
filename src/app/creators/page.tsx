"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import {
  BadgeCheck,
  Download,
  FileText,
  RefreshCw,
  Search,
  Users,
  X,
} from "lucide-react";

import { db } from "@/firebase/firebase";
import UserAvatar from "@/components/UserAvatar";

type Creator = {
  uid: string;
  displayName: string;
  avatarUrl?: string;
  occupation?: string;
  verified?: boolean;
  followersCount: number;
  notesCount: number;
  downloadsCount: number;
};

export default function CreatorsPage() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [filteredCreators, setFilteredCreators] = useState<Creator[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCreators() {
      try {
        const usersSnap = await getDocs(collection(db, "users"));

        const data: Creator[] = await Promise.all(
          usersSnap.docs.map(async (userDoc) => {
            const userData = userDoc.data();

            const notesQuery = query(
              collection(db, "notes"),
              where("uploaderId", "==", userDoc.id),
              where("status", "==", "approved")
            );

            const notesSnap = await getDocs(notesQuery);

            const downloadsCount = notesSnap.docs.reduce((sum, noteDoc) => {
              const noteData = noteDoc.data();
              return sum + Number(noteData.downloadsCount || 0);
            }, 0);

            const followersQuery = query(
              collection(db, "follows"),
              where("followingId", "==", userDoc.id)
            );

            const followersSnap = await getDocs(followersQuery);

            return {
              uid: userDoc.id,
              displayName:
                userData.displayName || userData.name || "NotesWallah User",
              avatarUrl: userData.avatarUrl || userData.photoURL || "",
              occupation: userData.occupation || "Student",
              verified: Boolean(userData.verified),
              followersCount: followersSnap.size,
              notesCount: notesSnap.size,
              downloadsCount,
            };
          })
        );

        const sorted = data
          .filter(
            (creator) => creator.notesCount > 0 || creator.followersCount > 0
          )
          .sort((a, b) => {
            const scoreA =
              a.followersCount * 5 + a.notesCount * 3 + a.downloadsCount;

            const scoreB =
              b.followersCount * 5 + b.notesCount * 3 + b.downloadsCount;

            return scoreB - scoreA;
          });

        setCreators(sorted);
        setFilteredCreators(sorted);
      } catch (err) {
        console.error("CREATORS ERROR:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchCreators();
  }, []);

  useEffect(() => {
    const term = search.toLowerCase().trim();

    if (!term) {
      setFilteredCreators(creators);
      return;
    }

    setFilteredCreators(
      creators.filter(
        (creator) =>
          creator.displayName.toLowerCase().includes(term) ||
          creator.occupation?.toLowerCase().includes(term)
      )
    );
  }, [search, creators]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#050505] px-4 py-8 text-white">
        <div className="mx-auto flex min-h-[70vh] max-w-7xl items-center justify-center">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-white/10 bg-white/5">
              <RefreshCw className="animate-spin text-red-500" size={30} />
            </div>

            <h1 className="mt-5 text-xl font-black">Loading creators</h1>

            <p className="mt-2 text-sm text-white/50">
              Finding top NotesWallah contributors...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#050505] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl pb-28 md:pb-10">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/10 via-white/[0.04] to-red-500/10 p-5 shadow-2xl shadow-black/30 sm:p-7 lg:p-9">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-red-500/20 blur-3xl" />

          <div className="relative flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="inline-flex rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 text-xs font-black text-red-300">
                Creator Discovery
              </div>

              <h1 className="mt-5 text-3xl font-black sm:text-5xl">
                Top Contributors
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/55 sm:text-base">
                Discover students and contributors sharing useful study notes.
              </p>
            </div>

            <div className="relative w-full md:w-80">
              <Search
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/40"
              />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search creators..."
                className="w-full rounded-2xl border border-white/10 bg-black/30 py-3.5 pl-11 pr-11 text-sm font-semibold text-white outline-none transition placeholder:text-white/35 focus:border-red-500/40"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-xl bg-white/10 text-white/60"
                  aria-label="Clear search"
                >
                  <X size={15} />
                </button>
              )}
            </div>
          </div>
        </section>

        {filteredCreators.length === 0 ? (
          <section className="mt-5 rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 text-center shadow-2xl shadow-black/20 sm:p-12">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.5rem] border border-red-500/20 bg-red-500/10 text-red-300">
              <Users size={38} />
            </div>

            <h2 className="mt-7 text-2xl font-black">No creators found</h2>

            <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-white/55">
              Creators will appear after they upload approved notes.
            </p>
          </section>
        ) : (
          <section className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredCreators.map((creator, index) => (
              <Link
                key={creator.uid}
                href={`/profile/${creator.uid}`}
                className="group rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20 transition hover:border-red-500/30 hover:bg-white/[0.06] sm:p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <UserAvatar
                    name={creator.displayName}
                    src={creator.avatarUrl || ""}
                    size="lg"
                  />

                  <div className="rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs font-black text-red-400">
                    #{index + 1}
                  </div>
                </div>

                <div className="mt-5">
                  <div className="flex min-w-0 items-center gap-2">
                    <h2 className="line-clamp-1 text-xl font-black">
                      {creator.displayName}
                    </h2>

                    {creator.verified && (
                      <BadgeCheck
                        size={18}
                        className="shrink-0 text-blue-400"
                      />
                    )}
                  </div>

                  <p className="mt-1 text-sm font-semibold text-white/50">
                    {creator.occupation || "Student"}
                  </p>
                </div>

                <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-3">
                  <MiniStat
                    icon={<FileText size={18} />}
                    value={creator.notesCount}
                    label="Notes"
                  />

                  <MiniStat
                    icon={<Users size={18} />}
                    value={creator.followersCount}
                    label="Followers"
                  />

                  <MiniStat
                    icon={<Download size={18} />}
                    value={creator.downloadsCount}
                    label="Downloads"
                  />
                </div>

                <div className="mt-6 rounded-2xl bg-red-600 px-5 py-3 text-center text-sm font-black text-white transition group-hover:bg-red-500">
                  View Profile
                </div>
              </Link>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}

function MiniStat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/10 bg-black/25 p-3 text-center">
      <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-xl bg-red-500/10 text-red-300">
        {icon}
      </div>

      <p className="mt-2 truncate text-lg font-black">{value}</p>
      <p className="truncate text-[10px] font-bold text-white/40">{label}</p>
    </div>
  );
}