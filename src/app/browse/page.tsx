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
  RefreshCw,
  Search,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";
import { toast } from "sonner";

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
    } catch (err) {
      console.error("Error fetching notes:", err);
      toast.error("Failed to load notes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchNotes();
  }, []);

  const subjectChips = useMemo(() => {
    const items = notes
      .map((note) => note.subject)
      .filter(Boolean)
      .map((subject) => subject as string);

    return Array.from(new Set(items)).slice(0, 12);
  }, [notes]);

  const classChips = ["9", "10", "11", "12"];

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
    <main className="min-h-screen bg-[#050505] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/10 via-white/[0.04] to-red-500/10 p-5 shadow-2xl shadow-black/30 sm:p-7 lg:p-9">
          <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-red-500/20 blur-3xl" />

          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 text-xs font-black text-red-300">
              <BookOpen size={16} />
              Browse Community Notes
            </div>

            <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_360px] lg:items-end">
              <div>
                <h1 className="max-w-4xl text-3xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                  Discover notes
                  <span className="block text-red-500">
                    shared by students
                  </span>
                </h1>

                <p className="mt-4 max-w-2xl text-sm leading-6 text-white/55 sm:text-base">
                  Explore approved PDFs, assignments, PYQs, revision sheets and
                  study material uploaded by the NotesWallah community.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 lg:grid-cols-1">
                <StatsCard label="Showing" value={filteredNotes.length} />
                <StatsCard label="Subjects" value={subjectsCount} />
                <StatsCard label="Classes" value={classesCount} />
              </div>
            </div>
          </div>
        </section>

        <section className="sticky top-0 z-30 -mx-4 mt-4 border-b border-white/10 bg-[#050505]/90 px-4 py-3 backdrop-blur-xl sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0">
          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-3 sm:mt-5">
            <div className="relative">
              <Search
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/35"
              />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search notes, subject, topic..."
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3.5 pl-11 pr-12 text-sm font-semibold text-white outline-none placeholder:text-white/35 focus:border-red-500/40"
              />

              {hasFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-xl bg-white/10 text-white/60 transition hover:bg-red-500 hover:text-white"
                  aria-label="Clear filters"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            <div className="mt-4 flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-white/35">
              <SlidersHorizontal size={14} />
              Subjects
            </div>

            <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
              <Chip
                label="All"
                active={!subjectFilter}
                onClick={() => setSubjectFilter("")}
              />

              {subjectChips.map((subject) => (
                <Chip
                  key={subject}
                  label={subject}
                  active={normalizeText(subjectFilter) === normalizeText(subject)}
                  onClick={() => setSubjectFilter(subject)}
                />
              ))}
            </div>

            <div className="mt-4 flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-white/35">
              <Layers size={14} />
              Classes
            </div>

            <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
              <Chip
                label="All Classes"
                active={!classFilter}
                onClick={() => setClassFilter("")}
              />

              {classChips.map((className) => (
                <Chip
                  key={className}
                  label={`Class ${className}`}
                  active={normalizeText(classFilter) === className}
                  onClick={() => setClassFilter(className)}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="mt-5 pb-24">
          {loading && (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <NoteCardSkeleton key={index} />
              ))}
            </div>
          )}

          {!loading && filteredNotes.length === 0 && (
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 text-center shadow-2xl shadow-black/20 sm:p-12">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.5rem] border border-red-500/20 bg-red-500/10 text-red-300">
                <FileText size={38} />
              </div>

              <h2 className="mt-7 text-2xl font-black">No notes found</h2>

              <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-white/55">
                Try changing your search, class, or subject filter.
              </p>

              {hasFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-8 inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-black text-white transition hover:bg-red-500"
                >
                  <X size={17} />
                  Clear Filters
                </button>
              )}
            </div>
          )}

          {!loading && filteredNotes.length > 0 && (
            <>
              <div className="mb-4 flex items-end justify-between gap-3">
                <div>
                  <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-red-300">
                    <Sparkles size={15} />
                    Library
                  </p>

                  <h2 className="mt-2 text-2xl font-black sm:text-3xl">
                    Available Notes
                  </h2>
                </div>

                <p className="text-right text-xs font-semibold text-white/45 sm:text-sm">
                  {filteredNotes.length} of {notes.length}
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredNotes.map((note) => (
                  <Link
                    key={note.id}
                    href={user ? `/notes/${note.id}` : "/signin"}
                    className="group overflow-hidden rounded-[1.6rem] border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/20 transition hover:border-red-500/35 hover:bg-white/[0.06]"
                  >
                    <div className="grid grid-cols-[92px_1fr] md:block">
                      <div className="relative min-h-[138px] overflow-hidden border-r border-white/10 bg-[#050607] md:h-52 md:border-b md:border-r-0">
                        {note.thumbnailUrl ? (
                          <Image
                            src={note.thumbnailUrl}
                            alt={note.title || "Note thumbnail"}
                            fill
                            sizes="(max-width: 768px) 92px, (max-width: 1280px) 50vw, 33vw"
                            className="object-cover transition duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center bg-gradient-to-br from-red-500/10 via-[#0b0f14] to-black">
                            <FileText size={34} className="text-red-400" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 p-4 sm:p-5">
                        <div className="mb-2 flex flex-wrap gap-2">
                          <span className="line-clamp-1 rounded-full border border-red-500/20 bg-red-500/15 px-2.5 py-1 text-[10px] font-bold text-red-200">
                            {note.subject || "General"}
                          </span>

                          <span className="rounded-full border border-white/10 bg-black/25 px-2.5 py-1 text-[10px] font-semibold text-white/60">
                            {formatClassLabel(note.class)}
                          </span>
                        </div>

                        <h3 className="line-clamp-2 text-base font-black leading-snug transition group-hover:text-red-300 sm:text-lg">
                          {note.title || "Untitled Note"}
                        </h3>

                        <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-white/50 sm:text-sm">
                          {note.description ||
                            note.topic ||
                            "No description added."}
                        </p>

                        <div className="mt-4 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-white/45">
                            <Download size={15} />
                            <span>{note.downloadsCount ?? 0}</span>
                          </div>

                          <div className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-2 text-[11px] font-black text-black transition group-hover:bg-red-500 group-hover:text-white">
                            {user ? "View" : "Login"}
                            <Layers size={13} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "whitespace-nowrap rounded-full bg-red-600 px-4 py-2 text-xs font-black text-white shadow-lg shadow-red-500/20"
          : "whitespace-nowrap rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-bold text-white/60 transition hover:border-red-500/25 hover:text-white"
      }
    >
      {label}
    </button>
  );
}

function StatsCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-4 text-center lg:text-left">
      <p className="text-[10px] font-bold uppercase tracking-wide text-white/40 sm:text-xs">
        {label}
      </p>

      <h2 className="mt-1 text-2xl font-black text-white sm:text-3xl">
        {value}
      </h2>
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

  if (!normalized) return "Class not set";
  if (/^\d+$/.test(normalized)) return `Class ${normalized}`;

  return value || "Class not set";
}