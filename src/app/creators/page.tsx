"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import {
  BadgeCheck,
  Download,
  FileText,
  Search,
  Users,
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
                userData.displayName ||
                userData.name ||
                "NotesWallah User",
              avatarUrl:
                userData.avatarUrl ||
                userData.photoURL ||
                "",
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
            (creator) =>
              creator.notesCount > 0 || creator.followersCount > 0
          )
          .sort((a, b) => {
            const scoreA =
              a.followersCount * 5 +
              a.notesCount * 3 +
              a.downloadsCount;

            const scoreB =
              b.followersCount * 5 +
              b.notesCount * 3 +
              b.downloadsCount;

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
      creators.filter((creator) =>
        creator.displayName.toLowerCase().includes(term) ||
        creator.occupation?.toLowerCase().includes(term)
      )
    );
  }, [search, creators]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050505] text-white">
        <div className="text-center">
          <div className="mx-auto h-14 w-14 animate-spin rounded-full border-4 border-red-500 border-t-transparent" />
          <p className="mt-5 text-white/60">Loading creators...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <section className="container-max py-10">
        <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-4 inline-flex rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm text-red-400">
              Creator Discovery
            </div>

            <h1 className="text-4xl font-black">Top Contributors</h1>

            <p className="mt-3 max-w-2xl text-white/55">
              Discover students and contributors sharing useful study notes.
            </p>
          </div>

          <div className="relative w-full md:w-80">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40"
            />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search creators..."
              className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-red-500"
            />
          </div>
        </div>

        {filteredCreators.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center">
            <Users size={44} className="mx-auto text-white/30" />
            <h2 className="mt-4 text-2xl font-bold">No creators found</h2>
            <p className="mt-2 text-sm text-white/50">
              Creators will appear after they upload approved notes.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredCreators.map((creator, index) => (
              <Link
                key={creator.uid}
                href={`/profile/${creator.uid}`}
                className="group rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:-translate-y-1 hover:border-red-500/30 hover:bg-white/10"
              >
                <div className="flex items-start justify-between gap-4">
                  <UserAvatar
                    name={creator.displayName}
                    src={creator.avatarUrl || ""}
                    size="lg"
                  />

                  <div className="rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-400">
                    #{index + 1}
                  </div>
                </div>

                <div className="mt-5">
                  <div className="flex items-center gap-2">
                    <h2 className="line-clamp-1 text-xl font-black">
                      {creator.displayName}
                    </h2>

                    {creator.verified && (
                      <BadgeCheck size={18} className="text-blue-400" />
                    )}
                  </div>

                  <p className="mt-1 text-sm text-white/50">
                    {creator.occupation || "Student"}
                  </p>
                </div>

                <div className="mt-6 grid grid-cols-3 gap-3">
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-3 text-center">
                    <FileText size={18} className="mx-auto text-red-500" />
                    <p className="mt-2 text-lg font-black">
                      {creator.notesCount}
                    </p>
                    <p className="text-[11px] text-white/40">Notes</p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/30 p-3 text-center">
                    <Users size={18} className="mx-auto text-red-500" />
                    <p className="mt-2 text-lg font-black">
                      {creator.followersCount}
                    </p>
                    <p className="text-[11px] text-white/40">Followers</p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/30 p-3 text-center">
                    <Download size={18} className="mx-auto text-red-500" />
                    <p className="mt-2 text-lg font-black">
                      {creator.downloadsCount}
                    </p>
                    <p className="text-[11px] text-white/40">Downloads</p>
                  </div>
                </div>

                <div className="mt-6 rounded-2xl bg-red-600 px-5 py-3 text-center text-sm font-semibold text-white transition group-hover:bg-red-500">
                  View Profile
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}