"use client";

import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { toast } from "sonner";
import {
  Bookmark,
  BookOpen,
  ExternalLink,
  FileText,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";

import { db } from "@/firebase/firebase";
import { useAuth } from "@/contexts/AuthContext";

type BookmarkType = {
  id: string;
  userId: string;
  noteId: string;
  title: string;
  subject: string;
  class: string;
  topic: string;
  pdfURL: string;
  createdAt: string;
};

export default function SavedNotesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [bookmarks, setBookmarks] = useState<BookmarkType[]>([]);
  const [fetching, setFetching] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [removingId, setRemovingId] = useState<string | null>(null);

  async function fetchBookmarks() {
    if (!user) return;

    setFetching(true);

    try {
      const q = query(
        collection(db, "bookmarks"),
        where("userId", "==", user.uid)
      );

      const snap = await getDocs(q);

      const data: BookmarkType[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<BookmarkType, "id">),
      }));

      setBookmarks(data);
    } catch (err) {
      console.error("BOOKMARK FETCH ERROR:", err);
      toast.error("Failed to load saved notes.");
    } finally {
      setFetching(false);
    }
  }

  async function removeBookmark(bookmarkId: string) {
    setRemovingId(bookmarkId);

    try {
      await deleteDoc(doc(db, "bookmarks", bookmarkId));

      setBookmarks((prev) => prev.filter((item) => item.id !== bookmarkId));

      toast.success("Removed from saved notes.");
    } catch (err) {
      console.error("BOOKMARK DELETE ERROR:", err);
      toast.error("Failed to remove saved note.");
    } finally {
      setRemovingId(null);
    }
  }

  useEffect(() => {
    if (!loading && !user) {
      router.push("/signin");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchBookmarks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const filteredBookmarks = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();

    return bookmarks.filter((item) => {
      const value =
        `${item.title} ${item.subject} ${item.class} ${item.topic}`.toLowerCase();

      return value.includes(term);
    });
  }, [bookmarks, searchTerm]);

  const subjectsCount = new Set(
    bookmarks.map((item) => item.subject).filter(Boolean)
  ).size;

  const classesCount = new Set(
    bookmarks
      .map((item) => {
        const match = item.class?.match(/\d+/);
        return match ? match[0] : item.class?.toLowerCase().trim();
      })
      .filter(Boolean)
  ).size;

  if (loading || fetching) {
    return (
      <main className="min-h-screen bg-[#050505] px-4 py-8 text-white">
        <div className="mx-auto flex min-h-[70vh] max-w-4xl items-center justify-center">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-white/10 bg-white/5">
              <RefreshCw className="animate-spin text-red-500" size={30} />
            </div>

            <h1 className="mt-5 text-xl font-black">Loading saved notes</h1>

            <p className="mt-2 text-sm text-white/50">
              Opening your personal study library...
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
                <Bookmark size={16} />
                Your Saved Library
              </div>

              <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-5xl">
                Saved Notes
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/55 sm:text-base">
                All your bookmarked PDFs are saved here for quick revision and
                easy access.
              </p>
            </div>

            <button
              type="button"
              onClick={() => router.push("/browse")}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-4 text-sm font-black text-white transition hover:bg-red-500 sm:w-fit"
            >
              <BookOpen size={18} />
              Browse Notes
            </button>
          </div>

          <div className="relative mt-6 grid grid-cols-3 gap-3">
            <StatCard label="Saved" value={bookmarks.length} />
            <StatCard label="Subjects" value={subjectsCount} />
            <StatCard label="Classes" value={classesCount} />
          </div>
        </section>

        {bookmarks.length > 0 && (
          <section className="sticky top-0 z-30 -mx-4 mt-4 border-b border-white/10 bg-[#050505]/90 px-4 py-3 backdrop-blur-xl sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0">
            <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-3 sm:mt-5">
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-3.5">
                <Search size={18} className="shrink-0 text-white/40" />

                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search title, subject, class..."
                  className="w-full bg-transparent text-sm font-semibold text-white outline-none placeholder:text-white/35"
                />

                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    className="rounded-full bg-white/10 p-1 text-white/50"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>
            </div>
          </section>
        )}

        {bookmarks.length === 0 ? (
          <EmptyState
            icon={<Bookmark size={36} />}
            title="No saved notes yet"
            text="Browse notes and save PDFs to build your personal study library."
            buttonText="Browse Notes"
            onClick={() => router.push("/browse")}
          />
        ) : filteredBookmarks.length === 0 ? (
          <EmptyState
            icon={<Search size={36} />}
            title="No matching notes"
            text="Try searching with another title, class, subject or topic."
          />
        ) : (
          <section className="mt-5 grid gap-4 pb-24 md:grid-cols-2 xl:grid-cols-3">
            {filteredBookmarks.map((item) => (
              <article
                key={item.id}
                className="group overflow-hidden rounded-[1.6rem] border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/20 backdrop-blur-xl transition hover:border-red-500/30 hover:bg-white/[0.06]"
              >
                <div className="flex gap-4 p-4 sm:p-5">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-300">
                    <FileText size={26} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h2 className="line-clamp-2 text-base font-black leading-snug sm:text-lg">
                      {item.title || "Untitled Note"}
                    </h2>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <MiniTag>{item.class || "Class not set"}</MiniTag>
                      <MiniTag>{item.subject || "Subject not set"}</MiniTag>
                      <MiniTag>{item.topic || "Topic not set"}</MiniTag>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 border-t border-white/10 p-4 pt-3 sm:p-5 sm:pt-4">
                  <button
                    type="button"
                    onClick={() => router.push(`/notes/${item.noteId}`)}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-white px-3 py-2 text-xs font-black text-black transition hover:bg-red-500 hover:text-white"
                  >
                    <ExternalLink size={15} />
                    Open
                  </button>

                  <button
                    type="button"
                    disabled={removingId === item.id}
                    onClick={() => removeBookmark(item.id)}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-xs font-black text-red-200 transition hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {removingId === item.id ? (
                      <RefreshCw size={15} className="animate-spin" />
                    ) : (
                      <Trash2 size={15} />
                    )}
                    Remove
                  </button>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-4 text-center">
      <p className="text-2xl font-black text-white sm:text-3xl">{value}</p>
      <p className="mt-1 text-[11px] font-bold text-white/45 sm:text-xs">
        {label}
      </p>
    </div>
  );
}

function MiniTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="max-w-full truncate rounded-full border border-white/10 bg-black/25 px-2.5 py-1 text-[10px] font-bold text-white/55">
      {children}
    </span>
  );
}

function EmptyState({
  icon,
  title,
  text,
  buttonText,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  buttonText?: string;
  onClick?: () => void;
}) {
  return (
    <section className="mt-5 rounded-[2rem] border border-white/10 bg-[#0d0d0d] p-8 text-center sm:p-12">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.5rem] border border-red-500/20 bg-red-500/10 text-red-300">
        {icon}
      </div>

      <h2 className="mt-7 text-2xl font-black text-white">{title}</h2>

      <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-white/55">
        {text}
      </p>

      {buttonText && onClick && (
        <button
          type="button"
          onClick={onClick}
          className="btn-primary mt-8"
        >
          <BookOpen size={18} />
          {buttonText}
        </button>
      )}
    </section>
  );
}