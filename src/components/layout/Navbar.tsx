import Link from "next/link";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/50 backdrop-blur-xl">
      <div className="container-max flex h-16 items-center justify-between">
        <Link href="/" className="text-xl font-bold tracking-wide">
          <span className="text-white">Notes</span>
          <span className="text-red-500">Wallah</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link href="/browse" className="text-sm text-white/80 hover:text-white">
            Browse Notes
          </Link>
          <Link href="/premium" className="text-sm text-white/80 hover:text-white">
            Premium
          </Link>
          <Link href="/feedback" className="text-sm text-white/80 hover:text-white">
            Feedback
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/signin" className="btn-secondary">
            Sign In
          </Link>
          <Link href="/signup" className="btn-primary">
            Sign Up
          </Link>
        </div>
      </div>
    </header>
  );
}