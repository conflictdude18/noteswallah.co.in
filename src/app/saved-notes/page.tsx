"use client";

import { useEffect, useState } from "react";
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
  Search,
  Trash2,
} from "lucide-react";

import { db } from "@/firebase/firebase";
import { useAuth } from "@/contexts/AuthContext";
import LoadingSpinner from "@/components/LoadingSpinner";

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
    } catch (err: unknown) {
      console.error("BOOKMARK FETCH ERROR:", err);
      toast.error("Failed to load saved notes.");
    } finally {
      setFetching(false);
    }
  }

  async function removeBookmark(bookmarkId: string) {
    try {
      await deleteDoc(doc(db, "bookmarks", bookmarkId));

      setBookmarks((prev) =>
        prev.filter((item) => item.id !== bookmarkId)
      );

      toast.success("Removed from saved notes.");
    } catch (err: unknown) {
      console.error("BOOKMARK DELETE ERROR:", err);
      toast.error("Failed to remove saved note.");
    }
  }

  useEffect(() => {
    if (!loading && !user) {
      router.push("/signin");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchBookmarks();
    }
  }, [user]);

  const filteredBookmarks = bookmarks.filter((item) => {
    const value =
      `${item.title} ${item.subject} ${item.class} ${item.topic}`.toLowerCase();

    return value.includes(searchTerm.toLowerCase());
  });

  if (loading || fetching) {
    return <LoadingSpinner />;
  }

  return (
    <main className="space-y-8 pb-24 md:pb-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#07090d] p-6 shadow-card md:p-10">
        <div className="absolute right-[-90px] top-[-90px] h-[270px] w-[270px] rounded-full bg-red-500/20 blur-[120px]" />

        <div className="absolute bottom-[-120px] left-[-120px] h-[260px] w-[260px] rounded-full bg-red-700/10 blur-[120px]" />

        <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-bold text-red-300">
              <Bookmark size={16} />
              Your Saved Library
            </div>

            <h1 className="mt-6 text-4xl font-black tracking-tight text-white md:text-6xl">
              Saved Notes
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/60 md:text-base">
              Your bookmarked PDFs are stored here for quick access anytime.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/browse")}
            className="btn-primary w-full sm:w-fit"
          >
            <BookOpen size={18} />
            Browse Notes
          </button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="glass-card rounded-[2rem] p-5">
          <p className="text-sm font-semibold text-white/50">
            Total Saved
          </p>

          <h2 className="mt-2 text-3xl font-black text-white">
            {bookmarks.length}
          </h2>
        </div>

        <div className="glass-card rounded-[2rem] p-5">
          <p className="text-sm font-semibold text-white/50">
            Subjects
          </p>

          <h2 className="mt-2 text-3xl font-black text-white">
            {new Set(bookmarks.map((item) => item.subject)).size}
          </h2>
        </div>

        <div className="glass-card rounded-[2rem] p-5">
          <p className="text-sm font-semibold text-white/50">
            Classes
          </p>

          <h2 className="mt-2 text-3xl font-black text-white">
            {
              new Set(
                bookmarks.map((item) => {
                  const match = item.class?.match(/\d+/);

                  return match
                    ? match[0]
                    : item.class?.toLowerCase().trim();
                })
              ).size
            }
          </h2>
        </div>
      </section>

      {bookmarks.length > 0 && (
        <section className="glass-card rounded-[2rem] p-4 md:p-5">
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <Search size={18} className="text-white/40" />

            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search saved notes by title, subject, class, or topic..."
              className="w-full bg-transparent text-sm font-semibold text-white outline-none placeholder:text-white/35"
            />
          </div>
        </section>
      )}

      {bookmarks.length === 0 ? (
        <section className="glass-card rounded-[2rem] p-8 text-center md:p-12">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.5rem] border border-red-500/20 bg-red-500/10 text-red-300">
            <Bookmark size={38} />
          </div>

          <h2 className="mt-7 text-2xl font-black text-white">
            No Saved Notes Yet
          </h2>

          <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-white/55 md:text-base">
            Browse notes and save PDFs to build your personal study library.
          </p>

          <button
            type="button"
            onClick={() => router.push("/browse")}
            className="btn-primary mt-8"
          >
            <BookOpen size={18} />
            Browse Notes
          </button>
        </section>
      ) : filteredBookmarks.length === 0 ? (
        <section className="glass-card rounded-[2rem] p-8 text-center md:p-12">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.5rem] border border-white/10 bg-white/5 text-white/60">
            <Search size={36} />
          </div>

          <h2 className="mt-7 text-2xl font-black text-white">
            No Matching Notes
          </h2>

          <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-white/55 md:text-base">
            Try another keyword or search term.
          </p>
        </section>
      ) : (
        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredBookmarks.map((item) => (
            <article
              key={item.id}
              className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.035] p-6 shadow-card backdrop-blur-xl transition hover:-translate-y-1 hover:border-red-500/30 hover:bg-white/[0.055]"
            >
              <div className="absolute right-[-80px] top-[-80px] h-44 w-44 rounded-full bg-red-500/10 blur-[90px] transition group-hover:bg-red-500/20" />

              <div className="relative z-10">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-[1.35rem] border border-red-500/20 bg-red-500/10 text-red-300">
                    <FileText size={26} />
                  </div>

                  <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold text-white/50">
                    Saved
                  </div>
                </div>

                <h2 className="mt-6 line-clamp-2 text-xl font-black leading-snug text-white">
                  {item.title}
                </h2>

                <div className="mt-5 grid gap-3 text-sm">
                  <InfoRow label="Class" value={item.class} />
                  <InfoRow label="Subject" value={item.subject} />
                  <InfoRow label="Topic" value={item.topic} />
                </div>

                <div className="mt-6 flex gap-3 border-t border-white/10 pt-5">
                  <button
                    type="button"
                    onClick={() => router.push(`/notes/${item.noteId}`)}
                    className="btn-secondary min-h-0 flex-1 px-4 py-2.5 text-xs"
                  >
                    <ExternalLink size={15} />
                    Open
                  </button>

                  <button
                    type="button"
                    onClick={() => removeBookmark(item.id)}
                    className="flex min-h-[2.65rem] flex-1 items-center justify-center gap-2 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-2.5 text-xs font-black text-red-200 transition hover:bg-red-500 hover:text-white"
                  >
                    <Trash2 size={15} />
                    Remove
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
      <span className="text-xs font-bold uppercase tracking-wide text-white/35">
        {label}
      </span>

      <span className="line-clamp-1 text-right text-sm font-bold text-white/75">
        {value || "Not set"}
      </span>
    </div>
  );
}