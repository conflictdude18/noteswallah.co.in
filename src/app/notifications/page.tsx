"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Bell,
  Bookmark,
  FileText,
  Heart,
  MessageCircle,
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
  const { user } = useAuth();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

        await Promise.all(
          unreadNotifications.map((notification) =>
            updateDoc(doc(db, "notifications", notification.id), {
              read: true,
            })
          )
        );
      },
      (error) => {
        console.error("REALTIME NOTIFICATIONS PAGE ERROR:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  function getIcon(type: string) {
    switch (type) {
      case "like":
        return <Heart size={18} className="text-red-500" />;

      case "comment":
        return <MessageCircle size={18} className="text-blue-400" />;

      case "bookmark":
        return <Bookmark size={18} className="text-yellow-400" />;

      default:
        return <Bell size={18} className="text-white" />;
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505] text-white">
        <div className="text-center">
          <div className="mx-auto h-14 w-14 animate-spin rounded-full border-4 border-red-500 border-t-transparent" />
          <p className="mt-5 text-white/60">
            Loading notifications...
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <div className="container-max py-10">
        <div className="mb-8 flex items-center gap-3">
          <div className="rounded-2xl bg-red-500/10 p-3 text-red-500">
            <Bell size={24} />
          </div>

          <div>
            <h1 className="text-3xl font-black">Notifications</h1>
            <p className="text-sm text-white/50">
              Stay updated with activity on your notes.
            </p>
          </div>
        </div>

        {notifications.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center">
            <Bell size={42} className="mx-auto text-white/30" />

            <h2 className="mt-4 text-2xl font-bold">
              No Notifications Yet
            </h2>

            <p className="mt-2 text-sm text-white/50">
              Likes, comments and saves will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`rounded-3xl border p-5 transition ${
                  notification.read
                    ? "border-white/10 bg-white/5"
                    : "border-red-500/20 bg-red-500/5"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
                    {getIcon(notification.type)}
                  </div>

                  <div className="flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h2 className="font-bold">
                        {notification.title}
                      </h2>

                      <p className="text-xs text-white/40">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>

                    <p className="mt-2 text-sm leading-relaxed text-white/60">
                      {notification.message}
                    </p>

                    {notification.noteId && (
                      <Link
                        href={`/notes/${notification.noteId}`}
                        className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
                      >
                        <FileText size={16} />
                        View Note
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}