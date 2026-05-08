"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
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
    <div className="container-max flex flex-1 items-center justify-center py-14">
      <div className="glass-card w-full max-w-md p-8">
        <h1 className="text-3xl font-bold">Welcome Back</h1>

        <p className="mt-2 text-white/70">
          Sign in to access NotesWallah.
        </p>

        {error && (
          <div className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="btn-secondary mt-6 w-full"
        >
          Continue with Google
        </button>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-xs text-white/40">OR</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <form onSubmit={handleEmailLogin} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm text-white/80"
            >
              Email
            </label>

            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-red-500"
              required
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm text-white/80"
            >
              Password
            </label>

            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-red-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-white/60">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="text-red-400 hover:text-red-300"
          >
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}