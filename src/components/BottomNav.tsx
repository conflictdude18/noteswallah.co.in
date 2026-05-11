"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import {
  Bell,
  BookOpen,
  FileText,
  Heart,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  PlusSquare,
  Shield,
  Sparkles,
  User,
  Users,
  X,
} from "lucide-react";

import { auth, db } from "@/firebase/firebase";
import { useAuth } from "@/contexts/AuthContext";

type UserDoc = {
  role?: string;
};

export default function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  const [open, setOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function checkAdmin() {
      if (!user) {
        setIsAdmin(false);
        return;
      }

      try {
        const snap = await getDoc(doc(db, "users", user.uid));

        setIsAdmin(
          snap.exists() && (snap.data() as UserDoc).role === "admin"
        );
      } catch (err) {
        console.error("ADMIN CHECK ERROR:", err);
        setIsAdmin(false);
      }
    }

    checkAdmin();
  }, [user]);

  async function handleLogout() {
    await signOut(auth);
    window.location.href = "/";
  }

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const mainLinks = [
    { href: "/", label: "Home", icon: Home },
    { href: "/browse", label: "Browse", icon: BookOpen },
    {
      href: user ? "/upload" : "/signin",
      label: "Upload",
      icon: PlusSquare,
    },
    {
      href: user ? "/saved-notes" : "/signin",
      label: "Saved",
      icon: Heart,
    },
  ];

  const moreLinks = user
    ? [
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/my-notes", label: "My Notes", icon: FileText },
        { href: "/notifications", label: "Notifications", icon: Bell },
        { href: "/following", label: "Following", icon: Users },
        { href: "/followers", label: "Followers", icon: Users },
        { href: "/feedback", label: "Feedback", icon: MessageSquare },
        { href: "/premium", label: "Premium", icon: Sparkles },
        { href: "/profile", label: "Profile", icon: User },
        ...(isAdmin
          ? [{ href: "/admin", label: "Admin", icon: Shield }]
          : []),
      ]
    : [
        { href: "/signin", label: "Sign In", icon: User },
        { href: "/signup", label: "Create Account", icon: Sparkles },
      ];

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Close menu overlay"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-[9998] bg-black/70 backdrop-blur-sm lg:hidden"
        />
      )}

      <div
        className={`fixed left-0 right-0 bottom-[72px] z-[9999] max-h-[65vh] overflow-hidden rounded-t-[2rem] border-t border-white/10 bg-[#080b10] p-5 shadow-[0_-25px_90px_rgba(0,0,0,0.75)] transition-all duration-300 lg:hidden ${
          open
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-full opacity-0"
        }`}
      >
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-white">More Tools</h2>

            <p className="text-xs font-medium text-white/45">
              Quick access to your NotesWallah tools
            </p>
          </div>

          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="rounded-2xl border border-white/10 bg-white/5 p-2 text-white transition hover:bg-white/10"
          >
            <X size={18} />
          </button>
        </div>

        <div className="no-scrollbar grid max-h-[48vh] gap-3 overflow-y-auto pb-2">
          {moreLinks.map((item) => {
            const Icon = item.icon;

            const active = isActive(item.href);

            const admin = item.href === "/admin";

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={
                  admin
                    ? "flex items-center gap-3 rounded-2xl border border-red-400/40 bg-gradient-to-r from-red-600 via-red-500 to-red-700 px-4 py-3 text-white shadow-[0_0_35px_rgba(239,68,68,0.35)] transition hover:scale-[1.01]"
                    : `flex items-center gap-3 rounded-2xl border px-4 py-3 transition ${
                        active
                          ? "border border-white/10 bg-white/[0.08] text-white shadow-[0_0_18px_rgba(255,255,255,0.06)]"
                          : "border-white/10 bg-white/[0.04] text-white/75 hover:bg-white/[0.07] hover:text-white"
                      }`
                }
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.05]">
                  <Icon size={19} />
                </div>

                <span className="text-sm font-black">
                  {item.label}
                </span>
              </Link>
            );
          })}

          {user && (
            <button
              type="button"
              aria-label="Logout"
              onClick={handleLogout}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-bold text-white/75 transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-200"
            >
              <LogOut size={18} />
              Logout
            </button>
          )}
        </div>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-[10000] border-t border-white/10 bg-[#07090d]/95 px-2 pt-2 pb-3 text-white shadow-[0_-18px_50px_rgba(0,0,0,0.65)] backdrop-blur-xl lg:hidden">
        <div className="grid grid-cols-5 items-center gap-1">
          {mainLinks.map((item) => {
            const Icon = item.icon;

            const active = !open && isActive(item.href);

            const upload = item.label === "Upload";

            return (
              <Link
                key={`${item.href}-${item.label}`}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex flex-col items-center justify-center gap-1 rounded-2xl py-2 transition ${
                  active
                    ? "border border-white/10 bg-white/[0.08] text-white shadow-[0_0_18px_rgba(255,255,255,0.06)]"
                    : "text-white/55 hover:bg-white/[0.04] hover:text-white"
                }`}
              >
                <div
                  className={
                    upload
                      ? "flex h-10 w-10 items-center justify-center rounded-2xl border border-red-400/40 bg-gradient-to-br from-red-500 to-red-700 text-white shadow-[0_0_18px_rgba(239,68,68,0.35)]"
                      : "flex h-6 w-6 items-center justify-center"
                  }
                >
                  <Icon size={upload ? 22 : 21} />
                </div>

                <span className="text-[10px] font-black">
                  {item.label}
                </span>
              </Link>
            );
          })}

          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setOpen((prev) => !prev)}
            className={`flex flex-col items-center justify-center gap-1 rounded-2xl py-2 transition ${
              open
                ? "border border-white/10 bg-white/[0.08] text-white shadow-[0_0_18px_rgba(255,255,255,0.06)]"
                : "text-white/55 hover:bg-white/[0.04] hover:text-white"
            }`}
          >
            <Menu size={21} />

            <span className="text-[10px] font-black">
              More
            </span>
          </button>
        </div>
      </nav>
    </>
  );
}