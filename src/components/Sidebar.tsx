"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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
  MessageSquare,
  PlusCircle,
  Shield,
  Sparkles,
  Trophy,
  Users,
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
  section: "main" | "library" | "tools" | "account";
};

const baseLinks: NavItem[] = [
  { href: "/", label: "Home", icon: Home, section: "main" },
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    section: "main",
  },
  { href: "/browse", label: "Browse Notes", icon: BookOpen, section: "main" },

  { href: "/upload", label: "Upload Notes", icon: PlusCircle, section: "library" },
  { href: "/saved-notes", label: "Saved Notes", icon: Heart, section: "library" },
  { href: "/my-notes", label: "My Notes", icon: FileText, section: "library" },

  { href: "/notique", label: "Notique AI", section: "tools" },
  { href: "/premium", label: "Premium", icon: Sparkles, section: "tools" },
  
  {
  href: "/creators",
  label: "Creators",
  icon: Trophy,
  section: "tools",
},

  { href: "/notifications", label: "Notifications", icon: Bell, section: "account" },
  { href: "/following", label: "Following", icon: Users, section: "account" },
  { href: "/followers", label: "Followers", icon: Users, section: "account" },
  { href: "/feedback", label: "Feedback", icon: MessageSquare, section: "account" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, loading } = useAuth();

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

        if (snap.exists()) {
          const data = snap.data() as UserDoc;
          setIsAdmin(data.role === "admin");
        } else {
          setIsAdmin(false);
        }
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

  const links = useMemo(() => {
    return isAdmin
      ? [
          ...baseLinks,
          { href: "/admin", label: "Admin", icon: Shield, section: "tools" as const },
          {
            href: "/admin/premium-waitlist",
            label: "Premium Waitlist",
            icon: Users,
            section: "tools" as const,
          },
        ]
      : baseLinks;
  }, [isAdmin]);

  async function handleLogout() {
    await signOut(auth);
    window.location.href = "/";
  }

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  function renderIcon(item: NavItem) {
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

    return <Icon size={18} strokeWidth={2.1} />;
  }

  function sectionLinks(section: NavItem["section"]) {
    return links.filter((item) => item.section === section);
  }

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-[290px] flex-col border-r border-white/10 bg-[#050505] text-white lg:flex">
      <div className="border-b border-white/10 px-5 py-5">
        <Link href="/" className="flex items-center gap-3">
          <div className="relative h-10 w-10 overflow-hidden rounded-xl border border-white/10 bg-white/5">
            <Image
              src="/icon.png"
              alt="NotesWallah"
              fill
              sizes="40px"
              className="object-cover"
              priority
            />
          </div>

          <div className="min-w-0">
            <h1 className="truncate text-xl font-black tracking-tight text-white">
              Notes<span className="text-red-500">Wallah</span>
            </h1>

            <p className="text-xs font-medium text-white/40">
              Student Knowledge Network
            </p>
          </div>
        </Link>
      </div>

      <nav className="no-scrollbar flex flex-1 flex-col gap-5 overflow-y-auto px-3 py-4">
        <SidebarSection title="Main">
          {sectionLinks("main").map((item) => (
            <SidebarLink
              key={item.href}
              item={item}
              active={isActive(item.href)}
              unreadCount={unreadCount}
              renderIcon={renderIcon}
            />
          ))}
        </SidebarSection>

        <SidebarSection title="Library">
          {sectionLinks("library").map((item) => (
            <SidebarLink
              key={item.href}
              item={item}
              active={isActive(item.href)}
              unreadCount={unreadCount}
              renderIcon={renderIcon}
            />
          ))}
        </SidebarSection>

        <SidebarSection title="Tools">
          {sectionLinks("tools").map((item) => (
            <SidebarLink
              key={item.href}
              item={item}
              active={isActive(item.href)}
              unreadCount={unreadCount}
              renderIcon={renderIcon}
            />
          ))}
        </SidebarSection>

        <SidebarSection title="Account">
          {sectionLinks("account").map((item) => (
            <SidebarLink
              key={item.href}
              item={item}
              active={isActive(item.href)}
              unreadCount={unreadCount}
              renderIcon={renderIcon}
            />
          ))}
        </SidebarSection>
      </nav>

      <div className="border-t border-white/10 p-4">
        {!loading && user ? (
          <div className="space-y-3">
            <Link
              href="/profile"
              className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#0d0d0d] p-3 transition hover:bg-[#141414]"
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
                <p className="truncate text-sm font-bold text-white">
                  {user.displayName || "NotesWallah User"}
                </p>

                <p className="truncate text-xs text-white/40">
                  {user.email}
                </p>
              </div>
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#0d0d0d] px-4 py-3 text-sm font-bold text-white/65 transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-200"
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

function SidebarSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-2 px-3 text-[11px] font-black uppercase tracking-[0.18em] text-white/30">
        {title}
      </p>

      <div className="space-y-1">{children}</div>
    </div>
  );
}

function SidebarLink({
  item,
  active,
  unreadCount,
  renderIcon,
}: {
  item: NavItem;
  active: boolean;
  unreadCount: number;
  renderIcon: (item: NavItem) => React.ReactNode;
}) {
  const isNotique = item.href === "/notique";
  const isAdminLink = item.href === "/admin";

  return (
    <Link
      href={item.href}
      className={`group flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
        active
          ? "border-red-500/35 bg-red-500/15 text-white"
          : "border-white/10 bg-transparent text-white/62 hover:bg-white/[0.05] hover:text-white"
      }`}
    >
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
          active
            ? "bg-red-500/20 text-red-200"
            : isNotique
              ? "bg-white/[0.05] text-white/55"
              : isAdminLink
                ? "bg-white/[0.05] text-white/55"
                : "bg-white/[0.05] text-white/55"
        }`}
      >
        {renderIcon(item)}
      </span>

      <span className="min-w-0 flex-1 truncate">{item.label}</span>

      {isNotique && !active && (
        <span className="rounded-full border border-red-500/20 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-red-300/70">
          AI
        </span>
      )}

      {isAdminLink && !active && (
        <span className="rounded-full border border-yellow-500/20 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-yellow-300/70">
          Admin
        </span>
      )}

      {item.href === "/notifications" && unreadCount > 0 && (
        <span className="rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-black text-white">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </Link>
  );
}