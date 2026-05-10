"use client";

import { useState } from "react";
import Link from "next/link";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react";

import { auth } from "@/firebase/firebase";

export default function SignUpPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function getFirebaseErrorMessage(message: string) {
    if (message.includes("email-already-in-use")) {
      return "This email is already registered.";
    }

    if (message.includes("weak-password")) {
      return "Password should be at least 6 characters.";
    }

    if (message.includes("invalid-email")) {
      return "Please enter a valid email address.";
    }

    if (message.includes("network-request-failed")) {
      return "Network error. Check your internet.";
    }

    return "Something went wrong. Please try again.";
  }

  async function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const userCred = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      await updateProfile(userCred.user, {
        displayName: name,
      });

      window.location.href = "/dashboard";
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(getFirebaseErrorMessage(err.message));
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-[80vh] items-center justify-center pb-24 pt-6 md:pb-8">
      <div className="grid w-full max-w-6xl gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-stretch">
        <section className="relative hidden overflow-hidden rounded-[2rem] border border-white/10 bg-[#07090d] p-8 shadow-card lg:block">
          <div className="absolute right-[-100px] top-[-100px] h-[300px] w-[300px] rounded-full bg-red-500/20 blur-[120px]" />
          <div className="absolute bottom-[-130px] left-[-120px] h-[280px] w-[280px] rounded-full bg-red-700/10 blur-[120px]" />

          <div className="relative z-10 flex h-full flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-black text-red-300">
                <Sparkles size={16} />
                Join NotesWallah
              </div>

              <h1 className="mt-8 text-5xl font-black leading-tight tracking-tight text-white">
                Create Your
                <span className="block text-[#ff2d3d]">
                  Student Account.
                </span>
              </h1>

              <p className="mt-5 max-w-md text-sm leading-7 text-white/60">
                Upload notes, save useful PDFs, follow contributors and help
                other students learn better.
              </p>
            </div>

            <div className="grid gap-3">
              <FeatureRow text="Upload useful PDFs" />
              <FeatureRow text="Download verified notes" />
              <FeatureRow text="Build your learning profile" />
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.035] p-6 shadow-card backdrop-blur-xl md:p-8">
          <div className="absolute right-[-80px] top-[-80px] h-52 w-52 rounded-full bg-red-500/10 blur-[90px]" />

          <div className="relative z-10">
            <div className="mb-8">
              <div className="flex h-14 w-14 items-center justify-center rounded-[1.35rem] border border-red-500/20 bg-red-500/10 text-red-300">
                <ShieldCheck size={26} />
              </div>

              <h2 className="mt-5 text-3xl font-black tracking-tight text-white">
                Create Account
              </h2>

              <p className="mt-2 text-sm leading-6 text-white/55">
                Join NotesWallah and start sharing notes.
              </p>
            </div>

            {error && (
              <div className="mb-5 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-300">
                {error}
              </div>
            )}

            <form onSubmit={handleSignup} className="space-y-5">
              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-bold text-white/75"
                >
                  Full Name
                </label>

                <div className="relative">
                  <User
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/35"
                  />

                  <input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="nw-input input-icon-left"
                    required
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-bold text-white/75"
                >
                  Email
                </label>

                <div className="relative">
                  <Mail
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/35"
                  />

                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="nw-input input-icon-left"
                    required
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-bold text-white/75"
                >
                  Password
                </label>

                <div className="relative">
                  <Lock
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/35"
                  />

                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Create a password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="nw-input input-icon-left"
                    required
                  />
                </div>

                <p className="mt-2 text-xs font-semibold text-white/35">
                  Use at least 6 characters.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Creating..." : "Sign Up"}
                {!loading && <ArrowRight size={18} />}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-white/55">
              Already have an account?{" "}
              <Link
                href="/signin"
                className="font-black text-red-300 transition hover:text-red-200"
              >
                Sign In
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

function FeatureRow({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-bold text-white/65">
      <CheckCircle2 size={17} className="text-green-400" />
      {text}
    </div>
  );
}