"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { updateCreatorStats } from "@/lib/updateCreatorStats";
import {
  Camera,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { db, storage } from "@/firebase/firebase";
import { useAuth } from "@/contexts/AuthContext";
import UserAvatar from "@/components/UserAvatar";

type UserProfile = {
  displayName: string;
  bio: string;
  occupation: string;
  avatarUrl: string;
};

export default function ProfileSettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const [profile, setProfile] = useState<UserProfile>({
    displayName: "",
    bio: "",
    occupation: "",
    avatarUrl: "",
  });

  const previewUrl = useMemo(() => {
    if (!avatarFile) return profile.avatarUrl;

    return URL.createObjectURL(avatarFile);
  }, [avatarFile, profile.avatarUrl]);

  useEffect(() => {
    async function fetchProfile() {
      if (!user) return;

      setFetching(true);

      try {
        const snap = await getDoc(doc(db, "users", user.uid));

        if (snap.exists()) {
          const data = snap.data() as Partial<UserProfile>;

          setProfile({
            displayName: data.displayName || user.displayName || "",
            bio: data.bio || "",
            occupation: data.occupation || "Student",
            avatarUrl: data.avatarUrl || "",
          });
        } else {
          setProfile((prev) => ({
            ...prev,
            displayName: user.displayName || "",
            occupation: "Student",
          }));
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load profile.");
      } finally {
        setFetching(false);
      }
    }

    if (!loading && !user) {
      router.push("/signin");
      return;
    }

    if (user) fetchProfile();
  }, [user, loading, router]);

  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  async function uploadAvatarIfSelected() {
    if (!user || !avatarFile) return profile.avatarUrl;

    if (!avatarFile.type.startsWith("image/")) {
      toast.error("Only image files are allowed.");
      return profile.avatarUrl;
    }

    const maxSizeInBytes = 2 * 1024 * 1024;

    if (avatarFile.size > maxSizeInBytes) {
      toast.error("Profile picture must be under 2 MB.");
      return profile.avatarUrl;
    }

    setUploadingAvatar(true);

    try {
      const avatarPath = `avatars/${user.uid}/${Date.now()}-${avatarFile.name}`;
      const avatarRef = ref(storage, avatarPath);

      await uploadBytes(avatarRef, avatarFile);

      const avatarUrl = await getDownloadURL(avatarRef);

      setProfile((prev) => ({
        ...prev,
        avatarUrl,
      }));

      setAvatarFile(null);

      return avatarUrl;
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleSave() {
    if (!user) return;

    if (!profile.displayName.trim()) {
      toast.error("Display name is required.");
      return;
    }

    try {
      setSaving(true);

      const finalAvatarUrl = await uploadAvatarIfSelected();

      await updateDoc(doc(db, "users", user.uid), {
        displayName: profile.displayName.trim(),
        name: profile.displayName.trim(),
        bio: profile.bio.trim(),
        occupation: profile.occupation.trim() || "Student",
        avatarUrl: finalAvatarUrl,
        photoURL: finalAvatarUrl,
      });

      try {
        await updateCreatorStats(user.uid);
      } catch {
        console.warn("Creator stats refresh failed.");
      }

      toast.success("Profile updated successfully.");
      router.refresh();
      router.push("/profile");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  }

  const isSaving = saving || uploadingAvatar;

  if (loading || fetching) {
    return (
      <main className="min-h-screen bg-[#050505] px-4 py-8 text-white">
        <div className="mx-auto flex min-h-[70vh] max-w-6xl items-center justify-center">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-white/10 bg-white/5">
              <RefreshCw className="animate-spin text-red-500" size={30} />
            </div>

            <h1 className="mt-5 text-xl font-black">Loading settings</h1>

            <p className="mt-2 text-sm text-white/50">
              Opening your profile editor...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#050505] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl pb-64 md:pb-10">
        <section className="relative max-w-full overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/10 via-white/[0.04] to-red-500/10 p-5 shadow-2xl shadow-black/30 sm:p-7 lg:p-9">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-red-500/20 blur-3xl" />

          <div className="relative max-w-3xl">
            <div className="inline-flex rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 text-xs font-black text-red-300">
              Profile Settings
            </div>

            <h1 className="mt-5 text-3xl font-black leading-tight sm:text-5xl lg:text-6xl">
              Customize your
              <span className="block text-red-500">profile</span>
            </h1>

            <p className="mt-4 text-sm leading-6 text-white/55 sm:text-base">
              Update your public profile, bio, occupation and profile picture.
            </p>
          </div>
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[1fr_360px]">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-7 lg:p-8">
            <div className="flex flex-col items-center gap-5 rounded-[1.7rem] border border-white/10 bg-black/25 p-5 text-center md:flex-row md:text-left">
              <UserAvatar
                name={profile.displayName || "User"}
                src={previewUrl}
                size="lg"
              />

              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-black sm:text-2xl">
                  Profile Picture
                </h2>

                <p className="mt-2 text-sm leading-6 text-white/50">
                  Upload a JPG, PNG or WebP image under 2 MB.
                </p>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-black text-white transition hover:bg-red-500">
                    <Camera size={18} />
                    Choose Image

                    <input
                      title="Choose profile picture"
                      aria-label="Choose profile picture"
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={(e) =>
                        setAvatarFile(e.target.files?.[0] || null)
                      }
                      className="hidden"
                    />
                  </label>

                  {avatarFile && (
                    <button
                      type="button"
                      onClick={() => setAvatarFile(null)}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-3 text-sm font-black text-white/75"
                    >
                      <X size={17} />
                      Remove
                    </button>
                  )}
                </div>

                {avatarFile && (
                  <p className="mt-3 max-w-full truncate text-xs font-semibold text-white/40">
                    Selected: {avatarFile.name}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6 grid gap-5">
              <InputField
                label="Display Name"
                value={profile.displayName}
                onChange={(value) =>
                  setProfile({
                    ...profile,
                    displayName: value,
                  })
                }
                placeholder="Your name"
              />

              <InputField
                label="Occupation"
                value={profile.occupation}
                onChange={(value) =>
                  setProfile({
                    ...profile,
                    occupation: value,
                  })
                }
                placeholder="Student"
              />

              <div>
                <label className="mb-2 block text-sm font-bold text-white/75">
                  Bio
                </label>

                <textarea
                  value={profile.bio}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      bio: e.target.value,
                    })
                  }
                  rows={5}
                  placeholder="Tell students about yourself..."
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-5 py-4 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-red-500"
                />
              </div>

              <button
                onClick={handleSave}
                disabled={isSaving}
                className="hidden items-center justify-center gap-2 rounded-2xl bg-red-600 px-6 py-4 font-black text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50 md:inline-flex"
              >
                {isSaving ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Upload size={18} />
                )}
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>

          <aside className="rounded-[2rem] border border-green-500/20 bg-green-500/5 p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-green-500/10 p-3 text-green-400">
                <CheckCircle2 size={22} />
              </div>

              <div>
                <h3 className="font-black">Profile Tips</h3>
                <p className="text-sm text-white/45">
                  Make your profile trustworthy.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <Tip text="Use your real name or recognizable display name." />
              <Tip text="Add a clear profile picture." />
              <Tip text="Write a short bio about your class or subjects." />
              <Tip text="Keep your occupation simple, like Student or Teacher." />
            </div>
          </aside>
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-[76px] z-40 w-screen overflow-hidden border-t border-white/10 bg-[#050505]/95 px-4 pb-4 pt-3 backdrop-blur-xl md:hidden">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-red-600 text-sm font-black text-white shadow-lg shadow-red-600/25 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Upload size={18} />
          )}
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </main>
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-white/75">
        {label}
      </label>

      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-white/10 bg-black/30 px-5 py-4 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-red-500"
      />
    </div>
  );
}

function Tip({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-2 h-2 w-2 rounded-full bg-green-400" />
      <p className="text-sm leading-6 text-white/60">{text}</p>
    </div>
  );
}