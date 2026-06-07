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
  BookOpen,
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
  const [adminNotificationCount, setAdminNotificationCount] = useState(0);

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

  useEffect(() => {
    if (!user || !isAdmin) {
      setAdminNotificationCount(0);
      return;
    }

    const adminQuery = query(
      collection(db, "adminNotifications"),
      where("read", "==", false)
    );

    const unsubscribe = onSnapshot(adminQuery, (snap) => {
      setAdminNotificationCount(snap.size);
    });

    return () => unsubscribe();
  }, [user, isAdmin]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "auto";

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [open]);

  async function handleLogout() {
    await signOut(auth);
    window.location.href = "/";
  }

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  function renderIcon(item: NavItem, size = 20) {
    if (item.href === "/notique") {
      return (
        <div className="relative h-5 w-5 overflow-hidden rounded-md">
          <Image
            src="/notique-icon.png"
            alt="Notique AI"
            fill
            sizes="20px"
            className="object-contain"
          />
        </div>
      );
    }

    const Icon = item.icon;
    if (!Icon) return null;

    return <Icon size={size} strokeWidth={2.1} />;
  }

  const mainLinks: NavItem[] = [
    { href: "/", label: "Home", icon: Home },
    { href: "/browse", label: "Browse", icon: BookOpen },
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
        { href: "/premium", label: "Premium", icon: Sparkles },
        { href: "/notique", label: "Notique AI" },
        { href: "/profile", label: "Profile", icon: User },
        ...(isAdmin
          ? [
              { href: "/admin", label: "Admin", icon: Shield },
              {
                href: "/admin/notifications",
                label: "Admin Alerts",
                icon: Bell,
                badge: adminNotificationCount,
              },
              {
                href: "/admin/premium-waitlist",
                label: "Premium Waitlist",
                icon: Users,
              },
            ]
          : []),
      ]
    : [
        { href: "/signin", label: "Sign In", icon: User },
        { href: "/signup", label: "Create Account", icon: Sparkles },
        { href: "/creators", label: "Creators", icon: Trophy },
      ];

  const totalBadge = unreadCount + adminNotificationCount;
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
                      {renderIcon(item)}
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
        <nav className="fixed inset-x-0 bottom-0 z-[10000] border-t border-white/10 bg-[#050505]/95 px-2 pb-2 pt-1.5 text-white backdrop-blur-xl lg:hidden">
          <div className="grid grid-cols-5 items-end gap-1">
            {mainLinks.map((item) => {
              const active = !open && isActive(item.href);

              return (
                <Link
                  key={`${item.href}-${item.label}`}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex flex-col items-center justify-center gap-0.5 rounded-xl py-1"
                >
                  <span
                    className={
                      item.special
                        ? "flex h-9 w-9 items-center justify-center rounded-xl bg-red-600 text-white"
                        : active
                          ? "flex h-9 w-9 items-center justify-center rounded-xl bg-white text-black"
                          : "flex h-9 w-9 items-center justify-center rounded-xl text-white/50"
                    }
                  >
                    {renderIcon(item, 19)}
                  </span>

                  <span
                    className={`text-[10px] font-bold ${
                      active || item.special ? "text-white" : "text-white/45"
                    }`}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}

            <button
              type="button"
              aria-label="Open menu"
              onClick={() => setOpen((prev) => !prev)}
              className="relative flex flex-col items-center justify-center gap-0.5 rounded-xl py-1"
            >
              {totalBadge > 0 && !open && (
                <span className="absolute right-5 top-0 z-10 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-black text-white">
                  {totalBadge > 9 ? "9+" : totalBadge}
                </span>
              )}

              <span
                className={
                  open
                    ? "flex h-9 w-9 items-center justify-center rounded-xl bg-white text-black"
                    : "flex h-9 w-9 items-center justify-center rounded-xl text-white/50"
                }
              >
                <Menu size={21} />
              </span>

              <span
                className={`text-[10px] font-bold ${
                  open ? "text-white" : "text-white/45"
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