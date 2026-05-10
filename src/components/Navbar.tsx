"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { signOut } from "firebase/auth";
import { Bell, Menu, X } from "lucide-react";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";

import { auth, db } from "@/firebase/firebase";
import { useAuth } from "@/contexts/AuthContext";

type UserDoc = {
  role?: string;
};

export default function Navbar() {
  const { user, loading } = useAuth();

  const [isAdmin, setIsAdmin] = useState(false);
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  async function handleLogout() {
    await signOut(auth);
    window.location.href = "/";
  }

  useEffect(() => {
    async function checkRole() {
      if (!user) {
        setIsAdmin(false);
        return;
      }

      const snap = await getDoc(doc(db, "users", user.uid));

      if (snap.exists()) {
        const data = snap.data() as UserDoc;
        setIsAdmin(data.role === "admin");
      }
    }

    checkRole();
  }, [user]);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    const unreadQuery = query(
      collection(db, "notifications"),
      where("userId", "==", user.uid),
      where("read", "==", false)
    );

    const unsubscribe = onSnapshot(
      unreadQuery,
      (snap) => {
        setUnreadCount(snap.size);
      },
      (error) => {
        console.error("REALTIME NOTIFICATIONS ERROR:", error);
      }
    );

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "auto";

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [open]);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-xl">
        <div className="container-max flex items-center justify-between py-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative h-10 w-10 overflow-hidden rounded-xl border border-white/10 bg-white/5">
              <Image
                src="/icon.png"
                alt="NotesWallah Logo"
                fill
                sizes="40px"
                className="object-cover"
              />
            </div>

            <div>
              <h1 className="text-lg font-bold text-white">
                Notes<span className="text-red-500">Wallah</span>
              </h1>

              <p className="text-[10px] text-white/40">
                Smart Notes Platform
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 text-sm text-white/70 md:flex">
            <Link href="/browse" className="transition hover:text-white">
              Browse
            </Link>

            <Link href="/following" className="transition hover:text-white">
              Following
            </Link>

            <Link href="/creators" className="transition hover:text-white">
              Creators
            </Link>

            <Link href="/feedback" className="transition hover:text-white">
              Feedback
            </Link>

            {user && (
              <>
                <Link href="/upload" className="transition hover:text-white">
                  Upload
                </Link>

                <Link
                  href="/saved-notes"
                  className="transition hover:text-white"
                >
                  Saved Notes
                </Link>

                <Link href="/my-notes" className="transition hover:text-white">
                  My Notes
                </Link>

                <Link href="/dashboard" className="transition hover:text-white">
                  Dashboard
                </Link>

                <Link href="/profile" className="transition hover:text-white">
                  Profile
                </Link>

                {isAdmin && (
                  <Link
                    href="/admin"
                    className="text-red-400 transition hover:text-red-300"
                  >
                    Admin
                  </Link>
                )}
              </>
            )}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            {!loading && !user && (
              <>
                <Link href="/signin" className="btn-secondary text-sm">
                  Sign In
                </Link>

                <Link href="/signup" className="btn-primary text-sm">
                  Sign Up
                </Link>
              </>
            )}

            {!loading && user && (
              <>
                <Link
                  href="/notifications"
                  className="relative rounded-xl border border-white/10 bg-white/5 p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
                  aria-label="Notifications"
                >
                  <Bell size={20} />

                  {unreadCount > 0 && (
                    <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Link>

                <button
                  onClick={handleLogout}
                  className="btn-primary text-sm"
                >
                  Logout
                </button>
              </>
            )}
          </div>

          <button
            aria-label="Open Menu"
            onClick={() => setOpen(true)}
            className="rounded-lg border border-white/10 bg-white/5 p-2 text-white md:hidden"
          >
            <Menu size={22} />
          </button>
        </div>
      </header>

      <div
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          open
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        className={`fixed left-0 top-0 z-50 h-full w-72 border-r border-white/10 bg-[#0d0d0d] transition-transform duration-300 ease-in-out md:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-white/10 p-5">
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 overflow-hidden rounded-xl border border-white/10">
              <Image
                src="/icon.png"
                alt="NotesWallah Logo"
                fill
                sizes="40px"
                className="object-cover"
              />
            </div>

            <div>
              <h2 className="font-bold text-white">
                Notes<span className="text-red-500">Wallah</span>
              </h2>

              <p className="text-xs text-white/40">
                Student Community
              </p>
            </div>
          </div>

          <button
            aria-label="Close Menu"
            onClick={() => setOpen(false)}
            className="rounded-lg bg-white/10 p-2 text-white"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex flex-col gap-5 p-6 text-sm text-white/70">
          <Link href="/browse" onClick={() => setOpen(false)}>
            Browse Notes
          </Link>

          <Link href="/following" onClick={() => setOpen(false)}>
            Following Feed
          </Link>

          <Link href="/creators" onClick={() => setOpen(false)}>
            Creators
          </Link>

          <Link href="/feedback" onClick={() => setOpen(false)}>
            Feedback
          </Link>

          {user && (
            <>
              <Link href="/notifications" onClick={() => setOpen(false)}>
                <span className="inline-flex items-center gap-2">
                  Notifications

                  {unreadCount > 0 && (
                    <span className="rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </span>
              </Link>

              <Link href="/upload" onClick={() => setOpen(false)}>
                Upload
              </Link>

              <Link href="/saved-notes" onClick={() => setOpen(false)}>
                Saved Notes
              </Link>

              <Link href="/my-notes" onClick={() => setOpen(false)}>
                My Notes
              </Link>

              <Link href="/dashboard" onClick={() => setOpen(false)}>
                Dashboard
              </Link>

              <Link href="/profile" onClick={() => setOpen(false)}>
                Profile
              </Link>

              {isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setOpen(false)}
                  className="text-red-400"
                >
                  Admin
                </Link>
              )}
            </>
          )}

          {!loading && !user && (
            <>
              <Link
                href="/signin"
                onClick={() => setOpen(false)}
                className="btn-secondary text-center"
              >
                Sign In
              </Link>

              <Link
                href="/signup"
                onClick={() => setOpen(false)}
                className="btn-primary text-center"
              >
                Sign Up
              </Link>
            </>
          )}

          {!loading && user && (
            <button
              onClick={handleLogout}
              className="btn-primary mt-3"
            >
              Logout
            </button>
          )}
        </nav>
      </aside>
    </>
  );
}