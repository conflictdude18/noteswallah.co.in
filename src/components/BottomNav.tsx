"use client";

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
  BrainCircuit,
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

        setIsAdmin(
          snap.exists() &&
            (snap.data() as UserDoc).role === "admin"
        );
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

    const q = query(
      collection(db, "adminNotifications"),
      where("read", "==", false)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
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

  const mainLinks = [
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

  const moreLinks = user
    ? [
        {
          href: "/dashboard",
          label: "Dashboard",
          icon: LayoutDashboard,
        },
        {
          href: "/my-notes",
          label: "My Notes",
          icon: FileText,
        },
        {
          href: "/notifications",
          label: "Notifications",
          icon: Bell,
          badge: unreadCount,
        },
        {
          href: "/following",
          label: "Following Feed",
          icon: Users,
        },
        {
          href: "/followers",
          label: "Followers",
          icon: Users,
        },
        {
          href: "/feedback",
          label: "Feedback",
          icon: MessageSquare,
        },
        {
          href: "/premium",
          label: "Premium",
          icon: Sparkles,
        },
        {
          href: "/ai-summary",
          label: "Notique AI",
          icon: BrainCircuit,
        },
        {
          href: "/profile",
          label: "Profile",
          icon: User,
        },

        ...(isAdmin
          ? [
              {
                href: "/admin",
                label: "Admin",
                icon: Shield,
              },
              {
                href: "/admin/notifications",
                label: "Admin Alerts",
                icon: Bell,
                badge: adminNotificationCount,
              },
            ]
          : []),
      ]
    : [
        {
          href: "/signin",
          label: "Sign In",
          icon: User,
        },
        {
          href: "/signup",
          label: "Create Account",
          icon: Sparkles,
        },
      ];

  return (
    <>
      {open && (
        <section className="fixed inset-0 z-[9999] flex flex-col overflow-hidden bg-[#050505] text-white lg:hidden">
          <div className="border-b border-white/10 px-5 pb-4 pt-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black">More</h2>

                <p className="mt-1 text-xs font-semibold text-white/45">
                  Account, activity and tools
                </p>
              </div>

              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setOpen(false)}
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-white"
              >
                <X size={22} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-5 pb-32">
            <div className="grid grid-cols-2 gap-3">
              {moreLinks.map((item) => {
                const Icon = item.icon;

                const active = isActive(item.href);

                const admin =
                  item.href === "/admin" ||
                  item.href === "/admin/notifications";

                const ai = item.href === "/ai-summary";

                const badge =
                  "badge" in item &&
                  typeof item.badge === "number"
                    ? item.badge
                    : 0;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={
                      ai
                        ? "relative flex min-h-[112px] flex-col justify-between overflow-hidden rounded-3xl border border-cyan-400/40 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.35),transparent_45%),linear-gradient(135deg,#0f172a,#111827,#0b1120)] p-4 text-white shadow-[0_0_45px_rgba(34,211,238,0.35)]"
                        : admin
                        ? "relative flex min-h-[112px] flex-col justify-between rounded-3xl border border-red-400/40 bg-gradient-to-br from-red-600 to-red-800 p-4 text-white shadow-[0_0_30px_rgba(239,68,68,0.25)]"
                        : `relative flex min-h-[112px] flex-col justify-between rounded-3xl border p-4 transition ${
                            active
                              ? "border-white/15 bg-white/[0.09] text-white"
                              : "border-white/10 bg-white/[0.04] text-white/75"
                          }`
                    }
                  >
                    {Boolean(badge) && badge > 0 && (
                      <span className="absolute right-3 top-3 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-black text-white">
                        {badge > 9 ? "9+" : badge}
                      </span>
                    )}

                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/[0.08]">
                      <div className="relative h-[22px] w-[22px] overflow-hidden rounded-md">
                        <Image
                          src="/notique-white.png"
                          alt="Notique AI"
                          fill
                          sizes="86px"
                          className="object-contain"
                        />
                      </div>
                    </span>

                    <div>
                      <span className="block text-sm font-black">
                        {item.label}
                      </span>

                      {ai && (
                        <span className="mt-1 block text-[10px] font-bold uppercase tracking-wider text-cyan-300">
                          Powered by AI
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>

            {user && (
              <button
                type="button"
                aria-label="Logout"
                onClick={handleLogout}
                className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] text-sm font-black text-white/75"
              >
                <LogOut size={22} />
                Logout
              </button>
            )}
          </div>
        </section>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-[10000] border-t border-white/10 bg-[#050505]/95 px-2 pb-3 pt-2 text-white shadow-[0_-18px_50px_rgba(0,0,0,0.7)] backdrop-blur-xl lg:hidden">
        <div className="grid grid-cols-5 items-end gap-1">
          {mainLinks.map((item) => {
            const Icon = item.icon;

            const active = !open && isActive(item.href);

            return (
              <Link
                key={`${item.href}-${item.label}`}
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex flex-col items-center justify-center gap-1 rounded-2xl py-1"
              >
                <span
                  className={
                    item.special
                      ? "flex h-10 w-10 items-center justify-center rounded-2xl bg-red-600 text-white shadow-lg shadow-red-600/35"
                      : active
                      ? "flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-black"
                      : "flex h-10 w-10 items-center justify-center rounded-2xl text-white/50"
                  }
                >
                  <Icon size={20} />
                </span>

                <span
                  className={`text-[10px] font-black ${
                    active || item.special
                      ? "text-white"
                      : "text-white/45"
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
            className="relative flex flex-col items-center justify-center gap-1 rounded-2xl py-1"
          >
            {((user && unreadCount > 0) ||
              (isAdmin && adminNotificationCount > 0)) &&
              !open && (
                <span className="absolute right-5 top-0 z-10 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-black text-white">
                  {unreadCount + adminNotificationCount > 9
                    ? "9+"
                    : unreadCount + adminNotificationCount}
                </span>
              )}

            <span
              className={
                open
                  ? "flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-black"
                  : "flex h-10 w-10 items-center justify-center rounded-2xl text-white/50"
              }
            >
              <Menu size={22} />
            </span>

            <span
              className={`text-[10px] font-black ${
                open ? "text-white" : "text-white/45"
              }`}
            >
              More
            </span>
          </button>
        </div>
      </nav>
    </>
  );
}