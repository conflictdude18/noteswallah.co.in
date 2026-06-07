"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  collection,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";
import {
  ArrowLeft,
  Crown,
  Mail,
  RefreshCw,
  Users,
} from "lucide-react";

import { db } from "@/firebase/firebase";

type WaitlistUser = {
  id: string;
  userId: string;
  email: string;
  displayName: string;
  plan: string;
  expectedPrice: number;
  status: string;
  joinedAt?: unknown;
};

export default function PremiumWaitlistPage() {
  const [users, setUsers] = useState<WaitlistUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWaitlist() {
      try {
        const q = query(
          collection(db, "premiumWaitlist"),
          orderBy("joinedAt", "desc")
        );

        const snap = await getDocs(q);

        const data: WaitlistUser[] = snap.docs.map((item) => {
          const value = item.data();

          return {
            id: item.id,
            userId: value.userId || item.id,
            email: value.email || "",
            displayName: value.displayName || "NotesWallah User",
            plan: value.plan || "notique_premium",
            expectedPrice: Number(value.expectedPrice || 49),
            status: value.status || "interested",
            joinedAt: value.joinedAt,
          };
        });

        setUsers(data);
      } catch (error) {
        console.error("WAITLIST ERROR:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchWaitlist();
  }, []);

  return (
    <main className="min-h-screen bg-[#050505] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl pb-28 md:pb-10">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-black text-white/70 transition hover:bg-white/[0.08] hover:text-white"
        >
          <ArrowLeft size={16} />
          Back to Admin
        </Link>

        <section className="mt-5 rounded-[2rem] border border-yellow-500/20 bg-gradient-to-br from-yellow-500/10 via-white/[0.04] to-red-500/10 p-5 shadow-2xl shadow-black/30 sm:p-7 lg:p-9">
          <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/25 bg-yellow-500/10 px-4 py-2 text-xs font-black text-yellow-300">
            <Crown size={16} />
            Premium Waitlist
          </div>

          <h1 className="mt-5 text-3xl font-black sm:text-5xl">
            Notique Premium Interest
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/55">
            Users who clicked the Notique Premium waitlist button will appear
            here.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <StatCard label="Interested Users" value={users.length} />
            <StatCard label="Expected Price" value="₹49" />
            <StatCard label="Plan" value="Notique" />
          </div>
        </section>

        {loading ? (
          <section className="mt-5 flex min-h-[260px] items-center justify-center rounded-[2rem] border border-white/10 bg-white/[0.04]">
            <div className="text-center">
              <RefreshCw className="mx-auto animate-spin text-red-400" size={32} />
              <p className="mt-4 text-sm font-bold text-white/50">
                Loading waitlist...
              </p>
            </div>
          </section>
        ) : users.length === 0 ? (
          <section className="mt-5 rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 text-center">
            <Users className="mx-auto text-white/35" size={42} />
            <h2 className="mt-4 text-2xl font-black">No waitlist users yet</h2>
            <p className="mt-2 text-sm text-white/50">
              When users join the premium waitlist, they will appear here.
            </p>
          </section>
        ) : (
          <section className="mt-5 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/20">
            <div className="border-b border-white/10 p-5">
              <h2 className="text-xl font-black">Waitlist Users</h2>
            </div>

            <div className="divide-y divide-white/10">
              {users.map((item) => (
                <div
                  key={item.id}
                  className="grid gap-4 p-5 md:grid-cols-[1fr_180px_140px]"
                >
                  <div className="min-w-0">
                    <h3 className="truncate text-lg font-black">
                      {item.displayName}
                    </h3>

                    <p className="mt-1 flex items-center gap-2 truncate text-sm text-white/45">
                      <Mail size={14} />
                      {item.email || "No email"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold text-white/35">Plan</p>
                    <p className="mt-1 text-sm font-black">
                      {formatPlan(item.plan)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold text-white/35">Status</p>
                    <p className="mt-1 rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-center text-xs font-black text-green-300">
                      {item.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
      <p className="text-2xl font-black">{value}</p>
      <p className="mt-1 text-xs font-bold text-white/45">{label}</p>
    </div>
  );
}

function formatPlan(plan: string) {
  return plan
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}