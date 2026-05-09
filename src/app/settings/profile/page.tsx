"use client";

import { useEffect, useState } from "react";

import {
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";

import { toast } from "sonner";

import { useRouter } from "next/navigation";

import { db } from "@/firebase/firebase";

import { useAuth } from "@/contexts/AuthContext";

type UserProfile = {
  displayName: string;

  bio: string;

  occupation: string;

  avatarUrl: string;
};

export default function ProfileSettingsPage() {
  const { user, loading } = useAuth();

  const router = useRouter();

  const [saving, setSaving] =
    useState(false);

  const [profile, setProfile] =
    useState<UserProfile>({
      displayName: "",

      bio: "",

      occupation: "",

      avatarUrl: "",
    });

  useEffect(() => {
    async function fetchProfile() {
      if (!user) return;

      try {
        const snap = await getDoc(
          doc(db, "users", user.uid)
        );

        if (snap.exists()) {
          const data =
            snap.data() as UserProfile;

          setProfile({
            displayName:
              data.displayName || "",

            bio: data.bio || "",

            occupation:
              data.occupation ||
              "Student",

            avatarUrl:
              data.avatarUrl || "",
          });
        }
      } catch (err) {
        console.error(err);
      }
    }

    fetchProfile();
  }, [user]);

  async function handleSave() {
    if (!user) return;

    try {
      setSaving(true);

      await updateDoc(
        doc(db, "users", user.uid),
        {
          displayName:
            profile.displayName,

          bio: profile.bio,

          occupation:
            profile.occupation,

          avatarUrl:
            profile.avatarUrl,
        }
      );

      toast.success(
        "Profile updated successfully."
      );
    } catch (err) {
      console.error(err);

      toast.error(
        "Failed to update profile."
      );
    } finally {
      setSaving(false);
    }
  }

  if (!loading && !user) {
    router.push("/signin");

    return null;
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <div className="container-max py-10">
        <div className="max-w-3xl">
          <div className="mb-4 inline-flex rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm text-red-400">
            Profile Settings
          </div>

          <h1 className="text-5xl font-black">
            Customize Your
            <span className="block text-red-500">
              Profile
            </span>
          </h1>

          <p className="mt-5 text-lg text-white/60">
            Update your public profile,
            bio and contributor details.
          </p>
        </div>

        <div className="mt-12 rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
          <div className="grid gap-6">
            {/* DISPLAY NAME */}

            <div>
              <label className="mb-2 block text-sm text-white/70">
                Display Name
              </label>

              <input
                value={profile.displayName}
                onChange={(e) =>
                  setProfile({
                    ...profile,

                    displayName:
                      e.target.value,
                  })
                }
                placeholder="Your name"
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-5 py-3 outline-none transition focus:border-red-500"
              />
            </div>

            {/* OCCUPATION */}

            <div>
              <label className="mb-2 block text-sm text-white/70">
                Occupation
              </label>

              <input
                value={profile.occupation}
                onChange={(e) =>
                  setProfile({
                    ...profile,

                    occupation:
                      e.target.value,
                  })
                }
                placeholder="Student"
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-5 py-3 outline-none transition focus:border-red-500"
              />
            </div>

            {/* AVATAR URL */}

            <div>
              <label className="mb-2 block text-sm text-white/70">
                Avatar URL
              </label>

              <input
                value={profile.avatarUrl}
                onChange={(e) =>
                  setProfile({
                    ...profile,

                    avatarUrl:
                      e.target.value,
                  })
                }
                placeholder="https://..."
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-5 py-3 outline-none transition focus:border-red-500"
              />
            </div>

            {/* BIO */}

            <div>
              <label className="mb-2 block text-sm text-white/70">
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
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-5 py-3 outline-none transition focus:border-red-500"
              />
            </div>

            {/* SAVE */}

            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-2xl bg-red-600 px-6 py-4 font-semibold text-white transition hover:bg-red-500 disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}