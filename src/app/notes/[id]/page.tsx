"use client";

import AISummaryCard from "@/components/AISummaryCard";
import { sendNotification } from "@/lib/sendNotification";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
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
  Loader2,
  MessageCircle,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { db } from "@/firebase/firebase";
import { useAuth } from "@/contexts/AuthContext";
import UserAvatar from "@/components/UserAvatar";
import type { Note } from "@/types/note";

import PDFViewer from "@/components/PDFViewer";

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
  const [userData, setUserData] = useState<any>(null);

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
      if (!id) return;

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

    const hasTrackedView = useRef(false);

    useEffect(() => {
      async function increaseViews() {
        if (!id || hasTrackedView.current) return;

        hasTrackedView.current = true;

        try {
          await updateDoc(doc(db, "notes", id), {
            views: increment(1),
          });
        } catch (err) {
          console.error("VIEW UPDATE ERROR:", err);
        }
      }

      increaseViews();
    }, [id]);

        useEffect(() => {
      async function fetchUserData() {
        if (!user) return;

        try {
          const userSnap = await getDoc(doc(db, "users", user.uid));

          if (userSnap.exists()) {
            setUserData(userSnap.data());
          }
        } catch (err) {
          console.error("USER DATA ERROR:", err);
        }
      }

      fetchUserData();
    }, [user]);

  useEffect(() => {
    async function fetchUserActions() {
      if (!user || !id) return;

      try {
        const likesQuery = query(
          collection(db, "likes"),
          where("userId", "==", user.uid),
          where("noteId", "==", id)
        );

        const bookmarksQuery = query(
          collection(db, "bookmarks"),
          where("userId", "==", user.uid),
          where("noteId", "==", id)
        );

        const allLikesQuery = query(
          collection(db, "likes"),
          where("noteId", "==", id)
        );

        const [likesSnap, bookmarksSnap, allLikesSnap] = await Promise.all([
          getDocs(likesQuery),
          getDocs(bookmarksQuery),
          getDocs(allLikesQuery),
        ]);

        setLikeId(likesSnap.docs[0]?.id || null);
        setBookmarkId(bookmarksSnap.docs[0]?.id || null);
        setLikesCount(allLikesSnap.docs.length);
      } catch (err) {
        console.error("USER ACTIONS ERROR:", err);
      }
    }

    fetchUserActions();
  }, [user, id]);

  async function handleCommentSubmit() {
    if (!user) {
      router.push("/signin");
      return;
    }

    if (!note?.id) return;

    if (!commentText.trim()) {
      toast.error("Please write a comment.");
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
      const noteRef = doc(db, "notes", note.id);

      if (likeId) {
        await deleteDoc(doc(db, "likes", likeId));

        await updateDoc(noteRef, {
          likes: increment(-1),
        });

        setLikeId(null);
        setLikesCount((prev) => Math.max(0, prev - 1));
      } else {
        const newLike = await addDoc(collection(db, "likes"), {
          userId: user.uid,
          noteId: note.id,
          noteTitle: note.title,
          createdAt: new Date().toISOString(),
        });

        await updateDoc(noteRef, {
          likes: increment(1),
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
      <div className="flex min-h-[70vh] items-center justify-center text-white">
        <div className="mx-auto flex min-h-[70vh] max-w-6xl items-center justify-center">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-white/10 bg-white/5">
              <RefreshCw className="animate-spin text-red-500" size={30} />
            </div>

            <h1 className="mt-4 text-xl font-black">Loading note</h1>

            <p className="mt-2 text-sm text-white/50">
              Opening PDF and note details...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!note) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050505] px-4 text-white">
        <div className="rounded-3xl border border-white/10  p-8 text-center">
          <FileText size={42} className="mx-auto text-red-400" />
          <h1 className="mt-4 text-3xl font-black">Note Not Found</h1>

          <button
            onClick={() => router.push("/browse")}
            className="mt-8 rounded-2xl bg-red-600 px-6 py-3 font-black text-white transition hover:bg-red-500"
          >
            Back to Browse
          </button>
        </div>
      </main>
    );
  }

  return (
    <div className="pb-28 text-white md:pb-10">
      <div className="mx-auto max-w-7xl7xl pb-32 lg:pb-10">
        <button
          onClick={() => router.push("/browse")}
          className="group inline-flex items-center gap-2 rounded-2xl border border-white/10  px-4 py-2.5 text-sm font-bold text-white/60 transition hover:text-white"
        >
          <ArrowLeft
            size={16}
            className="transition group-hover:-translate-x-1"
          />
          Back
        </button>

        <div className="mt-4 grid gap-5 lg:grid-cols-[1.5fr_0.75fr] lg:gap-8">
          <div className="space-y-5 lg:space-y-6">
            <div className="overflow-hidden rounded-3xl border border-white/10   shadow-black/30">
              <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-black/30 px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="rounded-2xl bg-red-500/10 p-2 text-red-300">
                    <FileText size={18} />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-black">
                      PDF Preview
                    </p>
                    <p className="text-xs text-white/40">
                      Open original if preview does not load.
                    </p>
                  </div>
                </div>
              </div>

          <PDFViewer file={note.pdfURL} />

            </div>
            <section className="rounded-3xl border border-yellow-500/20 bg-yellow-500/5 p-4 md:p-5">
              {/* MOBILE DISCLAIMER */}
              <div className="flex items-center gap-2 md:hidden">
                <div className="rounded-xl bg-yellow-500/10 p-2 text-yellow-400">
                  <AlertTriangle size={16} />
                  
                </div>

                <p className="text-xs leading-relaxed text-white/70">
                  Educational disclaimer: NotesWallah does not claim ownership of
                  third-party content uploaded by users.
                </p>
              </div>

              {/* DESKTOP DISCLAIMER */}
              <div className="hidden md:flex items-start gap-3">
                <div className="rounded-2xl bg-yellow-500/10 p-2 text-yellow-400">
                  <AlertTriangle size={20} />
                </div>

                <div>
                  <h2 className="font-black text-yellow-300">
                    Educational Content Disclaimer
                  </h2>

                  <p className="mt-2 text-sm leading-relaxed text-white/60">
                    NotesWallah is a student-driven platform where students
                    share notes to help each other learn. Some uploaded files may
                    contain watermarks, logos, or references to schools,
                    coaching institutes, websites, or educational organizations.
                    Such materials are shared by users for educational and
                    non-commercial purposes only. NotesWallah does not claim
                    ownership of third-party content, trademarks, or branding. If
                    you are the rightful owner of any material and want it
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

            <section className="rounded-3xl border border-white/10  p-5  sm:p-6">
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
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                />

                <button
                  onClick={handleCommentSubmit}
                  disabled={commenting || !user}
                  className="mt-3 inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-6 py-3 text-sm font-black text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {commenting && <Loader2 size={16} className="animate-spin" />}
                  {commenting ? "Posting..." : "Post Comment"}
                </button>
              </div>

              <div className="mt-8 space-y-4">
                {comments.length === 0 ? (
                  <p className="rounded-2xl border border-white/10 bg-black/25 p-4 text-sm text-white/50">
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
                          className="flex min-w-0 items-center gap-3"
                        >
                          <UserAvatar
                            name={comment.userName}
                            src={comment.userAvatar || ""}
                            size="sm"
                          />

                          <div className="min-w-0">
                            <p className="truncate font-semibold">
                              {comment.userName}
                            </p>
                            <p className="text-xs text-white/40">
                              {formatDate(comment.createdAt)}
                            </p>
                          </div>
                        </Link>

                        {user?.uid === comment.userId && (
                          <button
                            onClick={() => deleteComment(comment.id)}
                            className="shrink-0 rounded-xl border border-red-500/20 bg-red-500/10 p-2 text-red-400 transition hover:bg-red-500/20"
                            aria-label="Delete comment"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>

                      <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-relaxed text-white/70">
                        {comment.text}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          <div className="space-y-5 lg:order-last lg:space-y-6">
            <div className="rounded-3xl border border-white/10  p-5  backdrop-blur-xl sm:p-6">
              <div className="mb-4 inline-flex rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 text-xs font-black text-red-400">
                Verified Study Material
              </div>

              <h1 className="break-words text-2xl font-black leading-tight sm:text-3xl">
                {note.title}
              </h1>

              <p className="mt-4 text-sm leading-relaxed text-white/60">
                {note.description || "No description provided."}
              </p>

              <AISummaryCard
                text={`${note.title || ""}\n\n${note.description || ""}`}
              />

              <div className="mt-6 grid grid-cols-2 gap-3">
                <InfoBox label="Subject" value={note.subject || "N/A"} />
                <InfoBox label="Class" value={note.class || "N/A"} />
                <InfoBox label="Topic" value={note.topic || "N/A"} />
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
                      className="max-w-full truncate rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-6 hidden flex-col gap-3 lg:flex">
                <button
                  onClick={handleDownload}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-6 py-4 font-black text-white transition hover:bg-red-500"
                >
                  <Download size={18} />
                  {user ? "Download PDF" : "Login to Download"}
                </button>

                <button
                  onClick={handleLike}
                  className={`flex items-center justify-center gap-2 rounded-2xl px-6 py-4 font-black transition ${
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
                  className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-6 py-4 font-black text-white transition hover:bg-white/10"
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
                  className="flex items-center justify-center gap-2 rounded-2xl border border-yellow-500/20 bg-yellow-500/10 px-6 py-4 font-black text-yellow-400 transition hover:bg-yellow-500/20"
                >
                  <AlertTriangle size={18} />
                  Report Note
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10  p-5  backdrop-blur-xl sm:p-6">
              <p className="text-xs font-bold uppercase tracking-widest text-white/40">
                Uploaded By
              </p>

              <div className="mt-4 flex items-center gap-4">
                <UserAvatar name={note.uploaderName || "User"} size="md" />

                <div className="min-w-0">
                  <h3 className="truncate font-semibold">
                    {note.uploaderName || "NotesWallah User"}
                  </h3>
                  <p className="text-sm text-white/50">
                    NotesWallah Contributor
                  </p>
                </div>
              </div>

              <button
                onClick={() => router.push(`/profile/${note.uploaderId}`)}
                className="mt-4 w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-black text-white/70 transition hover:bg-white/10 hover:text-white"
              >
                View Profile
              </button>
            </div>

            <div className="rounded-3xl border border-green-500/20 bg-green-500/5 p-5">
              <p className="text-sm font-black text-green-400">
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

      <div className="fixed inset-x-0 bottom-[76px] z-40 border-t border-white/10 bg-[#050505]/95 px-3 pb-4 pt-3 backdrop-blur-xl lg:hidden">
        <div className="flex gap-2">
          <button
            onClick={handleLike}
            className={`flex h-14 flex-1 items-center justify-center rounded-2xl transition ${
              isLiked
                ? "bg-red-600 text-white"
                : "border border-white/10 bg-white/5 text-white"
            }`}
            aria-label="Like note"
          >
            <Heart
              size={19}
              className={isLiked ? "fill-white text-white" : ""}
            />
          </button>

          <button
            onClick={handleBookmark}
            className={`flex h-14 flex-1 items-center justify-center rounded-2xl border border-white/10 ${
              isBookmarked ? "bg-white text-black" : "bg-white/5 text-white"
            }`}
            aria-label="Save note"
          >
            <Bookmark size={19} />
          </button>

          <button
            onClick={handleDownload}
            className="flex h-14 flex-[2] items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 font-black text-white"
          >
            <Download size={18} />
            Download
          </button>
        </div>
      </div>

      {reportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-zinc-950 p-5 text-white  sm:p-6">
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
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 px-6 py-4 font-black text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {reporting && <Loader2 size={18} className="animate-spin" />}
                {reporting ? "Submitting..." : "Submit Report"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/10 bg-black/30 p-4">
      <p className="text-xs text-white/40">{label}</p>
      <p className="mt-1 truncate font-medium">{value}</p>
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Recently";

  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}