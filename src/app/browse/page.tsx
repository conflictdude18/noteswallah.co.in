"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import {
  Download,
  Eye,
  FileText,
  Heart,
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

type SortOption = "latest" | "downloads" | "likes" | "views";

export default function BrowseNotesPage() {
  const { user } = useAuth();

  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [classFilter, setClassFilter] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [boardFilter, setBoardFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("latest");
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

  const subjects = useMemo(
    () => getUniqueValues(notes.map((note) => note.subject)),
    [notes]
  );

  const classes = useMemo(
    () =>
      getUniqueValues(notes.map((note) => normalizeClassName(note.class))).sort(
        (a, b) => Number(a) - Number(b)
      ),
    [notes]
  );

  const boards = useMemo(
    () => getUniqueValues(notes.map((note) => note.board)),
    [notes]
  );

  const types = useMemo(
    () => getUniqueValues(notes.map((note) => note.type)),
    [notes]
  );

  const filteredNotes = useMemo(() => {
    const normalizedClassFilter = normalizeText(classFilter);
    const normalizedSubjectFilter = normalizeText(subjectFilter);
    const normalizedBoardFilter = normalizeText(boardFilter);
    const normalizedTypeFilter = normalizeText(typeFilter);
    const normalizedSearch = normalizeText(search);

    const result = notes.filter((note) => {
      const noteClass = normalizeText(normalizeClassName(note.class));
      const noteSubject = normalizeText(note.subject);
      const noteBoard = normalizeText(note.board);
      const noteType = normalizeText(note.type);

      const searchableText = [
        note.title,
        note.subject,
        note.class,
        note.board,
        note.topic,
        note.type,
        note.description,
        ...(Array.isArray(note.tags) ? note.tags : []),
        ...(Array.isArray(note.keywords) ? note.keywords : []),
      ]
        .join(" ")
        .toLowerCase();

      const matchesClass = normalizedClassFilter
        ? noteClass === normalizedClassFilter
        : true;

      const matchesSubject = normalizedSubjectFilter
        ? noteSubject === normalizedSubjectFilter
        : true;

      const matchesBoard = normalizedBoardFilter
        ? noteBoard === normalizedBoardFilter
        : true;

      const matchesType = normalizedTypeFilter
        ? noteType === normalizedTypeFilter
        : true;

      const matchesSearch = normalizedSearch
        ? searchableText.includes(normalizedSearch)
        : true;

      return (
        matchesClass &&
        matchesSubject &&
        matchesBoard &&
        matchesType &&
        matchesSearch
      );
    });

    return result.sort((a, b) => {
      if (sortBy === "downloads") return getDownloads(b) - getDownloads(a);
      if (sortBy === "likes") return getNumber(b.likes) - getNumber(a.likes);
      if (sortBy === "views") return getNumber(b.views) - getNumber(a.views);

      return getCreatedTime(b.createdAt) - getCreatedTime(a.createdAt);
    });
  }, [
    notes,
    classFilter,
    subjectFilter,
    boardFilter,
    typeFilter,
    sortBy,
    search,
  ]);

  const subjectsCount = subjects.length;
  const classesCount = classes.length;

  const hasFilters = Boolean(
    search || classFilter || subjectFilter || boardFilter || typeFilter
  );

  function clearFilters() {
    setSearch("");
    setClassFilter("");
    setSubjectFilter("");
    setBoardFilter("");
    setTypeFilter("");
    setSortBy("latest");
    setFiltersOpen(false);
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <div className="mx-auto w-full max-w-[1500px] px-3 py-4 sm:px-5 lg:px-6">
        <section className="mb-3 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#0d0d0d] p-3 sm:p-4">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-red-300 sm:text-xs">
              Browse Notes
            </p>

            <h1 className="mt-0.5 truncate text-xl font-black tracking-tight text-white sm:text-2xl">
              Community Library
            </h1>

            <p className="mt-0.5 text-xs text-white/45 sm:text-sm">
              {filteredNotes.length} notes • {subjectsCount} subjects •{" "}
              {classesCount} classes
            </p>
          </div>

          <button
            type="button"
            onClick={fetchNotes}
            className="flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#050505] px-3 text-xs font-bold text-white/70 transition hover:text-white"
          >
            <RefreshCw size={15} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </section>

        <section className="mb-4 rounded-2xl border border-white/10 bg-[#0d0d0d] p-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/35"
              />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search notes..."
                className="w-full rounded-xl border border-white/10 bg-[#050505] px-4 py-3 pl-11 pr-10 text-sm font-semibold text-white outline-none placeholder:text-white/35 focus:border-red-500/40"
              />

              {hasFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg bg-white/10 text-white/60 transition hover:bg-red-500 hover:text-white"
                  aria-label="Clear filters"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setFiltersOpen((prev) => !prev)}
              className="flex h-12 shrink-0 items-center gap-2 rounded-xl border border-white/10 bg-[#050505] px-3 text-xs font-black text-white/70 md:hidden"
            >
              <SlidersHorizontal size={16} />
              Filters
            </button>
          </div>

          <div className={`${filtersOpen ? "block" : "hidden"} mt-3 md:block`}>
            <div className="grid gap-3 md:grid-cols-5">
              <FilterSelect
                label="Class"
                value={classFilter}
                onChange={setClassFilter}
                options={classes}
                placeholder="All Classes"
                formatOption={(value) =>
                  /^\d+$/.test(value) ? `Class ${value}` : value
                }
              />

              <FilterSelect
                label="Subject"
                value={subjectFilter}
                onChange={setSubjectFilter}
                options={subjects}
                placeholder="All Subjects"
              />

              <FilterSelect
                label="Board"
                value={boardFilter}
                onChange={setBoardFilter}
                options={boards}
                placeholder="All Boards"
              />

              <FilterSelect
                label="Type"
                value={typeFilter}
                onChange={setTypeFilter}
                options={types}
                placeholder="All Types"
              />

              <div>
                <label className="mb-2 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-white/35">
                  <Sparkles size={13} />
                  Sort
                </label>

                <select
                  value={sortBy}
                  onChange={(event) =>
                    setSortBy(event.target.value as SortOption)
                  }
                  className="w-full rounded-xl border border-white/10 bg-[#050505] px-3 py-3 text-xs font-bold text-white outline-none focus:border-red-500/40"
                >
                  <option value="latest" className="bg-[#050505]">
                    Latest
                  </option>
                  <option value="downloads" className="bg-[#050505]">
                    Most Downloaded
                  </option>
                  <option value="likes" className="bg-[#050505]">
                    Most Liked
                  </option>
                  <option value="views" className="bg-[#050505]">
                    Most Viewed
                  </option>
                </select>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-white/35">
              <SlidersHorizontal size={14} />
              Popular Subjects
            </div>

            <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
              <Chip
                label="All"
                active={!subjectFilter}
                onClick={() => setSubjectFilter("")}
              />

              {subjects.slice(0, 12).map((subject) => (
                <Chip
                  key={subject}
                  label={subject}
                  active={
                    normalizeText(subjectFilter) === normalizeText(subject)
                  }
                  onClick={() => setSubjectFilter(subject)}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="pb-24">
          {loading && (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <NoteCardSkeleton key={index} />
              ))}
            </div>
          )}

          {!loading && filteredNotes.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-[#0d0d0d] p-8 text-center sm:p-12">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-300">
                <FileText size={32} />
              </div>

              <h2 className="mt-5 text-2xl font-black">No notes found</h2>

              <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-white/55">
                Try changing your search, class, subject, board or type filter.
              </p>

              {hasFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="btn-primary mt-6"
                >
                  <X size={17} />
                  Clear Filters
                </button>
              )}
            </div>
          )}

          {!loading && filteredNotes.length > 0 && (
            <>
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-red-300">
                    <Sparkles size={14} />
                    Library
                  </p>

                  <h2 className="mt-1 text-xl font-black sm:text-2xl">
                    Available Notes
                  </h2>
                </div>

                <p className="text-right text-xs font-semibold text-white/45 sm:text-sm">
                  {filteredNotes.length} of {notes.length}
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {filteredNotes.map((note) => (
                  <Link
                    key={note.id}
                    href={user ? `/notes/${note.id}` : "/signin"}
                    className="group overflow-hidden rounded-2xl border border-white/10 bg-[#0d0d0d] transition hover:border-red-500/35 hover:bg-[#141414]"
                  >
                    <div className="grid grid-cols-[92px_1fr] md:block">
                      <div className="relative min-h-[132px] overflow-hidden border-r border-white/10 bg-[#050505] md:h-44 md:border-b md:border-r-0">
                        {note.thumbnailUrl ? (
                          <Image
                            src={note.thumbnailUrl}
                            alt={note.title || "Note thumbnail"}
                            fill
                            sizes="(max-width: 768px) 92px, (max-width: 1280px) 50vw, 25vw"
                            className="object-cover transition duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center bg-[#080808]">
                            <FileText size={30} className="text-red-400" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 p-3.5 sm:p-4">
                        <div className="mb-2 flex flex-wrap gap-1.5">
                          <span className="line-clamp-1 rounded-full border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-[10px] font-bold text-red-200">
                            {note.subject || "General"}
                          </span>

                          <span className="rounded-full border border-white/10 bg-black/25 px-2 py-0.5 text-[10px] font-semibold text-white/55">
                            {formatClassLabel(note.class)}
                          </span>

                          {note.board && (
                            <span className="rounded-full border border-white/10 bg-black/25 px-2 py-0.5 text-[10px] font-semibold text-white/55">
                              {note.board}
                            </span>
                          )}

                          {note.type && (
                            <span className="rounded-full border border-white/10 bg-black/25 px-2 py-0.5 text-[10px] font-semibold text-white/55">
                              {note.type}
                            </span>
                          )}
                        </div>

                        <h3 className="line-clamp-2 text-sm font-black leading-snug transition group-hover:text-red-300 sm:text-base">
                          {note.title || "Untitled Note"}
                        </h3>

                        <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-white/45">
                          {note.description ||
                            note.topic ||
                            "No description added."}
                        </p>

                        <div className="mt-3 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 text-xs font-semibold text-white/40">
                            <span className="flex items-center gap-1">
                              <Download size={13} />
                              {getDownloads(note)}
                            </span>

                            <span className="flex items-center gap-1">
                              <Heart size={13} />
                              {getNumber(note.likes)}
                            </span>

                            <span className="flex items-center gap-1">
                              <Eye size={13} />
                              {getNumber(note.views)}
                            </span>
                          </div>

                          <div className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1.5 text-[10px] font-black text-black transition group-hover:bg-red-500 group-hover:text-white">
                            {user ? "View" : "Login"}
                            <Layers size={12} />
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

function FilterSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
  formatOption,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder: string;
  formatOption?: (value: string) => string;
}) {
  return (
    <div>
      <label className="mb-2 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-white/35">
        <SlidersHorizontal size={13} />
        {label}
      </label>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-white/10 bg-[#050505] px-3 py-3 text-xs font-bold text-white outline-none focus:border-red-500/40"
      >
        <option value="" className="bg-[#050505]">
          {placeholder}
        </option>

        {options.map((option) => (
          <option key={option} value={option} className="bg-[#050505]">
            {formatOption ? formatOption(option) : option}
          </option>
        ))}
      </select>
    </div>
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
          ? "whitespace-nowrap rounded-full bg-red-600 px-4 py-2 text-xs font-black text-white"
          : "whitespace-nowrap rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-bold text-white/60 transition hover:border-red-500/25 hover:text-white"
      }
    >
      {label}
    </button>
  );
}

function getUniqueValues(values: Array<string | undefined>) {
  const map = new Map<string, string>();

  values.forEach((value) => {
    if (!value?.trim()) return;

    const cleaned = value.trim();
    const normalized = cleaned.toLowerCase();

    if (!map.has(normalized)) {
      map.set(normalized, cleaned);
    }
  });

  return Array.from(map.values());
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

function getNumber(value: unknown) {
  return typeof value === "number" ? value : 0;
}

function getDownloads(note: Note) {
  return getNumber(note.downloads) || getNumber(note.downloadsCount);
}

function getCreatedTime(value: unknown) {
  if (!value) return 0;

  if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof value.toDate === "function"
  ) {
    return value.toDate().getTime();
  }

  if (typeof value === "string") {
    return new Date(value).getTime() || 0;
  }

  return 0;
}