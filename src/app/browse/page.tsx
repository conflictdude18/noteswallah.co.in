"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import {
  BookOpen,
  Download,
  FileText,
  Layers,
  Search,
  SlidersHorizontal,
  Sparkles,
  X,
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
        .map((document) => ({
          id: document.id,
          ...(document.data() as Omit<Note, "id">),
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
      const noteClass = normalizeText(note.class);
      const noteSubject = normalizeText(note.subject);
      const noteTitle = normalizeText(note.title);
      const noteTopic = normalizeText(note.topic);
      const noteDescription = normalizeText(note.description);

      const normalizedClassFilter = normalizeText(classFilter);
      const normalizedSubjectFilter = normalizeText(subjectFilter);
      const normalizedSearch = normalizeText(search);

      const matchesClass = normalizedClassFilter
        ? noteClass.includes(normalizedClassFilter)
        : true;

      const matchesSubject = normalizedSubjectFilter
        ? noteSubject.includes(normalizedSubjectFilter)
        : true;

      const matchesSearch = normalizedSearch
        ? noteTitle.includes(normalizedSearch) ||
          noteTopic.includes(normalizedSearch) ||
          noteSubject.includes(normalizedSearch) ||
          noteDescription.includes(normalizedSearch)
        : true;

      return matchesClass && matchesSubject && matchesSearch;
    });
  }, [notes, classFilter, subjectFilter, search]);

  const subjectsCount = new Set(
    notes.map((note) => normalizeText(note.subject)).filter(Boolean)
  ).size;

  const classesCount = new Set(
    notes.map((note) => normalizeClassName(note.class)).filter(Boolean)
  ).size;

  const hasFilters = Boolean(search || classFilter || subjectFilter);

  function clearFilters() {
    setSearch("");
    setClassFilter("");
    setSubjectFilter("");
  }

  return (
    <main className="space-y-8 pb-24 md:pb-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#07090d] p-6 shadow-card md:p-10">
        <div className="absolute right-[-90px] top-[-90px] h-[280px] w-[280px] rounded-full bg-red-500/20 blur-[120px]" />
        <div className="absolute bottom-[-130px] left-[-120px] h-[280px] w-[280px] rounded-full bg-red-700/10 blur-[120px]" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-bold text-red-300">
            <BookOpen size={16} />
            Browse Community Notes
          </div>

          <div className="mt-7 grid gap-7 lg:grid-cols-[1fr_320px] lg:items-end">
            <div>
              <h1 className="max-w-4xl text-4xl font-black leading-tight tracking-tight text-white md:text-6xl">
                Discover Notes Shared
                <span className="block text-[#ff2d3d]">By Students</span>
              </h1>

              <p className="mt-5 max-w-2xl text-sm leading-7 text-white/60 md:text-base">
                Explore verified PDFs, assignments, PYQs, revision sheets and
                study material uploaded by the NotesWallah community.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 lg:grid-cols-1">
              <StatsCard label="Showing" value={filteredNotes.length} />
              <StatsCard label="Subjects" value={subjectsCount} />
              <StatsCard label="Classes" value={classesCount} />
            </div>
          </div>

          <div className="mt-8 rounded-[1.7rem] border border-white/10 bg-white/[0.045] p-4 backdrop-blur-xl md:p-5">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-sm font-black text-white/70">
                <SlidersHorizontal size={17} />
                Search & Filters
              </div>

              {hasFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-bold text-white/60 transition hover:border-red-500/30 hover:text-red-300"
                >
                  <X size={14} />
                  Clear Filters
                </button>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-[1.4fr_1fr_1fr]">
              <div className="relative">
                <Search
                  size={18}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/35"
                />

                <input
                  id="search"
                  name="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search title, topic, subject..."
                  className="nw-input input-icon-left"
                />
              </div>

              <input
                id="classFilter"
                name="classFilter"
                value={classFilter}
                onChange={(event) => setClassFilter(event.target.value)}
                placeholder="Class e.g. 12th"
                className="nw-input"
              />

              <input
                id="subjectFilter"
                name="subjectFilter"
                value={subjectFilter}
                onChange={(event) => setSubjectFilter(event.target.value)}
                placeholder="Subject e.g. Physics"
                className="nw-input"
              />
            </div>
          </div>
        </div>
      </section>

      <section>
        {loading && (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <NoteCardSkeleton key={index} />
            ))}
          </div>
        )}

        {!loading && filteredNotes.length === 0 && (
          <div className="glass-card rounded-[2rem] p-8 text-center md:p-12">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.5rem] border border-red-500/20 bg-red-500/10 text-red-300">
              <FileText size={38} />
            </div>

            <h2 className="mt-7 text-2xl font-black text-white">
              No Notes Found
            </h2>

            <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-white/55 md:text-base">
              Try changing your search, class, or subject filter.
            </p>

            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="btn-primary mt-8"
              >
                <X size={17} />
                Clear Filters
              </button>
            )}
          </div>
        )}

        {!loading && filteredNotes.length > 0 && (
          <>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.22em] text-red-300">
                  <Sparkles size={15} />
                  Library
                </p>

                <h2 className="mt-2 text-3xl font-black text-white">
                  Available Notes
                </h2>
              </div>

              <p className="text-sm font-semibold text-white/45">
                Showing {filteredNotes.length} of {notes.length} notes
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredNotes.map((note) => (
                <Link
                  key={note.id}
                  href={user ? `/notes/${note.id}` : "/signin"}
                  className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.045] shadow-card transition duration-300 hover:-translate-y-1 hover:border-red-500/35 hover:bg-white/[0.07]"
                >
                  <div className="relative h-56 overflow-hidden border-b border-white/10 bg-[#050607]">
                    {note.thumbnailUrl ? (
                      <Image
                        src={note.thumbnailUrl}
                        alt={note.title || "Note thumbnail"}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                        className="object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-gradient-to-br from-red-500/10 via-[#0b0f14] to-black">
                        <div className="text-center">
                          <FileText
                            size={54}
                            className="mx-auto text-red-400"
                          />

                          <p className="mt-4 text-sm font-semibold text-white/45">
                            No Preview
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />

                    <div className="absolute left-4 top-4 max-w-[75%] rounded-full border border-red-500/20 bg-red-500/15 px-3 py-1 text-xs font-bold text-red-200 backdrop-blur-xl">
                      <span className="line-clamp-1">
                        {note.subject || "General"}
                      </span>
                    </div>
                  </div>

                  <div className="p-5">
                    <h3 className="line-clamp-2 text-xl font-black leading-snug text-white transition group-hover:text-red-300">
                      {note.title || "Untitled Note"}
                    </h3>

                    <p className="mt-3 line-clamp-3 min-h-[4rem] text-sm leading-relaxed text-white/55">
                      {note.description || "No description added."}
                    </p>

                    <div className="mt-5 flex flex-wrap gap-2">
                      <div className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-xs font-semibold text-white/60">
                        {formatClassLabel(note.class)}
                      </div>

                      <div className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-xs font-semibold text-white/60">
                        {note.topic || "Topic not set"}
                      </div>
                    </div>

                    <div className="mt-5 flex items-center justify-between gap-3 border-t border-white/10 pt-5">
                      <div className="flex items-center gap-2 text-sm font-semibold text-white/45">
                        <Download size={16} />
                        <span>{note.downloadsCount ?? 0}</span>
                      </div>

                      <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-bold text-white/70 transition group-hover:border-red-500/25 group-hover:text-red-300">
                        {user ? "View Note" : "Login Required"}
                        <Layers size={14} />
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

function StatsCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-white/40">
        {label}
      </p>

      <h2 className="mt-1 text-3xl font-black text-white">{value}</h2>
    </div>
  );
}

function normalizeText(value?: string) {
  return (value || "").toLowerCase().trim();
}

function normalizeClassName(value?: string) {
  const match = value?.match(/\d+/);
  return match ? match[0] : normalizeText(value);
}

function formatClassLabel(value?: string) {
  const normalized = normalizeClassName(value);

  if (!normalized) {
    return "Class not set";
  }

  if (/^\d+$/.test(normalized)) {
    return `Class ${normalized}`;
  }

  return value || "Class not set";
}