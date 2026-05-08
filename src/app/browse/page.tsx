"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
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
    <div className="container-max py-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Browse Notes</h1>
          <p className="mt-2 text-white/70">
            Explore verified notes uploaded by students.
          </p>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <input
            id="search"
            name="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title, topic, subject..."
            className="w-full md:w-72 rounded-xl bg-white/5 border border-white/10 px-4 py-2 outline-none focus:border-red-500"
          />

          <input
            id="classFilter"
            name="classFilter"
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            placeholder="Class (e.g. 12th)"
            className="w-full md:w-40 rounded-xl bg-white/5 border border-white/10 px-4 py-2 outline-none focus:border-red-500"
          />

          <input
            id="subjectFilter"
            name="subjectFilter"
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            placeholder="Subject"
            className="w-full md:w-44 rounded-xl bg-white/5 border border-white/10 px-4 py-2 outline-none focus:border-red-500"
          />
        </div>
      </div>

      {loading && (
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <NoteCardSkeleton key={index} />
          ))}
        </div>
      )}

      {!loading && filteredNotes.length === 0 && (
        <p className="mt-10 text-white/60">No approved notes found.</p>
      )}

      {!loading && filteredNotes.length > 0 && (
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              className="glass-card p-6 hover:bg-white/10 transition"
            >
              <h2 className="text-lg font-semibold">{note.title}</h2>

              <p className="mt-2 text-sm text-white/60 line-clamp-2">
                {note.description}
              </p>

              <div className="mt-4 text-xs text-white/50 space-y-1">
                <p>
                  <span className="text-white/70">Class:</span> {note.class}
                </p>
                <p>
                  <span className="text-white/70">Subject:</span>{" "}
                  {note.subject}
                </p>
                <p>
                  <span className="text-white/70">Topic:</span> {note.topic}
                </p>
              </div>

              <div className="mt-5 flex items-center justify-between">
                <span className="text-xs text-white/50">
                  Downloads: {note.downloadsCount ?? 0}
                </span>

                {user ? (
                  <a
                    href={`/notes/${note.id}`}
                    className="btn-secondary text-xs px-4 py-2"
                  >
                    Open
                  </a>
                ) : (
                  <button
                    disabled
                    className="text-xs px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/40 cursor-not-allowed"
                  >
                    Login to Open
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}