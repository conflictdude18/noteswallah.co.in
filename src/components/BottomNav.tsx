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

        if (snap.exists()) {
          const data = snap.data() as UserDoc;
          setIsAdmin(data.role === "admin");
        } else {
          setIsAdmin(false);
        }
      } catch (err: unknown) {
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
    { href: user ? "/upload" : "/signin", label: "Upload", icon: PlusSquare },
    { href: user ? "/saved-notes" : "/signin", label: "Saved", icon: Heart },
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
        ...(isAdmin ? [{ href: "/admin", label: "Admin", icon: Shield }] : []),
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
          className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm lg:hidden"
        />
      )}

      <div
        className={`fixed bottom-[92px] left-3 right-3 z-50 overflow-hidden rounded-[2rem] border border-white/10 bg-[#080b10]/95 p-5 shadow-[0_25px_90px_rgba(0,0,0,0.75)] backdrop-blur-2xl transition-all duration-300 lg:hidden ${
          open
            ? "translate-y-0 scale-100 opacity-100"
            : "pointer-events-none translate-y-8 scale-[0.97] opacity-0"
        }`}
      >
        <div className="absolute right-[-80px] top-[-80px] h-56 w-56 rounded-full bg-red-500/15 blur-[90px]" />

        <div className="relative z-10 mb-5 flex items-center justify-between">
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

        <div className="no-scrollbar relative z-10 grid max-h-[55vh] gap-3 overflow-y-auto pb-2">
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
                    ? "group relative flex items-center gap-3 overflow-hidden rounded-2xl border border-red-400/40 bg-gradient-to-r from-red-600 via-red-500 to-red-700 px-4 py-3 text-white shadow-[0_0_35px_rgba(239,68,68,0.35)] transition hover:scale-[1.01]"
                    : `flex items-center gap-3 rounded-2xl border px-4 py-3 transition ${
                        active
                          ? "border-red-500/25 bg-red-500/10 text-red-200"
                          : "border-white/10 bg-white/[0.04] text-white/75 hover:bg-white/[0.07] hover:text-white"
                      }`
                }
              >
                {admin && (
                  <div className="absolute inset-0 translate-x-[-120%] bg-gradient-to-r from-transparent via-white/25 to-transparent transition duration-1000 group-hover:translate-x-[120%]" />
                )}

                <div
                  className={
                    admin
                      ? "relative flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 shadow-inner"
                      : "flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.05]"
                  }
                >
                  <Icon size={19} />
                </div>

                <span className="relative text-sm font-black">
                  {item.label}
                </span>

                {admin && (
                  <span className="relative ml-auto rounded-full bg-black/25 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-red-100">
                    Power
                  </span>
                )}
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

      <div className="fixed bottom-3 left-3 right-3 z-50 rounded-[2rem] border border-white/10 bg-[#07090d]/90 px-2 py-2 shadow-[0_20px_70px_rgba(0,0,0,0.75)] backdrop-blur-2xl lg:hidden">
        <div className="grid grid-cols-5 gap-1">
          {mainLinks.map((item) => {
            const Icon = item.icon;
            const active = !open && isActive(item.href);
            const upload = item.label === "Upload";

            return (
              <Link
                key={`${item.href}-${item.label}`}
                href={item.href}
                className={`relative flex flex-col items-center justify-center gap-1 rounded-[1.4rem] py-2.5 transition ${
                  active
                    ? "bg-red-500/10 text-red-300"
                    : "text-white/45 hover:bg-white/[0.04] hover:text-white"
                } ${upload ? "" : ""}`}
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
            className={`flex flex-col items-center justify-center gap-1 rounded-[1.4rem] py-2.5 transition ${
              open
                ? "bg-red-500/10 text-red-300"
                : "text-white/45 hover:bg-white/[0.04] hover:text-white"
            }`}
          >
            <Menu size={21} />

            <span className="text-[10px] font-black">More</span>
          </button>
        </div>
      </div>
    </>
  );
}