"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { signOut } from "firebase/auth";
import { auth, db } from "@/firebase/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { doc, getDoc } from "firebase/firestore";

type UserDoc = {
  role?: string;
};

export default function Navbar() {
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

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

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/60 backdrop-blur">
      <div className="container-max flex items-center justify-between py-4">
        <Link href="/" className="text-xl font-bold text-white">
          Notes<span className="text-red-500">Wallah</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm text-white/70">
          <Link href="/browse" className="hover:text-white transition">
            Browse Notes
          </Link>

          {user && (
            <>
              <Link href="/upload" className="hover:text-white transition">
                Upload
              </Link>

              <Link href="/my-notes" className="hover:text-white transition">
                My Notes
              </Link>

              <Link href="/dashboard" className="hover:text-white transition">
                Dashboard
              </Link>

              <Link href="/profile" className="hover:text-white transition">
                Profile
              </Link>

              {isAdmin && (
                <Link
                  href="/admin"
                  className="text-red-400 hover:text-red-300 transition font-semibold"
                >
                  Admin
                </Link>
              )}
            </>
          )}

          <Link href="/feedback" className="hover:text-white transition">
            Feedback
          </Link>
        </nav>

        <div className="flex items-center gap-3">
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
              <span className="hidden sm:block text-xs text-white/60">
                {user.email}
              </span>

              <button
                onClick={handleLogout}
                className="btn-primary text-sm px-4 py-2"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}