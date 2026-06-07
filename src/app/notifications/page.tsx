"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCheck,
  Clock,
  ExternalLink,
  Inbox,
  Megaphone,
  UserPlus,
  UploadCloud,
  CheckCircle2,
  XCircle,
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

function getNotificationIcon(type: Notification["type"]) {
  if (type === "follow") return <UserPlus size={18} />;
  if (type === "upload") return <UploadCloud size={18} />;
  if (type === "approved") return <CheckCircle2 size={18} />;
  if (type === "rejected") return <XCircle size={18} />;
  if (type === "admin") return <Megaphone size={18} />;
  return <Bell size={18} />;
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
      (error) => {
        console.error("NOTIFICATIONS FETCH ERROR:", error);
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

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.read).length,
    [notifications]
  );

  if (loading || fetching) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-5 pb-28 text-white md:pb-10">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] p-5 sm:p-7 lg:p-8">
        <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-red-500/20 blur-3xl" />

        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 text-xs font-black text-red-300">
              <Bell size={15} />
              Notifications
            </div>

            <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-5xl">
              Your updates
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/55 sm:text-base">
              Follow alerts, note activity, approvals and important NotesWallah
              updates appear here.
            </p>
          </div>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllAsRead}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-black text-white transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-100"
            >
              <CheckCheck size={17} />
              Mark all read
            </button>
          )}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <MiniStat label="Total" value={notifications.length} />
        <MiniStat label="Unread" value={unreadCount} active />
        <MiniStat
          label="Admin Alerts"
          value={notifications.filter((item) => item.type === "admin").length}
        />
      </section>

      {notifications.length === 0 ? (
        <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 text-center shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.06] text-white/70">
            <Inbox size={28} />
          </div>

          <h2 className="mt-5 text-xl font-black">No notifications yet</h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/50">
            When someone follows you, your note gets approved, or there is an
            important update, it will appear here.
          </p>
        </section>
      ) : (
        <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-3 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-4">
          <div className="grid gap-3">
            {notifications.map((item) => (
              <article
                key={item.id}
                className={`rounded-[1.5rem] border p-4 transition ${
                  item.read
                    ? "border-white/10 bg-black/20"
                    : "border-red-500/20 bg-red-500/[0.07]"
                }`}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 gap-3">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                        item.read
                          ? "bg-white/[0.06] text-white/55"
                          : "bg-red-500/15 text-red-200"
                      }`}
                    >
                      {getNotificationIcon(item.type)}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-black text-white">{item.title}</h3>

                        {!item.read && (
                          <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-white">
                            New
                          </span>
                        )}
                      </div>

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
                        if (!item.read) markAsRead(item.id);
                      }}
                      className="inline-flex items-center gap-1 rounded-xl bg-red-600 px-3 py-2 text-xs font-black text-white transition hover:bg-red-500"
                    >
                      Open
                      <ExternalLink size={13} />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function MiniStat({
  label,
  value,
  active = false,
}: {
  label: string;
  value: number;
  active?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        active
          ? "border-red-500/20 bg-red-500/10"
          : "border-white/10 bg-white/[0.04]"
      }`}
    >
      <p className="text-xs font-bold text-white/45">{label}</p>
      <p className="mt-2 text-2xl font-black">{value}</p>
    </div>
  );
}