export default function NoteCardSkeleton() {
  return (
    <div className="glass-card p-6 animate-pulse">
      <div className="h-5 w-2/3 rounded bg-white/10" />
      <div className="mt-4 h-4 w-full rounded bg-white/10" />
      <div className="mt-2 h-4 w-4/5 rounded bg-white/10" />

      <div className="mt-6 space-y-2">
        <div className="h-3 w-1/2 rounded bg-white/10" />
        <div className="h-3 w-1/3 rounded bg-white/10" />
        <div className="h-3 w-2/5 rounded bg-white/10" />
      </div>

      <div className="mt-6 flex justify-between">
        <div className="h-4 w-20 rounded bg-white/10" />
        <div className="h-8 w-20 rounded-xl bg-white/10" />
      </div>
    </div>
  );
}