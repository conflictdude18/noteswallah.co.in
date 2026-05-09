"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { Camera, Upload } from "lucide-react";
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

  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const [profile, setProfile] = useState<UserProfile>({
    displayName: "",
    bio: "",
    occupation: "",
    avatarUrl: "",
  });

  useEffect(() => {
    async function fetchProfile() {
      if (!user) return;

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
        }
      } catch (err) {
        console.error(err);
      }
    }

    fetchProfile();
  }, [user]);

  async function uploadAvatarIfSelected() {
    if (!user || !avatarFile) return profile.avatarUrl;

    if (!avatarFile.type.startsWith("image/")) {
      toast.error("Only image files are allowed.");
      return profile.avatarUrl;
    }

    const maxSizeInMB = 2;
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;

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

    try {
      setSaving(true);

      const finalAvatarUrl = await uploadAvatarIfSelected();

      await updateDoc(doc(db, "users", user.uid), {
        displayName: profile.displayName.trim(),
        bio: profile.bio.trim(),
        occupation: profile.occupation.trim() || "Student",
        avatarUrl: finalAvatarUrl,
      });

      toast.success("Profile updated successfully.");
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  }

  if (!loading && !user) {
    router.push("/signin");
    return null;
  }

  const previewUrl = avatarFile
    ? URL.createObjectURL(avatarFile)
    : profile.avatarUrl;

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <div className="container-max py-10">
        <div className="max-w-3xl">
          <div className="mb-4 inline-flex rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm text-red-400">
            Profile Settings
          </div>

          <h1 className="text-5xl font-black">
            Customize Your
            <span className="block text-red-500">Profile</span>
          </h1>

          <p className="mt-5 text-lg text-white/60">
            Update your public profile, bio, occupation and profile picture.
          </p>
        </div>

        <div className="mt-12 rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
          <div className="grid gap-8">
            <div className="flex flex-col gap-5 md:flex-row md:items-center">
              <UserAvatar
                name={profile.displayName || "User"}
                src={previewUrl}
                size="xl"
              />

              <div>
                <h2 className="text-2xl font-bold">Profile Picture</h2>

                <p className="mt-2 text-sm text-white/50">
                  Upload a JPG, PNG or WebP image under 2 MB.
                </p>

                <label className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-white/80 transition hover:bg-white/10">
                  <Camera size={18} />

                  Choose Image

                  <input
                    title="Choose profile picture"
                    aria-label="Choose profile picture"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                </label>

                {avatarFile && (
                  <p className="mt-3 text-xs text-white/40">
                    Selected: {avatarFile.name}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm text-white/70">
                Display Name
              </label>

              <input
                value={profile.displayName}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    displayName: e.target.value,
                  })
                }
                placeholder="Your name"
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-5 py-3 outline-none transition focus:border-red-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-white/70">
                Occupation
              </label>

              <input
                value={profile.occupation}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    occupation: e.target.value,
                  })
                }
                placeholder="Student"
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-5 py-3 outline-none transition focus:border-red-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-white/70">Bio</label>

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
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-5 py-3 outline-none transition focus:border-red-500"
              />
            </div>

            <button
              onClick={handleSave}
              disabled={saving || uploadingAvatar}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-6 py-4 font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Upload size={18} />

              {saving || uploadingAvatar ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}