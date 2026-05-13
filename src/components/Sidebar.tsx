"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import {
  Bell,
  BookOpen,
  FileText,
  GraduationCap,
  Heart,
  Home,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  PlusCircle,
  Shield,
  Sparkles,
  User,
  Users,
} from "lucide-react";

import { auth, db } from "@/firebase/firebase";
import { useAuth } from "@/contexts/AuthContext";

type UserDoc = {
  role?: string;
};

const baseLinks = [
  { href: "/", label: "Home", icon: Home },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/browse", label: "Browse Notes", icon: BookOpen },
  { href: "/upload", label: "Upload Notes", icon: PlusCircle },
  { href: "/saved-notes", label: "Saved Notes", icon: Heart },
  { href: "/my-notes", label: "My Notes", icon: FileText },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/following", label: "Following", icon: Users },
  { href: "/followers", label: "Followers", icon: Users },
  { href: "/feedback", label: "Feedback", icon: MessageSquare },
  { href: "/premium", label: "Premium", icon: Sparkles },
  { href: "/profile", label: "Profile", icon: User },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, loading } = useAuth();

  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function checkAdmin() {
      if (!user) {
        setIsAdmin(false);
        return;
      }

      const snap = await getDoc(doc(db, "users", user.uid));

      if (snap.exists()) {
        const data = snap.data() as UserDoc;
        setIsAdmin(data.role === "admin");
      } else {
        setIsAdmin(false);
      }
    }

    checkAdmin();
  }, [user]);

  const links = useMemo(() => {
    return isAdmin
      ? [...baseLinks, { href: "/admin", label: "Admin", icon: Shield }]
      : baseLinks;
  }, [isAdmin]);

  async function handleLogout() {
    await signOut(auth);
    window.location.href = "/";
  }

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-[260px] flex-col border-r border-white/10 bg-[#07090d]/90 backdrop-blur-2xl lg:flex">
      <div className="border-b border-white/10 px-5 py-5">
        <Link href="/" className="flex items-center gap-3">
          <div className="relative h-11 w-11 overflow-hidden rounded-2xl border border-red-500/30 bg-red-500/10 shadow-glow">
            <Image
              src="/icon.png"
              alt="NotesWallah"
              fill
              sizes="44px"
              className="object-cover"
              priority
            />
          </div>

          <div className="min-w-0">
            <h1 className="truncate text-xl font-black tracking-tight text-white">
              Notes<span className="text-[#ff2d3d]">Wallah</span>
            </h1>

            <p className="text-xs font-semibold tracking-wide text-white/45">
              Learn. Share. Succeed.
            </p>
          </div>
        </Link>
      </div>

      <nav className="no-scrollbar flex flex-1 flex-col gap-1.5 overflow-y-auto px-3 py-4">
        {links.map((item) => {
          const Icon = item.icon;

          const active =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(`${item.href}/`));

          if (item.href === "/admin") {
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-medium transition-all duration-200 ${
                  active
                    ? "bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 text-white shadow-[0_0_35px_rgba(251,191,36,0.38)]"
                    : "bg-gradient-to-r from-yellow-500/20 via-orange-500/20 to-red-500/20 text-yellow-200 hover:from-yellow-500/30 hover:via-orange-500/30 hover:to-red-500/30 hover:text-white"
                }`}
              >
                <Icon size={18} />
                <span className="truncate font-bold">{item.label}</span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-medium transition-all duration-200 ${
                active
                  ? "bg-gradient-to-r from-[#ff2d3d] to-[#d7192a] text-white shadow-glow"
                  : "text-white/62 hover:bg-white/[0.06] hover:text-white"
              }`}
            >
              <Icon size={18} />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-4">
        {!loading && user ? (
          <div className="space-y-3">
            <Link
              href="/profile"
              className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3 transition hover:bg-white/[0.07]"
            >
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-white/10 bg-red-500/15">
                {user.photoURL ? (
                  <Image
                    src={user.photoURL}
                    alt="Profile"
                    fill
                    sizes="40px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm font-black text-white">
                    {user.email?.charAt(0).toUpperCase() || "U"}
                  </div>
                )}
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-black text-white">
                  {user.displayName || "NotesWallah User"}
                </p>

                <p className="truncate text-xs text-white/45">{user.email}</p>
              </div>
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-bold text-white/75 transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-200"
            >
              <LogOut size={17} />
              Logout
            </button>
          </div>
        ) : (
          <div className="grid gap-3">
            <Link href="/signin" className="btn-secondary w-full">
              Sign In
            </Link>

            <Link href="/signup" className="btn-primary w-full">
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}