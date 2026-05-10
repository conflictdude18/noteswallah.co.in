import { Sparkles } from "lucide-react";

export default function LoadingSpinner() {
  return (
    <div className="flex min-h-[55vh] items-center justify-center px-4">
      <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#0b0f14]/80 p-8 shadow-card backdrop-blur-2xl">
        <div className="absolute left-[-70px] top-[-70px] h-40 w-40 rounded-full bg-red-500/20 blur-[90px]" />

        <div className="relative z-10 flex flex-col items-center">
          <div className="relative flex h-20 w-20 items-center justify-center">
            <div className="absolute inset-0 rounded-full border-4 border-red-500/10" />

            <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-red-500 border-r-red-400" />

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-300 shadow-glow">
              <Sparkles size={22} />
            </div>
          </div>

          <h2 className="mt-6 text-xl font-black tracking-tight text-white">
            Loading NotesWallah
          </h2>

          <p className="mt-2 text-sm font-semibold text-white/45">
            Preparing your experience...
          </p>

          <div className="mt-6 flex items-center gap-2">
            <div className="h-2 w-2 animate-bounce rounded-full bg-red-400" />
            <div
              className="h-2 w-2 animate-bounce rounded-full bg-red-400"
              style={{ animationDelay: "0.15s" }}
            />
            <div
              className="h-2 w-2 animate-bounce rounded-full bg-red-400"
              style={{ animationDelay: "0.3s" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}