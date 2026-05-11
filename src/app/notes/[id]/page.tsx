"use client";

import { sendNotification } from "@/lib/sendNotification";
import Link from "next/link";
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
  Heart,
  MessageCircle,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { db } from "@/firebase/firebase";
import { useAuth } from "@/contexts/AuthContext";
import UserAvatar from "@/components/UserAvatar";
import type { Note } from "@/types/note";

type Comment = {
  id: string;
  noteId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
  createdAt: string;
};

export default function NoteDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);

  const [bookmarkId, setBookmarkId] = useState<string | null>(null);
  const isBookmarked = Boolean(bookmarkId);

  const [likeId, setLikeId] = useState<string | null>(null);
  const [likesCount, setLikesCount] = useState(0);
  const isLiked = Boolean(likeId);

  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [commenting, setCommenting] = useState(false);

  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [reporting, setReporting] = useState(false);

  async function fetchComments() {
    if (!id) return;

    try {
      const q = query(collection(db, "comments"), where("noteId", "==", id));
      const snap = await getDocs(q);

      const data: Comment[] = snap.docs
        .map((commentDoc) => ({
          id: commentDoc.id,
          ...(commentDoc.data() as Omit<Comment, "id">),
        }))
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

      setComments(data);
    } catch (err) {
      console.error("COMMENTS FETCH ERROR:", err);
    }
  }

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
    fetchComments();
  }, [id]);

  useEffect(() => {
    async function checkBookmarkAndLikes() {
      if (!id) return;

      try {
        const likesQuery = query(
          collection(db, "likes"),
          where("noteId", "==", id)
        );

        const likesSnap = await getDocs(likesQuery);
        setLikesCount(likesSnap.docs.length);

        if (!user) return;

        const bookmarkQuery = query(
          collection(db, "bookmarks"),
          where("userId", "==", user.uid),
          where("noteId", "==", id)
        );

        const bookmarkSnap = await getDocs(bookmarkQuery);
        setBookmarkId(bookmarkSnap.empty ? null : bookmarkSnap.docs[0].id);

        const userLikeQuery = query(
          collection(db, "likes"),
          where("userId", "==", user.uid),
          where("noteId", "==", id)
        );

        const userLikeSnap = await getDocs(userLikeQuery);
        setLikeId(userLikeSnap.empty ? null : userLikeSnap.docs[0].id);
      } catch (err) {
        console.error("NOTE SOCIAL FETCH ERROR:", err);
      }
    }

    checkBookmarkAndLikes();
  }, [user, id]);

  async function handleCommentSubmit() {
    if (!user) {
      router.push("/signin");
      return;
    }

    if (!note?.id) return;

    if (!commentText.trim()) {
      toast.error("Comment cannot be empty.");
      return;
    }

    if (commentText.trim().length > 500) {
      toast.error("Comment must be under 500 characters.");
      return;
    }

    try {
      setCommenting(true);

      await addDoc(collection(db, "comments"), {
        noteId: note.id,
        userId: user.uid,
        userName: user.displayName || user.email || "User",
        userAvatar: user.photoURL || "",
        text: commentText.trim(),
        createdAt: new Date().toISOString(),
      });

      if (note.uploaderId && note.uploaderId !== user.uid) {
        await sendNotification({
          userId: note.uploaderId,
          title: "New Comment 💬",
          message: `${user.displayName || user.email || "Someone"} commented on your note "${note.title}".`,
          type: "comment",
          noteId: note.id,
        });
      }

      setCommentText("");
      toast.success("Comment added.");
      fetchComments();
    } catch (err) {
      console.error("COMMENT ERROR:", err);
      toast.error("Failed to add comment.");
    } finally {
      setCommenting(false);
    }
  }

  async function deleteComment(commentId: string) {
    const ok = confirm("Delete this comment?");
    if (!ok) return;

    try {
      await deleteDoc(doc(db, "comments", commentId));
      toast.success("Comment deleted.");
      fetchComments();
    } catch (err) {
      console.error("DELETE COMMENT ERROR:", err);
      toast.error("Failed to delete comment.");
    }
  }

  async function handleLike() {
    if (!user) {
      router.push("/signin");
      return;
    }

    if (!note?.id) return;

    try {
      if (likeId) {
        await deleteDoc(doc(db, "likes", likeId));
        setLikeId(null);
        setLikesCount((prev) => Math.max(0, prev - 1));
      } else {
        const newLike = await addDoc(collection(db, "likes"), {
          userId: user.uid,
          noteId: note.id,
          noteTitle: note.title,
          createdAt: new Date().toISOString(),
        });

        if (note.uploaderId && note.uploaderId !== user.uid) {
          await sendNotification({
            userId: note.uploaderId,
            title: "New Like ❤️",
            message: `${user.displayName || user.email || "Someone"} liked your note "${note.title}".`,
            type: "like",
            noteId: note.id,
          });
        }

        setLikeId(newLike.id);
        setLikesCount((prev) => prev + 1);
      }
    } catch (err) {
      console.error("LIKE ERROR:", err);
      toast.error("Like action failed.");
    }
  }

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

        if (note.uploaderId && note.uploaderId !== user.uid) {
          await sendNotification({
            userId: note.uploaderId,
            title: "New Save 🔖",
            message: `${user.displayName || user.email || "Someone"} saved your note "${note.title}".`,
            type: "bookmark",
            noteId: note.id,
          });
        }

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
          <ArrowLeft size={16} className="transition group-hover:-translate-x-1" />
          Back to Browse
        </button>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.5fr_0.7fr]">
          <div className="space-y-8">
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

            <section className="rounded-3xl border border-yellow-500/20 bg-yellow-500/5 p-5">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-yellow-500/10 p-2 text-yellow-400">
                  <AlertTriangle size={20} />
                </div>

                <div>
                  <h2 className="font-black text-yellow-300">
                    Educational Content Disclaimer
                  </h2>

                  <p className="mt-2 text-sm leading-relaxed text-white/60">
                    NotesWallah is a student-driven platform where students
                    share notes to help each other learn. Some uploaded files
                    may contain watermarks, logos, or references to schools,
                    coaching institutes, websites, or educational organizations.
                    Such materials are shared by users for educational and
                    non-commercial purposes only. NotesWallah does not claim
                    ownership of third-party content, trademarks, or branding.
                    If you are the rightful owner of any material and want it
                    reviewed or removed, contact us at{" "}
                    <a
                      href="mailto:legal@noteswallah.co.in"
                      className="font-semibold text-yellow-300 underline-offset-4 hover:underline"
                    >
                      legal@noteswallah.co.in
                    </a>
                    .
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-center gap-3">
                <MessageCircle className="text-red-500" size={22} />
                <h2 className="text-2xl font-black">
                  Comments ({comments.length})
                </h2>
              </div>

              <div className="mt-6">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder={
                    user
                      ? "Ask a question or share feedback..."
                      : "Login to comment..."
                  }
                  rows={3}
                  disabled={!user}
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                />

                <button
                  onClick={handleCommentSubmit}
                  disabled={commenting || !user}
                  className="mt-3 rounded-2xl bg-red-600 px-6 py-3 font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {commenting ? "Posting..." : "Post Comment"}
                </button>
              </div>

              <div className="mt-8 space-y-4">
                {comments.length === 0 ? (
                  <p className="text-sm text-white/50">
                    No comments yet. Be the first to comment.
                  </p>
                ) : (
                  comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="rounded-2xl border border-white/10 bg-black/30 p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <Link
                          href={`/profile/${comment.userId}`}
                          className="flex items-center gap-3"
                        >
                          <UserAvatar
                            name={comment.userName}
                            src={comment.userAvatar || ""}
                            size="sm"
                          />

                          <div>
                            <p className="font-semibold">{comment.userName}</p>
                            <p className="text-xs text-white/40">
                              {new Date(comment.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </Link>

                        {user?.uid === comment.userId && (
                          <button
                            onClick={() => deleteComment(comment.id)}
                            className="rounded-xl border border-red-500/20 bg-red-500/10 p-2 text-red-400 transition hover:bg-red-500/20"
                            aria-label="Delete comment"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>

                      <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-white/70">
                        {comment.text}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </section>
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
                <InfoBox label="Subject" value={note.subject} />
                <InfoBox label="Class" value={note.class} />
                <InfoBox label="Topic" value={note.topic} />
                <InfoBox
                  label="Downloads"
                  value={String(note.downloadsCount ?? 0)}
                />
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4">
                <p className="text-xs text-white/40">Likes</p>
                <p className="mt-1 font-medium">{likesCount}</p>
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
                  onClick={handleLike}
                  className={`flex items-center justify-center gap-2 rounded-2xl px-6 py-4 font-medium transition ${
                    isLiked
                      ? "border border-red-500/30 bg-red-500/10 text-red-400"
                      : "border border-white/10 bg-white/5 text-white hover:bg-white/10"
                  }`}
                >
                  <Heart
                    size={18}
                    className={isLiked ? "fill-red-500 text-red-500" : ""}
                  />
                  {isLiked ? `Liked (${likesCount})` : `Like (${likesCount})`}
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
                <UserAvatar name={note.uploaderName || "User"} size="md" />

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

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
      <p className="text-xs text-white/40">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}