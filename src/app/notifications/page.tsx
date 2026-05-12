"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  Bookmark,
  CheckCircle2,
  FileText,
  Heart,
  MessageCircle,
  RefreshCw,
} from "lucide-react";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "@/firebase/firebase";
import { useAuth } from "@/contexts/AuthContext";
import type { AppNotification } from "@/types/notification";

export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuth();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications]
  );

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    const notificationsQuery = query(
      collection(db, "notifications"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      notificationsQuery,
      async (snap) => {
        const data: AppNotification[] = snap.docs.map((notificationDoc) => ({
          id: notificationDoc.id,
          ...(notificationDoc.data() as Omit<AppNotification, "id">),
        }));

        setNotifications(data);
        setLoading(false);

        const unreadNotifications = data.filter(
          (notification) => !notification.read
        );

        if (unreadNotifications.length > 0) {
          await Promise.all(
            unreadNotifications.map((notification) =>
              updateDoc(doc(db, "notifications", notification.id), {
                read: true,
              })
            )
          );
        }
      },
      (error) => {
        console.error("REALTIME NOTIFICATIONS PAGE ERROR:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, authLoading]);

  function getIcon(type: string) {
    switch (type) {
      case "like":
        return <Heart size={18} className="text-red-400" />;

      case "comment":
        return <MessageCircle size={18} className="text-blue-400" />;

      case "bookmark":
        return <Bookmark size={18} className="text-yellow-300" />;

      default:
        return <Bell size={18} className="text-white" />;
    }
  }

  function formatDate(value: string) {
    if (!value) return "Recently";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "Recently";

    return date.toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  if (loading || authLoading) {
    return (
      <main className="min-h-screen bg-[#050505] px-4 py-8 text-white">
        <div className="mx-auto flex min-h-[70vh] max-w-4xl items-center justify-center">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-white/10 bg-white/5">
              <RefreshCw className="animate-spin text-red-500" size={30} />
            </div>

            <h1 className="mt-5 text-xl font-black">
              Loading notifications
            </h1>

            <p className="mt-2 text-sm text-white/50">
              Checking latest activity on your notes...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050505] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/10 via-white/[0.04] to-red-500/10 p-5 shadow-2xl shadow-black/30 sm:p-7">
          <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-red-500/20 blur-3xl" />

          <div className="relative flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="rounded-3xl bg-red-500/10 p-3 text-red-500 ring-1 ring-red-500/20">
                <Bell size={26} />
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-red-400">
                  Activity Center
                </p>

                <h1 className="mt-1 text-2xl font-black sm:text-4xl">
                  Notifications
                </h1>

                <p className="mt-1 text-sm text-white/55">
                  Likes, comments and saves on your notes appear here.
                </p>
              </div>
            </div>

            <div className="hidden rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-right sm:block">
              <p className="text-2xl font-black">{notifications.length}</p>
              <p className="text-xs text-white/45">Total</p>
            </div>
          </div>

          <div className="relative mt-5 grid grid-cols-2 gap-3 sm:max-w-md">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-xl font-black">{notifications.length}</p>
              <p className="mt-1 text-xs text-white/45">All notifications</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-xl font-black">{unreadCount}</p>
              <p className="mt-1 text-xs text-white/45">New now</p>
            </div>
          </div>
        </section>

        {notifications.length === 0 ? (
          <section className="mt-5 rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 text-center sm:p-12">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-white/5 text-white/35">
              <Bell size={34} />
            </div>

            <h2 className="mt-5 text-2xl font-black">
              No notifications yet
            </h2>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-white/50">
              When someone likes, comments on, or saves your notes, you will see
              the update here.
            </p>
          </section>
        ) : (
          <section className="mt-5 space-y-3 pb-24">
            {notifications.map((notification) => (
              <article
                key={notification.id}
                className={`group rounded-[1.6rem] border p-4 transition active:scale-[0.99] sm:p-5 ${
                  notification.read
                    ? "border-white/10 bg-white/[0.04] hover:bg-white/[0.07]"
                    : "border-red-500/25 bg-red-500/[0.08]"
                }`}
              >
                <div className="flex gap-3 sm:gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-black/30">
                    {getIcon(notification.type)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="line-clamp-2 text-sm font-black sm:text-base">
                          {notification.title || "New notification"}
                        </h2>

                        <p className="mt-1 text-xs text-white/40">
                          {formatDate(notification.createdAt)}
                        </p>
                      </div>

                      {!notification.read && (
                        <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-red-500 shadow-lg shadow-red-500/40" />
                      )}
                    </div>

                    <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-white/60">
                      {notification.message}
                    </p>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      {notification.noteId && (
                        <Link
                          href={`/notes/${notification.noteId}`}
                          className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-xs font-bold text-black transition hover:bg-red-500 hover:text-white"
                        >
                          <FileText size={15} />
                          View Note
                        </Link>
                      )}

                      <span className="inline-flex items-center gap-1 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/45">
                        <CheckCircle2 size={14} />
                        Seen
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}