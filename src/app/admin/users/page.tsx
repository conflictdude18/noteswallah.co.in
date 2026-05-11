"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import {
  ArrowLeft,
  Ban,
  RefreshCw,
  RotateCcw,
  Search,
  Shield,
  ShieldCheck,
  UserCog,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/firebase/firebase";

type UserDoc = {
  id: string;
  name?: string;
  displayName?: string;
  email?: string;
  role?: string;
  bio?: string;
  occupation?: string;
  photoURL?: string;
  avatarUrl?: string;
  strikes?: number;
  banned?: boolean;
  banReason?: string;
};

export default function AdminUsersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [users, setUsers] = useState<UserDoc[]>([]);
  const [fetching, setFetching] = useState(true);
  const [search, setSearch] = useState("");
  const [actionUserId, setActionUserId] = useState<string | null>(null);

  useEffect(() => {
    async function checkAdmin() {
      if (!user) return;

      setChecking(true);

      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        const data = snap.data() as UserDoc | undefined;
        setIsAdmin(data?.role === "admin");
      } catch (err) {
        console.error("ADMIN CHECK ERROR:", err);
        toast.error("Failed to verify admin access.");
      } finally {
        setChecking(false);
      }
    }

    if (!loading && !user) {
      router.push("/signin");
      return;
    }

    if (user) checkAdmin();
  }, [user, loading, router]);

  async function fetchUsers() {
    setFetching(true);

    try {
      const snap = await getDocs(collection(db, "users"));

      const data: UserDoc[] = snap.docs.map((document) => ({
        id: document.id,
        ...(document.data() as Omit<UserDoc, "id">),
      }));

      data.sort((a, b) => (b.strikes ?? 0) - (a.strikes ?? 0));

      setUsers(data);
    } catch (err) {
      console.error("USERS FETCH ERROR:", err);
      toast.error("Failed to load users.");
    } finally {
      setFetching(false);
    }
  }

  useEffect(() => {
    if (isAdmin) fetchUsers();
  }, [isAdmin]);

  async function banUser(targetUser: UserDoc) {
    const ok = confirm(`Ban ${targetUser.email || targetUser.name || "this user"} from uploading?`);
    if (!ok) return;

    setActionUserId(targetUser.id);

    try {
      await updateDoc(doc(db, "users", targetUser.id), {
        banned: true,
        banReason: "Upload access blocked by admin.",
      });

      toast.success("User banned from uploading.");
      await fetchUsers();
    } catch (err) {
      console.error("BAN USER ERROR:", err);
      toast.error("Failed to ban user.");
    } finally {
      setActionUserId(null);
    }
  }

  async function unbanUser(targetUser: UserDoc) {
    setActionUserId(targetUser.id);

    try {
      await updateDoc(doc(db, "users", targetUser.id), {
        banned: false,
        banReason: "",
      });

      toast.success("User unbanned.");
      await fetchUsers();
    } catch (err) {
      console.error("UNBAN USER ERROR:", err);
      toast.error("Failed to unban user.");
    } finally {
      setActionUserId(null);
    }
  }

  async function resetStrikes(targetUser: UserDoc) {
    const ok = confirm(`Reset strikes for ${targetUser.email || targetUser.name || "this user"}?`);
    if (!ok) return;

    setActionUserId(targetUser.id);

    try {
      await updateDoc(doc(db, "users", targetUser.id), {
        strikes: 0,
        banned: false,
        banReason: "",
      });

      toast.success("Strikes reset.");
      await fetchUsers();
    } catch (err) {
      console.error("RESET STRIKES ERROR:", err);
      toast.error("Failed to reset strikes.");
    } finally {
      setActionUserId(null);
    }
  }

  async function makeAdmin(targetUser: UserDoc) {
  const ok = confirm(`Make ${targetUser.email || targetUser.name || "this user"} an admin?`);
  if (!ok) return;

  setActionUserId(targetUser.id);

  try {
    await updateDoc(doc(db, "users", targetUser.id), {
      role: "admin",
    });

    toast.success("User promoted to admin.");
    await fetchUsers();
  } catch (err) {
    console.error("MAKE ADMIN ERROR:", err);
    toast.error("Failed to make admin.");
  } finally {
    setActionUserId(null);
  }
}

async function removeAdmin(targetUser: UserDoc) {
  const ok = confirm(`Remove admin access from ${targetUser.email || targetUser.name || "this user"}?`);
  if (!ok) return;

  setActionUserId(targetUser.id);

  try {
    await updateDoc(doc(db, "users", targetUser.id), {
      role: "user",
    });

    toast.success("Admin access removed.");
    await fetchUsers();
  } catch (err) {
    console.error("REMOVE ADMIN ERROR:", err);
    toast.error("Failed to remove admin.");
  } finally {
    setActionUserId(null);
  }
}

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) return users;

    return users.filter((item) => {
      const combined = `${item.name || ""} ${item.displayName || ""} ${
        item.email || ""
      } ${item.role || ""} ${item.occupation || ""}`.toLowerCase();

      return combined.includes(q);
    });
  }, [users, search]);

  const stats = useMemo(() => {
    return {
      total: users.length,
      banned: users.filter((item) => item.banned).length,
      risky: users.filter((item) => (item.strikes ?? 0) >= 3).length,
      admins: users.filter((item) => item.role === "admin").length,
    };
  }, [users]);

  if (loading || checking) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center px-4">
        <section className="glass-card w-full max-w-md rounded-[2rem] p-8 text-center">
          <Shield className="mx-auto text-red-300" size={42} />
          <h1 className="mt-5 text-2xl font-black text-white">
            Checking Admin Access
          </h1>
          <p className="mt-3 text-sm text-white/55">
            Verifying permission before opening user management.
          </p>
        </section>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center px-4">
        <section className="glass-card w-full max-w-md rounded-[2rem] p-8 text-center">
          <Shield className="mx-auto text-red-300" size={42} />
          <h1 className="mt-5 text-3xl font-black text-red-300">
            Access Denied
          </h1>
          <p className="mt-3 text-sm text-white/55">
            You do not have admin permission for this page.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="space-y-8 pb-24 md:pb-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#06070b] p-6 shadow-card md:p-10">
        <div className="absolute right-[-120px] top-[-120px] h-[320px] w-[320px] rounded-full bg-red-500/25 blur-[130px]" />

        <div className="relative z-10">
          <button
            type="button"
            onClick={() => router.push("/admin")}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-black text-white/60 transition hover:border-red-500/30 hover:text-white"
          >
            <ArrowLeft size={16} />
            Back to Admin
          </button>

          <div className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-black text-red-300">
            <UserCog size={16} />
            Admin User Management
          </div>

          <h1 className="mt-6 text-4xl font-black tracking-tight text-white md:text-6xl">
            User Safety Center
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/60 md:text-base">
            Review users, manage strikes, ban unsafe uploaders, and restore good accounts.
          </p>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Users" value={stats.total} icon={<Users size={22} />} />
        <StatCard label="Banned" value={stats.banned} icon={<Ban size={22} />} />
        <StatCard label="Risky Users" value={stats.risky} icon={<Shield size={22} />} />
        <StatCard label="Admins" value={stats.admins} icon={<ShieldCheck size={22} />} />
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-card backdrop-blur-xl">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-md">
            <Search
              size={17}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/35"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users by name, email, role..."
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-5 py-3 pl-11 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-red-500"
            />
          </div>

          <button
            type="button"
            onClick={fetchUsers}
            disabled={fetching}
            className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-3 text-sm font-black text-white transition hover:border-red-500/30 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={17}
              className={fetching ? "animate-spin text-red-300" : ""}
            />
            Refresh Users
          </button>
        </div>
      </section>

      {fetching && (
        <section className="glass-card rounded-[2rem] p-8">
          <div className="flex items-center gap-3 text-sm font-semibold text-white/60">
            <RefreshCw size={18} className="animate-spin text-red-300" />
            Loading users...
          </div>
        </section>
      )}

      {!fetching && filteredUsers.length === 0 && (
        <section className="glass-card rounded-[2rem] p-10 text-center">
          <Users className="mx-auto text-white/35" size={42} />
          <h2 className="mt-5 text-2xl font-black text-white">
            No Users Found
          </h2>
          <p className="mt-3 text-sm text-white/55">
            Try a different search term.
          </p>
        </section>
      )}

      {!fetching && filteredUsers.length > 0 && (
        <section className="space-y-4">
          {filteredUsers.map((item) => {
            const isBusy = actionUserId === item.id;
            const name =
              item.name || item.displayName || item.email || "NotesWallah User";

            return (
              <article
                key={item.id}
                className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-5 shadow-card backdrop-blur-xl md:p-6"
              >
                <div className="grid gap-5 xl:grid-cols-[1fr_360px] xl:items-center">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-black text-white">
                        {name}
                      </h2>

                      {item.role === "admin" && (
                        <span className="rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-xs font-black text-green-300">
                          Admin
                        </span>
                      )}

                      {item.banned && (
                        <span className="rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs font-black text-red-300">
                          Banned
                        </span>
                      )}

                      {(item.strikes ?? 0) >= 3 && !item.banned && (
                        <span className="rounded-full border border-yellow-500/20 bg-yellow-500/10 px-3 py-1 text-xs font-black text-yellow-300">
                          Risky
                        </span>
                      )}
                    </div>

                    <p className="mt-2 break-all text-sm text-white/50">
                      {item.email || "No email found"}
                    </p>

                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <InfoBox label="Strikes" value={String(item.strikes ?? 0)} />
                      <InfoBox label="Role" value={item.role || "user"} />
                      <InfoBox
                        label="Occupation"
                        value={item.occupation || item.bio || "Not set"}
                      />
                    </div>

                    {item.banReason && (
                      <p className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-xs leading-5 text-red-100/80">
                        {item.banReason}
                      </p>
                    )}
                  </div>

                  <div className="grid gap-3">
                    {item.banned ? (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => unbanUser(item)}
                        className="flex min-h-[2.9rem] items-center justify-center gap-2 rounded-2xl border border-green-500/25 bg-green-500/10 px-4 py-3 text-sm font-black text-green-200 transition hover:bg-green-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <ShieldCheck size={16} />
                        Unban User
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={isBusy || item.role === "admin"}
                        onClick={() => banUser(item)}
                        className="flex min-h-[2.9rem] items-center justify-center gap-2 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm font-black text-red-200 transition hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Ban size={16} />
                        Ban Uploading
                      </button>
                    )}

                    {item.role === "admin" ? (
                      item.id !== user?.uid && (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => removeAdmin(item)}
                          className="flex min-h-[2.9rem] items-center justify-center gap-2 rounded-2xl border border-yellow-500/25 bg-yellow-500/10 px-4 py-3 text-sm font-black text-yellow-200 transition hover:bg-yellow-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Shield size={16} />
                          Remove Admin
                        </button>
                      )
                    ) : (
                      <button
                        type="button"
                        disabled={isBusy || item.banned}
                        onClick={() => makeAdmin(item)}
                        className="flex min-h-[2.9rem] items-center justify-center gap-2 rounded-2xl border border-green-500/25 bg-green-500/10 px-4 py-3 text-sm font-black text-green-200 transition hover:bg-green-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <ShieldCheck size={16} />
                        Make Admin
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => resetStrikes(item)}
                      className="flex min-h-[2.9rem] items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-black text-white transition hover:border-red-500/30 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <RotateCcw size={16} />
                      Reset Strikes
                    </button>

                    <button
                      type="button"
                      onClick={() => router.push(`/profile/${item.id}`)}
                      className="flex min-h-[2.9rem] items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-black text-white/70 transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-white"
                    >
                      View Profile
                    </button>

                    {isBusy && (
                      <div className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-xs font-bold text-white/50">
                        <RefreshCw size={14} className="animate-spin" />
                        Updating user...
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-5 shadow-card backdrop-blur-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-white/50">{label}</p>
          <h2 className="mt-2 text-4xl font-black text-white">{value}</h2>
        </div>

        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-300">
          {icon}
        </div>
      </div>
    </div>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
      <p className="text-xs font-bold text-white/35">{label}</p>
      <p className="mt-1 line-clamp-1 break-all text-sm font-black text-white/75">
        {value}
      </p>
    </div>
  );
}