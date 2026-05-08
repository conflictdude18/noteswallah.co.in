"use client";

import { useState } from "react";
import Link from "next/link";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "@/firebase/firebase";

export default function SignUpPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSignup(e: React.FormEvent) {
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
        <h1 className="text-2xl font-bold">Create Account</h1>
        <p className="mt-2 text-white/60 text-sm">
          Join NotesWallah and start uploading notes.
        </p>

        {error && (
          <p className="mt-4 rounded-lg bg-red-500/20 p-3 text-sm text-red-300">
            {error}
          </p>
        )}

        <form onSubmit={handleSignup} className="mt-6 space-y-4">
          <input
            className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 outline-none focus:border-red-500"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

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
            {loading ? "Creating..." : "Sign Up"}
          </button>
        </form>

        <p className="mt-6 text-sm text-white/70">
          Already have an account?{" "}
          <Link href="/signin" className="text-red-400 hover:text-red-300">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}