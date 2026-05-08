"use client";

import { useState } from "react";
import Link from "next/link";
import {
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { auth } from "@/firebase/firebase";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSignin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      window.location.href = "/dashboard";
    } catch (err: unknown) {
    if (err instanceof Error) {
    setError(err.message);
      } else {
    setError("Something went wrong. Please try again.");
    }
    }

    setLoading(false);
  }

  async function handleGoogleSignin() {
    setError("");
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      window.location.href = "/dashboard";
    } catch (err: unknown) {
    if (err instanceof Error) {
    setError(err.message);
      } else {
    setError("Something went wrong. Please try again.");
    }
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="glass-card w-full max-w-md p-8">
        <h1 className="text-2xl font-bold">Welcome Back</h1>
        <p className="mt-2 text-white/60 text-sm">
          Sign in to access NotesWallah.
        </p>

        {error && (
          <p className="mt-4 rounded-lg bg-red-500/20 p-3 text-sm text-red-300">
            {error}
          </p>
        )}

        <button
          onClick={handleGoogleSignin}
          disabled={loading}
          className="btn-secondary w-full mt-6"
        >
          Continue with Google
        </button>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-xs text-white/40">OR</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <form onSubmit={handleSignin} className="space-y-4">
          <input
            className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 outline-none focus:border-red-500"
            placeholder="Email"
            value={email}
            type="email"
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 outline-none focus:border-red-500"
            placeholder="Password"
            value={password}
            type="password"
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button disabled={loading} className="btn-primary w-full">
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="mt-6 text-sm text-white/70">
          Don’t have an account?{" "}
          <Link href="/signup" className="text-red-400 hover:text-red-300">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}