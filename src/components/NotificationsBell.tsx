"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import {
  collection,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";

import { db } from "@/firebase/firebase";
import { useAuth } from "@/contexts/AuthContext";

export default function NotificationsBell() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "notifications"),
      where("userId", "==", user.uid),
      where("read", "==", false)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUnreadCount(snapshot.size);
    });

    return () => unsubscribe();
  }, [user]);

  if (!user) return null;

  return (
    <Link
      href="/notifications"
      className="fixed right-4 top-4 z-50 hidden h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-white shadow-lg backdrop-blur-xl transition hover:bg-white/15 lg:flex lg:right-8 lg:top-6"
      aria-label="Notifications"
    >
      <Bell size={20} />

      {unreadCount > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-black text-white shadow-lg">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </Link>
  );
}