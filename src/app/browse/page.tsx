"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import {
  BookOpen,
  Download,
  FileText,
  Search,
} from "lucide-react";

import { db } from "@/firebase/firebase";
import type { Note } from "@/types/note";
import { useAuth } from "@/contexts/AuthContext";
import NoteCardSkeleton from "@/components/NoteCardSkeleton";

export default function BrowseNotesPage() {
  const { user } = useAuth();

  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  const [classFilter, setClassFilter] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [search, setSearch] = useState("");

  async function fetchNotes() {
    setLoading(true);

    try {
      const snap = await getDocs(collection(db, "notes"));

      const data: Note[] = snap.docs
        .map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Note, "id">),
        }))
        .filter((note) => note.status === "approved");

      setNotes(data);
    } catch (err: unknown) {
      console.error("Error fetching notes:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchNotes();
  }, []);

  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      const matchesClass = classFilter
        ? note.class.toLowerCase().includes(classFilter.toLowerCase())
        : true;

      const matchesSubject = subjectFilter
        ? note.subject.toLowerCase().includes(subjectFilter.toLowerCase())
        : true;

      const matchesSearch = search
        ? note.title.toLowerCase().includes(search.toLowerCase()) ||
          note.topic.toLowerCase().includes(search.toLowerCase()) ||
          note.subject.toLowerCase().includes(search.toLowerCase())
        : true;

      return matchesClass && matchesSubject && matchesSearch;
    });
  }, [notes, classFilter, subjectFilter, search]);

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      {/* HERO */}
      <section className="border-b border-white/10 bg-white/[0.02]">
        <div className="container-max py-14">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm text-red-400">
              <BookOpen size={16} />
              Browse Community Notes
            </div>

            <h1 className="text-4xl font-black md:text-6xl">
              Discover Notes Shared
              <span className="block text-red-500">
                By Students
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/65">
              Explore verified notes, assignments, PYQs,
              revision sheets and study material uploaded
              by students for Boards, JEE, NEET and more.
            </p>
          </div>

          {/* FILTERS */}
          <div className="mt-10 grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-5 md:grid-cols-3">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40"
              />

              <input
                id="search"
                name="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search notes..."
                className="w-full rounded-2xl border border-white/10 bg-black/30 py-3 pl-11 pr-4 outline-none transition focus:border-red-500"
              />
            </div>

            <input
              id="classFilter"
              name="classFilter"
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              placeholder="Class (e.g. 12th)"
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none transition focus:border-red-500"
            />

            <input
              id="subjectFilter"
              name="subjectFilter"
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              placeholder="Subject"
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none transition focus:border-red-500"
            />
          </div>
        </div>
      </section>

      {/* NOTES */}
      <section className="container-max py-12">
        {loading && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <NoteCardSkeleton key={index} />
            ))}
          </div>
        )}

        {!loading && filteredNotes.length === 0 && (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center">
            <FileText
              size={50}
              className="mx-auto text-white/30"
            />

            <h2 className="mt-5 text-2xl font-bold">
              No Notes Found
            </h2>

            <p className="mt-3 text-white/60">
              Try changing filters or search keywords.
            </p>
          </div>
        )}

        {!loading && filteredNotes.length > 0 && (
          <>
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">
                  Available Notes
                </h2>

                <p className="mt-1 text-sm text-white/50">
                  {filteredNotes.length} notes found
                </p>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredNotes.map((note) => (
                <Link
                  key={note.id}
                  href={user ? `/notes/${note.id}` : "/signin"}
                  className="group overflow-hidden rounded-3xl border border-white/10 bg-white/5 transition duration-300 hover:-translate-y-1 hover:border-red-500/30 hover:bg-white/[0.07]"
                >
                  {/* PREVIEW */}
                  <div className="relative h-56 overflow-hidden border-b border-white/10 bg-black">
                    {note.thumbnailUrl ? (
                      <img
                        src={note.thumbnailUrl}
                        alt={note.title}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-gradient-to-br from-red-500/10 to-black">
                        <div className="text-center">
                          <FileText
                            size={54}
                            className="mx-auto text-red-500"
                          />

                          <p className="mt-4 text-sm text-white/50">
                            No Preview
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  </div>

                  {/* CONTENT */}
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="line-clamp-2 text-xl font-bold transition group-hover:text-red-400">
                        {note.title}
                      </h3>

                      <div className="rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs text-red-400">
                        {note.subject}
                      </div>
                    </div>

                    <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-white/60">
                      {note.description}
                    </p>

                    {/* META */}
                    <div className="mt-6 flex flex-wrap gap-2">
                      <div className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs text-white/60">
                        Class {note.class}
                      </div>

                      <div className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs text-white/60">
                        {note.topic}
                      </div>
                    </div>

                    {/* FOOTER */}
                    <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-5">
                      <div className="flex items-center gap-2 text-sm text-white/50">
                        <Download size={16} />

                        <span>
                          {note.downloadsCount ?? 0} downloads
                        </span>
                      </div>

                      <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/70 transition group-hover:border-red-500/20 group-hover:text-red-400">
                        {user ? "View Note" : "Login Required"}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
}