"use client";

import type React from "react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { auth } from "@/firebase/firebase";

export default function SignInPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function getFirebaseErrorMessage(code: string) {
    switch (code) {
      case "auth/invalid-credential":
        return "Invalid email or password.";
      case "auth/user-not-found":
        return "Account not found.";
      case "auth/wrong-password":
        return "Incorrect password.";
      case "auth/too-many-requests":
        return "Too many attempts. Try again later.";
      case "auth/network-request-failed":
        return "Network error. Check your internet.";
      default:
        return "Something went wrong. Please try again.";
    }
  }

  async function handleEmailLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/dashboard");
    } catch (err: unknown) {
      if (
        typeof err === "object" &&
        err !== null &&
        "code" in err &&
        typeof err.code === "string"
      ) {
        setError(getFirebaseErrorMessage(err.code));
      } else {
        setError("Login failed.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setLoading(true);
    setError("");

    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      router.push("/dashboard");
    } catch {
      setError("Google sign in failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#050505] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-6xl gap-5 pb-28 md:pb-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-stretch">
        <section className="relative hidden overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/10 via-white/[0.04] to-red-500/10 p-8 shadow-2xl shadow-black/30 lg:block">
          <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-red-500/20 blur-3xl" />

          <div className="relative flex h-full flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-black text-red-300">
                <Sparkles size={16} />
                NotesWallah Login
              </div>

              <h1 className="mt-8 text-5xl font-black leading-tight tracking-tight">
                Welcome back,
                <span className="block text-red-500">student.</span>
              </h1>

              <p className="mt-5 max-w-md text-sm leading-7 text-white/60">
                Sign in to upload notes, save PDFs, follow creators and manage
                your personal NotesWallah dashboard.
              </p>
            </div>

            <div className="grid gap-3">
              <FeatureRow text="Save important notes" />
              <FeatureRow text="Track your uploads" />
              <FeatureRow text="Join the student community" />
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-7 lg:p-8">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-red-500/10 blur-3xl" />

          <div className="relative">
            <div className="mb-7">
              <div className="flex h-14 w-14 items-center justify-center rounded-[1.35rem] border border-red-500/20 bg-red-500/10 text-red-300">
                <ShieldCheck size={26} />
              </div>

              <h2 className="mt-5 text-3xl font-black tracking-tight">
                Sign In
              </h2>

              <p className="mt-2 text-sm leading-6 text-white/55">
                Access your NotesWallah account securely.
              </p>
            </div>

            {error && (
              <div className="mb-5 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-300">
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-4 text-sm font-black text-white transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <BookOpen size={18} />
              )}
              Continue with Google
            </button>

            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-xs font-black text-white/35">OR</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <form onSubmit={handleEmailLogin} className="space-y-5">
              <InputField
                id="email"
                label="Email"
                type="email"
                autoComplete="email"
                placeholder="Enter your email"
                value={email}
                onChange={setEmail}
                icon={<Mail size={18} />}
              />

              <InputField
                id="password"
                label="Password"
                type="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={setPassword}
                icon={<Lock size={18} />}
              />

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-4 text-sm font-black text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Signing In...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-white/55">
              Don&apos;t have an account?{" "}
              <Link
                href="/signup"
                className="font-black text-red-300 transition hover:text-red-200"
              >
                Sign Up
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

function InputField({
  id,
  label,
  type,
  autoComplete,
  placeholder,
  value,
  onChange,
  icon,
}: {
  id: string;
  label: string;
  type: string;
  autoComplete: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  icon: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-bold text-white/75">
        {label}
      </label>

      <div className="relative">
        <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/35">
          {icon}
        </div>

        <input
          id={id}
          type={type}
          autoComplete={autoComplete}
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-black/30 px-5 py-4 pl-12 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-red-500"
          required
        />
      </div>
    </div>
  );
}

function FeatureRow({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm font-bold text-white/65">
      <CheckCircle2 size={17} className="text-green-400" />
      {text}
    </div>
  );
}