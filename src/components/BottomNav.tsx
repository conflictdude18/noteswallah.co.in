"use client";

import type React from "react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { signOut } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";

import {
  Bell,
  LibraryBig,
  FileText,
  Heart,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Plus,
  Shield,
  Sparkles,
  Trophy,
  User,
  Users,
  X,
} from "lucide-react";

import { auth, db } from "@/firebase/firebase";
import { useAuth } from "@/contexts/AuthContext";

type UserDoc = {
  role?: string;
};

type NavItem = {
  href: string;
  label: string;
  icon?: React.ElementType;
  badge?: number;
  special?: boolean;
};

export default function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  const [open, setOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    async function checkAdmin() {
      if (!user) {
        setIsAdmin(false);
        return;
      }

      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        setIsAdmin(snap.exists() && (snap.data() as UserDoc).role === "admin");
      } catch (err) {
        console.error("ADMIN CHECK ERROR:", err);
        setIsAdmin(false);
      }
    }

    checkAdmin();
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

    const unsubscribe = onSnapshot(unreadQuery, (snap) => {
      setUnreadCount(snap.size);
    });

    return () => unsubscribe();
  }, [user]);

  async function handleLogout() {
    await signOut(auth);
    window.location.href = "/";
  }

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  function renderIcon(item: NavItem, size = 28) {
    if (item.href === "/notique") {
      return (
        <div className="relative h-6 w-6 overflow-hidden rounded-md">
          <Image
            src="/notique-icon.png"
            alt="Notique AI"
            fill
            sizes="24px"
            className="object-contain"
          />
        </div>
      );
    }

    const Icon = item.icon;
    if (!Icon) return null;

    return <Icon size={size} strokeWidth={2.15} />;
  }

  const mainLinks: NavItem[] = [
    { href: "/", label: "Home", icon: Home },
    { href: "/browse", label: "Browse", icon: LibraryBig },
    {
      href: user ? "/upload" : "/signin",
      label: "Upload",
      icon: Plus,
      special: true,
    },
    {
      href: user ? "/saved-notes" : "/signin",
      label: "Saved",
      icon: Heart,
    },
  ];

  const moreLinks: NavItem[] = user
    ? [
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/creators", label: "Creators", icon: Trophy },
        { href: "/my-notes", label: "My Notes", icon: FileText },
        {
          href: "/notifications",
          label: "Notifications",
          icon: Bell,
          badge: unreadCount,
        },
        { href: "/following", label: "Following Feed", icon: Users },
        { href: "/followers", label: "Followers", icon: Users },
        { href: "/feedback", label: "Feedback", icon: MessageSquare },
        { href: "/notique", label: "Notique AI" },
        { href: "/profile", label: "Profile", icon: User },
        ...(isAdmin
          ? [
              { href: "/admin", label: "Admin", icon: Shield },
              {
                href: "/admin/alerts",
                label: "Admin Alerts",
                icon: Bell,
              },
            ]
          : []),
      ]
    : [
        { href: "/signin", label: "Sign In", icon: User },
        { href: "/signup", label: "Create Account", icon: Sparkles },
        { href: "/creators", label: "Creators", icon: Trophy },
      ];

  const hideBottomNav = pathname.startsWith("/notique");

  return (
    <>
      {!hideBottomNav && open && (
        <section className="fixed inset-0 z-[9999] flex flex-col overflow-hidden bg-[#050505] text-white lg:hidden">
          <header className="border-b border-white/10 px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black tracking-tight">Menu</h2>
                <p className="mt-0.5 text-xs font-medium text-white/45">
                  Navigation, account and tools
                </p>
              </div>

              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white"
              >
                <X size={21} />
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto px-3 py-4 pb-28">
            <div className="grid grid-cols-1 gap-2">
              {moreLinks.map((item) => {
                const active = isActive(item.href);
                const badge = typeof item.badge === "number" ? item.badge : 0;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`relative flex min-h-[58px] items-center gap-3 rounded-xl border px-3 py-2.5 transition ${
                      active
                        ? "border-white/15 bg-white/[0.08] text-white"
                        : "border-white/10 bg-[#0d0d0d] text-white/70"
                    }`}
                  >
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                        active
                          ? "bg-white text-black"
                          : "bg-white/[0.06] text-white/60"
                      }`}
                    >
                      {renderIcon(item, 22)}
                    </span>

                    <span className="min-w-0 flex-1 text-sm font-bold">
                      {item.label}
                    </span>

                    {badge > 0 && (
                      <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-red-600 px-2 text-[10px] font-black text-white">
                        {badge > 9 ? "9+" : badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>

            {user && (
              <button
                type="button"
                aria-label="Logout"
                onClick={handleLogout}
                className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#0d0d0d] text-sm font-bold text-white/70"
              >
                <LogOut size={20} />
                Logout
              </button>
            )}
          </div>
        </section>
      )}

      {!hideBottomNav && (
        <nav className="fixed bottom-0 left-0 right-0 z-[10000] border-t border-white/10 bg-[#050505]/95 px-2 pb-2 pt-2 text-white backdrop-blur-xl lg:hidden">
          <div className="flex w-full items-end">
            {mainLinks.map((item) => {
              const active = !open && isActive(item.href);

              return (
                <Link
                  key={`${item.href}-${item.label}`}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="relative flex h-[58px] w-1/5 shrink-0 flex-col items-center justify-center gap-1 rounded-xl"
                >
                  {active && !item.special && (
                    <span className="absolute top-0 h-1 w-8 rounded-full bg-red-500" />
                  )}

                  <span
                    className={
                      item.special
                        ? "flex h-12 w-12 items-center justify-center rounded-2xl bg-red-600 text-white shadow-lg shadow-red-950/40"
                        : active
                          ? "flex h-8 w-8 items-center justify-center text-white"
                          : "flex h-8 w-8 items-center justify-center text-white/45"
                    }
                  >
                    {renderIcon(item, item.special ? 28 : 25)}
                  </span>

                {!item.special && (
                  <span
                    className={`text-[10px] font-black leading-none ${
                      active ? "text-white" : "text-white/40"
                    }`}
                  >
                    {item.label}
                  </span>
                )}
                </Link>
              );
            })}

            <button
              type="button"
              aria-label="Open menu"
              onClick={() => setOpen((prev) => !prev)}
              className="relative flex h-[58px] w-1/5 shrink-0 flex-col items-center justify-center gap-1 rounded-xl"
            >
              {unreadCount > 0 && !open && (
                <span className="absolute right-5 top-1 z-10 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-black text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}

              {open && <span className="absolute top-0 h-1 w-8 rounded-full bg-red-500" />}

              <span
                className={
                  open
                    ? "flex h-8 w-8 items-center justify-center text-white"
                    : "flex h-8 w-8 items-center justify-center text-white/45"
                }
              >
                <Menu size={25} strokeWidth={2.4} />
              </span>

              <span
                className={`text-[10px] font-black leading-none ${
                  open ? "text-white" : "text-white/40"
                }`}
              >
                More
              </span>
            </button>
          </div>
        </nav>
      )}
    </>
  );
}