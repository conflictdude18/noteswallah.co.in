"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { signOut } from "firebase/auth";
import { Menu, X } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/firebase/firebase";
import { useAuth } from "@/contexts/AuthContext";

type UserDoc = {
  role?: string;
};

export default function Navbar() {
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [open, setOpen] = useState(false);

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

  const loggedInLinks = (
    <>
      <Link href="/upload" onClick={() => setOpen(false)} className="hover:text-white transition">
        Upload
      </Link>

      <Link href="/my-notes" onClick={() => setOpen(false)} className="hover:text-white transition">
        My Notes
      </Link>

      <Link href="/saved-notes" onClick={() => setOpen(false)} className="hover:text-white transition">
        Saved Notes
      </Link>

      <Link href="/dashboard" onClick={() => setOpen(false)} className="hover:text-white transition">
        Dashboard
      </Link>

      <Link href="/profile" onClick={() => setOpen(false)} className="hover:text-white transition">
        Profile
      </Link>

      {isAdmin && (
        <Link
          href="/admin"
          onClick={() => setOpen(false)}
          className="text-red-400 hover:text-red-300 transition font-semibold"
        >
          Admin
        </Link>
      )}
    </>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/70 backdrop-blur-xl">
      <div className="container-max flex items-center justify-between py-4">
        <Link href="/" className="text-xl font-bold text-white" onClick={() => setOpen(false)}>
          Notes<span className="text-red-500">Wallah</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm text-white/70">
          <Link href="/browse" className="hover:text-white transition">
            Browse Notes
          </Link>

          {user && loggedInLinks}

          <Link href="/feedback" className="hover:text-white transition">
            Feedback
          </Link>
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {!loading && !user && (
            <>
              <Link href="/signin" className="btn-secondary text-sm px-4 py-2">
                Sign In
              </Link>
              <Link href="/signup" className="btn-primary text-sm px-4 py-2">
                Sign Up
              </Link>
            </>
          )}

          {!loading && user && (
            <>
              <span className="hidden lg:block text-xs text-white/60 max-w-40 truncate">
                {user.email}
              </span>

              <button onClick={handleLogout} className="btn-primary text-sm px-4 py-2">
                Logout
              </button>
            </>
          )}
        </div>

        <button
          type="button"
          aria-label="Toggle navigation menu"
          onClick={() => setOpen((prev) => !prev)}
          className="md:hidden rounded-xl border border-white/10 bg-white/5 p-2 text-white"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-white/10 bg-black/95">
          <div className="container-max flex flex-col gap-4 py-5 text-sm text-white/75">
            <Link href="/browse" onClick={() => setOpen(false)} className="hover:text-white transition">
              Browse Notes
            </Link>

            {user && loggedInLinks}

            <Link href="/feedback" onClick={() => setOpen(false)} className="hover:text-white transition">
              Feedback
            </Link>

            <div className="h-px bg-white/10" />

            {!loading && !user && (
              <div className="flex flex-col gap-3">
                <Link href="/signin" onClick={() => setOpen(false)} className="btn-secondary text-sm">
                  Sign In
                </Link>
                <Link href="/signup" onClick={() => setOpen(false)} className="btn-primary text-sm">
                  Sign Up
                </Link>
              </div>
            )}

            {!loading && user && (
              <div className="flex flex-col gap-3">
                <p className="text-xs text-white/50 truncate">{user.email}</p>
                <button onClick={handleLogout} className="btn-primary text-sm">
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}