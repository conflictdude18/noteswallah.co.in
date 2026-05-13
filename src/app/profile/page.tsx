"use client";

import type React from "react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowRight,
  Award,
  BookOpen,
  Download,
  Eye,
  Flame,
  Heart,
  Mail,
  RefreshCw,
  Settings,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  UserPlus,
  UserRound,
  Users,
} from "lucide-react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { db } from "@/firebase/firebase";
import { useAuth } from "@/contexts/AuthContext";
import UserAvatar from "@/components/UserAvatar";
import type { Note } from "@/types/note";

type UserProfile = {
  uid?: string;
  displayName?: string;
  name?: string;
  bio?: string;
  occupation?: string;
  avatarUrl?: string;
  photoURL?: string;
  profileImage?: string;
  profileImageUrl?: string;
  imageUrl?: string;
  verified?: boolean;
  role?: string;
  createdAt?: unknown;
};

type CreatorNote = Note & {
  id: string;
  board?: string;
  type?: string;
  topic?: string;
  views?: number;
  likes?: number;
  downloads?: number;
  downloadsCount?: number;
  createdAt?: unknown;
};

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [fetching, setFetching] = useState(true);

  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [uploadedNotes, setUploadedNotes] = useState<CreatorNote[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/signin");
    }
  }, [user, loading, router]);

  useEffect(() => {
    async function fetchProfile() {
      if (!user) return;

      try {
        const userSnap = await getDoc(doc(db, "users", user.uid));

        if (userSnap.exists()) {
          setProfile(userSnap.data() as UserProfile);
        }

        const followersQuery = query(
          collection(db, "follows"),
          where("followingId", "==", user.uid)
        );

        const followingQuery = query(
          collection(db, "follows"),
          where("followerId", "==", user.uid)
        );

        const notesQuery = query(
          collection(db, "notes"),
          where("uploaderId", "==", user.uid)
        );

        const [followersSnap, followingSnap, notesSnap] = await Promise.all([
          getDocs(followersQuery),
          getDocs(followingQuery),
          getDocs(notesQuery),
        ]);

        const notesData: CreatorNote[] = notesSnap.docs.map((noteDoc) => ({
          id: noteDoc.id,
          ...(noteDoc.data() as Omit<CreatorNote, "id">),
        }));

        setFollowersCount(followersSnap.docs.length);
        setFollowingCount(followingSnap.docs.length);
        setUploadedNotes(notesData);
      } catch (err) {
        console.error("PROFILE FETCH ERROR:", err);
      } finally {
        setFetching(false);
      }
    }

    if (user) fetchProfile();
  }, [user]);

  const approvedNotes = useMemo(() => {
    return uploadedNotes.filter((note) => note.status === "approved");
  }, [uploadedNotes]);

  const totalDownloads = useMemo(() => {
    return uploadedNotes.reduce((total, note) => total + getDownloads(note), 0);
  }, [uploadedNotes]);

  const totalLikes = useMemo(() => {
    return uploadedNotes.reduce((total, note) => total + getNumber(note.likes), 0);
  }, [uploadedNotes]);

  const totalViews = useMemo(() => {
    return uploadedNotes.reduce((total, note) => total + getNumber(note.views), 0);
  }, [uploadedNotes]);

  const topSubjects = useMemo(() => {
    const subjectMap = new Map<string, number>();

    uploadedNotes.forEach((note) => {
      if (!note.subject) return;
      subjectMap.set(note.subject, (subjectMap.get(note.subject) || 0) + 1);
    });

    return Array.from(subjectMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [uploadedNotes]);

  const latestNotes = useMemo(() => {
    return [...uploadedNotes]
      .sort((a, b) => getCreatedTime(b.createdAt) - getCreatedTime(a.createdAt))
      .slice(0, 3);
  }, [uploadedNotes]);

  const topNotes = useMemo(() => {
    return [...uploadedNotes]
      .sort((a, b) => getCreatorScore(b) - getCreatorScore(a))
      .slice(0, 3);
  }, [uploadedNotes]);

  const bestNote = topNotes[0];

  if (loading || fetching) {
    return (
      <main className="min-h-screen bg-[#050505] px-4 py-8 text-white">
        <div className="mx-auto flex min-h-[70vh] max-w-6xl items-center justify-center">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-white/10 bg-white/5">
              <RefreshCw className="animate-spin text-red-500" size={30} />
            </div>

            <h1 className="mt-5 text-xl font-black">Loading profile</h1>

            <p className="mt-2 text-sm text-white/50">
              Fetching your creator stats...
            </p>
          </div>
        </div>
      </main>
    );
  }

  const displayName =
    profile?.displayName || profile?.name || user?.displayName || "User";

  const avatarUrl =
    profile?.avatarUrl ||
    profile?.photoURL ||
    profile?.profileImage ||
    profile?.profileImageUrl ||
    profile?.imageUrl ||
    "";

  const creatorLevel =
    totalDownloads >= 100
      ? "Rising Creator"
      : uploadedNotes.length >= 5
        ? "Active Creator"
        : "New Creator";

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#050505] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl pb-28 md:pb-10">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/10 via-white/[0.04] to-red-500/10 p-5 shadow-2xl shadow-black/30 sm:p-7 lg:p-9">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-red-500/20 blur-3xl" />

          <div className="relative">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 items-center gap-4 sm:gap-5">
                <UserAvatar name={displayName} src={avatarUrl} size="lg" />

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="line-clamp-1 text-3xl font-black sm:text-5xl">
                      {displayName}
                    </h1>

                    {(profile?.verified || profile?.role === "admin") && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1 text-xs font-black text-blue-300">
                        <ShieldCheck size={13} />
                        Verified
                      </span>
                    )}
                  </div>

                  <p className="mt-1 truncate text-sm font-semibold text-white/50 sm:text-base">
                    {profile?.occupation || "Student Creator"}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge icon={<Activity size={13} />} text="Active Profile" />
                    <Badge icon={<Award size={13} />} text={creatorLevel} />
                    <Badge
                      icon={<ShieldCheck size={13} />}
                      text={profile?.role === "admin" ? "Admin" : "User"}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:flex">
                <Link
                  href="/settings/profile"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 py-3 text-sm font-black text-white transition hover:bg-red-500"
                >
                  <Settings size={17} />
                  Edit
                </Link>

                <Link
                  href={`/profile/${user?.uid}`}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-black text-white/80 transition hover:bg-white/[0.08]"
                >
                  <UserRound size={17} />
                  Public
                </Link>
              </div>
            </div>

            <p className="mt-5 rounded-[1.5rem] border border-white/10 bg-black/25 p-4 text-sm leading-7 text-white/65 lg:max-w-3xl">
              {profile?.bio || "You have not added a bio yet."}
            </p>

            {topSubjects.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {topSubjects.map(([subject, count]) => (
                  <span
                    key={subject}
                    className="rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs font-bold text-red-200"
                  >
                    {subject} · {count}
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          <ProfileCard
            href={`/profile/${user?.uid}/followers`}
            icon={<Users size={22} />}
            label="Followers"
            value={followersCount}
          />

          <ProfileCard
            href={`/profile/${user?.uid}/following`}
            icon={<UserPlus size={22} />}
            label="Following"
            value={followingCount}
          />

          <InfoCard icon={<UploadCloud size={22} />} label="Uploads" value={uploadedNotes.length} />
          <InfoCard icon={<Download size={22} />} label="Downloads" value={totalDownloads} />
          <InfoCard icon={<Heart size={22} />} label="Likes" value={totalLikes} />
          <InfoCard icon={<Eye size={22} />} label="Views" value={totalViews} />
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20 sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-red-300">
                  <Flame size={15} />
                  Creator Highlight
                </p>
                <h2 className="mt-2 text-xl font-black">Best Performing Note</h2>
              </div>
            </div>

            {bestNote ? (
              <NoteRow note={bestNote} />
            ) : (
              <EmptyBox text="Upload notes to see your best performing content here." />
            )}
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20 sm:p-6">
            <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-red-300">
              <Mail size={15} />
              Account
            </p>

            <div className="mt-5 rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-white/40">
                Email
              </p>
              <p className="mt-1 truncate text-sm font-bold text-white/80">
                {user?.email || "No email"}
              </p>
            </div>

            <div className="mt-3 rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-white/40">
                Approved Notes
              </p>
              <p className="mt-1 text-2xl font-black text-green-300">
                {approvedNotes.length}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-5 rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20 sm:p-6">
          <h2 className="text-xl font-black">Quick Actions</h2>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <QuickAction href="/my-notes" label="My Notes" />
            <QuickAction href="/saved-notes" label="Saved Notes" />
            <QuickAction href="/upload" label="Upload Notes" />
          </div>
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-2">
          <NotesPanel
            title="Top Notes"
            subtitle="Ranked by downloads, likes and views"
            icon={<Award size={15} />}
            notes={topNotes}
            emptyText="Your top notes will appear here."
          />

          <NotesPanel
            title="Latest Uploads"
            subtitle="Recently uploaded study material"
            icon={<Sparkles size={15} />}
            notes={latestNotes}
            emptyText="Your latest uploads will appear here."
          />
        </section>
      </div>
    </main>
  );
}

function Badge({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-xs font-black text-green-300">
      {icon}
      {text}
    </span>
  );
}

function ProfileCard({
  href,
  icon,
  label,
  value,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <Link
      href={href}
      className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-black/20 transition hover:border-red-500/30 hover:bg-white/[0.06]"
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-500/10 text-red-300">
        {icon}
      </div>

      <p className="mt-4 text-xs font-bold uppercase tracking-wide text-white/40">
        {label}
      </p>

      <p className="mt-1 text-3xl font-black">{value}</p>
    </Link>
  );
}

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-black/20">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-500/10 text-red-300">
        {icon}
      </div>

      <p className="mt-4 text-xs font-bold uppercase tracking-wide text-white/40">
        {label}
      </p>

      <p className="mt-1 text-3xl font-black">{value}</p>
    </div>
  );
}

function QuickAction({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/25 px-4 py-4 text-sm font-black text-white/75 transition hover:border-red-500/30 hover:text-white"
    >
      {label}
      <ArrowRight size={17} />
    </Link>
  );
}

function NotesPanel({
  title,
  subtitle,
  icon,
  notes,
  emptyText,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  notes: CreatorNote[];
  emptyText: string;
}) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20 sm:p-6">
      <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-red-300">
        {icon}
        Creator Notes
      </p>

      <h2 className="mt-2 text-xl font-black">{title}</h2>
      <p className="mt-1 text-sm text-white/45">{subtitle}</p>

      <div className="mt-5 space-y-3">
        {notes.length > 0 ? (
          notes.map((note) => <NoteRow key={note.id} note={note} />)
        ) : (
          <EmptyBox text={emptyText} />
        )}
      </div>
    </div>
  );
}

function NoteRow({ note }: { note: CreatorNote }) {
  return (
    <Link
      href={`/notes/${note.id}`}
      className="block rounded-2xl border border-white/10 bg-black/25 p-4 transition hover:border-red-500/30 hover:bg-white/[0.05]"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-500/10 text-red-300">
          <BookOpen size={21} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap gap-2">
            <span className="rounded-full border border-red-500/20 bg-red-500/10 px-2.5 py-1 text-[10px] font-bold text-red-200">
              {note.subject || "General"}
            </span>

            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-bold text-white/50">
              {note.status || "pending"}
            </span>
          </div>

          <h3 className="line-clamp-2 text-sm font-black text-white">
            {note.title || "Untitled Note"}
          </h3>

          <p className="mt-1 line-clamp-1 text-xs text-white/45">
            {note.topic || note.description || "No description"}
          </p>

          <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold text-white/45">
            <span className="flex items-center gap-1">
              <Download size={13} />
              {getDownloads(note)}
            </span>

            <span className="flex items-center gap-1">
              <Heart size={13} />
              {getNumber(note.likes)}
            </span>

            <span className="flex items-center gap-1">
              <Eye size={13} />
              {getNumber(note.views)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function EmptyBox({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-5 text-sm leading-6 text-white/45">
      {text}
    </div>
  );
}

function getNumber(value: unknown) {
  return typeof value === "number" ? value : 0;
}

function getDownloads(note: CreatorNote) {
  return getNumber(note.downloads) || getNumber(note.downloadsCount);
}

function getCreatorScore(note: CreatorNote) {
  return getDownloads(note) * 3 + getNumber(note.likes) * 2 + getNumber(note.views);
}

function getCreatedTime(value: unknown) {
  if (!value) return 0;

  if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof value.toDate === "function"
  ) {
    return value.toDate().getTime();
  }

  if (typeof value === "string") {
    return new Date(value).getTime() || 0;
  }

  return 0;
}