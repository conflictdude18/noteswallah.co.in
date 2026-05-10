"use client";

import Link from "next/link";
import { RefreshCcw, TriangleAlert } from "lucide-react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error(error);

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <section className="relative w-full max-w-2xl overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#0b0f14]/80 p-8 text-center shadow-card backdrop-blur-2xl md:p-12">
        <div className="absolute left-[-90px] top-[-90px] h-56 w-56 rounded-full bg-red-500/20 blur-[120px]" />

        <div className="absolute bottom-[-90px] right-[-90px] h-56 w-56 rounded-full bg-red-700/10 blur-[120px]" />

        <div className="relative z-10">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[2rem] border border-red-500/20 bg-red-500/10 text-red-300 shadow-glow">
            <TriangleAlert size={44} />
          </div>

          <p className="mt-8 text-sm font-black uppercase tracking-[0.25em] text-red-300">
            Unexpected Error
          </p>

          <h1 className="mt-4 text-4xl font-black tracking-tight text-white md:text-6xl">
            Something Went Wrong
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-white/55 md:text-base">
            NotesWallah encountered an unexpected issue while loading this
            page. Try refreshing or return to the homepage.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={() => reset()}
              className="btn-primary"
            >
              <RefreshCcw size={18} />
              Try Again
            </button>

            <Link href="/" className="btn-secondary">
              Go Home
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}