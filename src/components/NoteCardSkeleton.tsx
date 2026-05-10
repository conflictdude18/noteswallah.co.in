export default function NoteCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] shadow-card">
      <div className="relative h-56 overflow-hidden border-b border-white/10 bg-[#050607]">
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-red-500/5 via-white/[0.03] to-black" />

        <div className="absolute left-4 top-4 h-7 w-24 rounded-full bg-white/10 animate-pulse" />
      </div>

      <div className="p-5">
        <div className="h-7 w-4/5 rounded-xl bg-white/10 animate-pulse" />

        <div className="mt-4 space-y-2">
          <div className="h-4 w-full rounded-lg bg-white/10 animate-pulse" />
          <div className="h-4 w-5/6 rounded-lg bg-white/10 animate-pulse" />
          <div className="h-4 w-3/4 rounded-lg bg-white/10 animate-pulse" />
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <div className="h-8 w-24 rounded-full bg-white/10 animate-pulse" />
          <div className="h-8 w-28 rounded-full bg-white/10 animate-pulse" />
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-5">
          <div className="h-5 w-28 rounded-lg bg-white/10 animate-pulse" />

          <div className="h-10 w-28 rounded-full bg-white/10 animate-pulse" />
        </div>
      </div>
    </div>
  );
}