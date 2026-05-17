"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCheck,
  Clock,
  ExternalLink,
  Inbox,
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
import LoadingSpinner from "@/components/LoadingSpinner";

type Notification = {
  id: string;
  userId: string;
  type: "follow" | "upload" | "approved" | "rejected" | "admin";
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt?: {
    seconds: number;
    nanoseconds: number;
  };
};

function formatDate(notification: Notification) {
  if (!notification.createdAt?.seconds) return "Just now";

  return new Date(notification.createdAt.seconds * 1000).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function NotificationsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push("/signin");
      return;
    }

    const q = query(
      collection(db, "notifications"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        })) as Notification[];

        setNotifications(data);
        setFetching(false);
      },
      () => {
        setFetching(false);
      }
    );

    return () => unsubscribe();
  }, [user, loading, router]);

  async function markAsRead(id: string) {
    await updateDoc(doc(db, "notifications", id), {
      read: true,
    });
  }

  async function markAllAsRead() {
    const unread = notifications.filter((item) => !item.read);

    await Promise.all(
      unread.map((item) =>
        updateDoc(doc(db, "notifications", item.id), {
          read: true,
        })
      )
    );
  }

  if (loading || fetching) {
    return <LoadingSpinner />;
  }

  const unreadCount = notifications.filter((item) => !item.read).length;

  return (
    <main className="min-h-screen text-white">
      <section className="mx-auto w-full max-w-5xl px-1 py-4 sm:px-4">
        <div className="mb-6 rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-2xl backdrop-blur-xl sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs font-bold text-red-200">
                <Bell size={14} />
                Notifications
              </div>

              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                Your updates
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">
                Follow requests, note approvals, admin alerts, and activity from
                NotesWallah will appear here.
              </p>
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-bold text-white/80 transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-100"
              >
                <CheckCheck size={17} />
                Mark all read
              </button>
            )}
          </div>
        </div>

        {notifications.length === 0 ? (
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-10 text-center backdrop-blur-xl">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.06] text-white/70">
              <Inbox size={26} />
            </div>

            <h2 className="text-xl font-black">No notifications yet</h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/50">
              When someone follows you, your note gets approved, or there is an
              important update, it will show here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((item) => (
              <div
                key={item.id}
                className={`rounded-[1.5rem] border p-4 backdrop-blur-xl transition ${
                  item.read
                    ? "border-white/10 bg-white/[0.035]"
                    : "border-red-500/25 bg-red-500/[0.08] shadow-[0_0_35px_rgba(255,45,61,0.12)]"
                }`}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex gap-3">
                    <div
                      className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
                        item.read
                          ? "bg-white/[0.06] text-white/55"
                          : "bg-red-500/15 text-red-200"
                      }`}
                    >
                      <Bell size={18} />
                    </div>

                    <div>
                      <h3 className="font-black text-white">{item.title}</h3>

                      <p className="mt-1 text-sm leading-6 text-white/60">
                        {item.message}
                      </p>

                      <div className="mt-2 flex items-center gap-2 text-xs text-white/40">
                        <Clock size={13} />
                        {formatDate(item)}
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 gap-2 sm:justify-end">
                    {!item.read && (
                      <button
                        type="button"
                        onClick={() => markAsRead(item.id)}
                        className="rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-xs font-bold text-white/70 transition hover:bg-white/[0.08] hover:text-white"
                      >
                        Mark read
                      </button>
                    )}

                    <Link
                      href={item.link || "/notifications"}
                      onClick={() => {
                        if (!item.read) {
                          markAsRead(item.id);
                        }
                      }}
                      className="inline-flex items-center gap-1 rounded-xl bg-red-500 px-3 py-2 text-xs font-black text-white transition hover:bg-red-600"
                    >
                      Open
                      <ExternalLink size={13} />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}