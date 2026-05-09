"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import {
  AlertTriangle,
  ArrowLeft,
  Bookmark,
  Download,
  ExternalLink,
  FileText,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { db } from "@/firebase/firebase";
import { useAuth } from "@/contexts/AuthContext";
import UserAvatar from "@/components/UserAvatar";
import type { Note } from "@/types/note";

export default function NoteDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);

  const [bookmarkId, setBookmarkId] = useState<string | null>(null);
  const isBookmarked = Boolean(bookmarkId);

  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [reporting, setReporting] = useState(false);

  useEffect(() => {
    async function fetchNote() {
      setLoading(true);

      try {
        const snap = await getDoc(doc(db, "notes", id));

        if (!snap.exists()) {
          setNote(null);
          return;
        }

        setNote({
          id: snap.id,
          ...(snap.data() as Omit<Note, "id">),
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchNote();
  }, [id]);

  useEffect(() => {
    async function checkBookmark() {
      if (!user || !id) return;

      const q = query(
        collection(db, "bookmarks"),
        where("userId", "==", user.uid),
        where("noteId", "==", id)
      );

      const snap = await getDocs(q);

      if (!snap.empty) {
        setBookmarkId(snap.docs[0].id);
      } else {
        setBookmarkId(null);
      }
    }

    checkBookmark();
  }, [user, id]);

  async function handleBookmark() {
    if (!user) {
      router.push("/signin");
      return;
    }

    if (!note?.id) return;

    try {
      if (bookmarkId) {
        await deleteDoc(doc(db, "bookmarks", bookmarkId));
        setBookmarkId(null);
        toast.success("Removed from saved notes.");
      } else {
        const newBookmark = await addDoc(collection(db, "bookmarks"), {
          userId: user.uid,
          noteId: note.id,
          title: note.title,
          subject: note.subject,
          class: note.class,
          topic: note.topic,
          pdfURL: note.pdfURL,
          thumbnailUrl: note.thumbnailUrl || "",
          createdAt: new Date().toISOString(),
        });

        setBookmarkId(newBookmark.id);
        toast.success("Saved note.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Bookmark failed.");
    }
  }

  async function handleDownload() {
    if (!note?.id) return;

    if (!user) {
      router.push("/signin");
      return;
    }

    try {
      await updateDoc(doc(db, "notes", note.id), {
        downloadsCount: increment(1),
      });

      window.open(note.pdfURL, "_blank");
    } catch (err) {
      console.error(err);
      toast.error("Download failed.");
    }
  }

  async function handleReportSubmit() {
    if (!user) {
      router.push("/signin");
      return;
    }

    if (!note?.id) return;

    if (!reportReason.trim()) {
      toast.error("Please select a report reason.");
      return;
    }

    try {
      setReporting(true);

      await addDoc(collection(db, "reports"), {
        noteId: note.id,
        noteTitle: note.title,
        noteUploaderId: note.uploaderId,
        reporterId: user.uid,
        reporterEmail: user.email || "",
        reason: reportReason,
        details: reportDetails.trim(),
        status: "pending",
        createdAt: new Date().toISOString(),
      });

      toast.success("Report submitted. Admin will review it.");
      setReportOpen(false);
      setReportReason("");
      setReportDetails("");
    } catch (err) {
      console.error("REPORT ERROR:", err);
      toast.error("Failed to submit report.");
    } finally {
      setReporting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505] text-white">
        <div className="text-center">
          <div className="mx-auto h-14 w-14 animate-spin rounded-full border-4 border-red-500 border-t-transparent" />
          <p className="mt-5 text-white/60">Loading note...</p>
        </div>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505] text-white">
        <div className="text-center">
          <h1 className="text-4xl font-black">Note Not Found</h1>

          <button
            onClick={() => router.push("/browse")}
            className="mt-8 rounded-2xl bg-red-600 px-6 py-3 font-medium text-white transition hover:bg-red-500"
          >
            Back to Browse
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <div className="container-max py-8">
        <button
          onClick={() => router.push("/browse")}
          className="group flex items-center gap-2 text-sm text-white/60 transition hover:text-white"
        >
          <ArrowLeft
            size={16}
            className="transition group-hover:-translate-x-1"
          />
          Back to Browse
        </button>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.5fr_0.7fr]">
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/40 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-red-500/10 p-2 text-red-500">
                  <FileText size={20} />
                </div>

                <div>
                  <h2 className="font-semibold">PDF Preview</h2>
                  <p className="text-xs text-white/40">Optimized Viewer</p>
                </div>
              </div>

              <a
                href={note.pdfURL}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-white/10 bg-white/5 p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
                title="Open Original PDF"
              >
                <ExternalLink size={18} />
              </a>
            </div>

            <iframe
              src={`${note.pdfURL}#toolbar=0`}
              title={note.title}
              className="h-[85vh] w-full bg-black"
            />
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <div className="mb-4 inline-flex rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 text-xs text-red-400">
                Verified Study Material
              </div>

              <h1 className="text-3xl font-black leading-tight">
                {note.title}
              </h1>

              <p className="mt-4 text-sm leading-relaxed text-white/60">
                {note.description || "No description provided."}
              </p>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <p className="text-xs text-white/40">Subject</p>
                  <p className="mt-1 font-medium">{note.subject}</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <p className="text-xs text-white/40">Class</p>
                  <p className="mt-1 font-medium">{note.class}</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <p className="text-xs text-white/40">Topic</p>
                  <p className="mt-1 font-medium">{note.topic}</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <p className="text-xs text-white/40">Downloads</p>
                  <p className="mt-1 font-medium">
                    {note.downloadsCount ?? 0}
                  </p>
                </div>
              </div>

              {note.tags?.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-2">
                  {note.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-8 flex flex-col gap-3">
                <button
                  onClick={handleDownload}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-6 py-4 font-semibold text-white transition hover:bg-red-500"
                >
                  <Download size={18} />
                  {user ? "Download PDF" : "Login to Download"}
                </button>

                <button
                  onClick={handleBookmark}
                  className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-6 py-4 font-medium text-white transition hover:bg-white/10"
                >
                  <Bookmark size={18} />
                  {isBookmarked ? "Saved ✓" : "Save Note"}
                </button>

                <button
                  onClick={() => {
                    if (!user) {
                      router.push("/signin");
                      return;
                    }

                    setReportOpen(true);
                  }}
                  className="flex items-center justify-center gap-2 rounded-2xl border border-yellow-500/20 bg-yellow-500/10 px-6 py-4 font-medium text-yellow-400 transition hover:bg-yellow-500/20"
                >
                  <AlertTriangle size={18} />
                  Report Note
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <p className="text-xs uppercase tracking-widest text-white/40">
                Uploaded By
              </p>

              <div className="mt-4 flex items-center gap-4">
                <UserAvatar
                  name={note.uploaderName || "User"}
                  size="md"
                />

                <div>
                  <h3 className="font-semibold">{note.uploaderName}</h3>
                  <p className="text-sm text-white/50">
                    NotesWallah Contributor
                  </p>
                </div>
              </div>

              <button
                onClick={() => router.push(`/profile/${note.uploaderId}`)}
                className="mt-5 w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
              >
                View Profile
              </button>
            </div>

            <div className="rounded-3xl border border-green-500/20 bg-green-500/5 p-5">
              <p className="text-sm font-medium text-green-400">
                Safe Download
              </p>

              <p className="mt-2 text-xs leading-relaxed text-white/50">
                This note was reviewed and approved before appearing on
                NotesWallah.
              </p>
            </div>
          </div>
        </div>
      </div>

      {reportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-zinc-950 p-6 text-white shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black">Report Note</h2>

              <button
                onClick={() => setReportOpen(false)}
                className="rounded-xl border border-white/10 bg-white/5 p-2 text-white/70 hover:bg-white/10"
                aria-label="Close report modal"
              >
                <X size={18} />
              </button>
            </div>

            <p className="mt-3 text-sm text-white/60">
              Help us keep NotesWallah safe and useful for students.
            </p>

            <div className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="reportReason"
                  className="mb-2 block text-sm text-white/70"
                >
                  Reason
                </label>

                <select
                  id="reportReason"
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-red-500"
                >
                  <option value="">Select a reason</option>
                  <option value="Wrong or misleading content">
                    Wrong or misleading content
                  </option>
                  <option value="Spam or low quality">
                    Spam or low quality
                  </option>
                  <option value="Inappropriate content">
                    Inappropriate content
                  </option>
                  <option value="Copyright issue">Copyright issue</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="reportDetails"
                  className="mb-2 block text-sm text-white/70"
                >
                  Details optional
                </label>

                <textarea
                  id="reportDetails"
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  rows={4}
                  placeholder="Explain the issue briefly..."
                  className="w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-red-500"
                />
              </div>

              <button
                onClick={handleReportSubmit}
                disabled={reporting}
                className="w-full rounded-2xl bg-red-600 px-6 py-4 font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {reporting ? "Submitting..." : "Submit Report"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}