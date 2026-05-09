import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-black text-white">
      {/* HERO */}
      <section className="container-max py-24">
        <div className="max-w-4xl">
          <div className="inline-flex rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">
            Student Powered Learning
          </div>

          <h1 className="mt-8 text-5xl font-black leading-tight md:text-7xl">
            India’s Modern
            <span className="block text-red-500">Notes Sharing</span>
            Platform
          </h1>

          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-white/70">
            Upload notes, browse study materials, save PDFs and help students
            learn smarter together.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link href="/browse" className="btn-primary">
              Browse Notes
            </Link>

            <Link href="/upload" className="btn-secondary">
              Upload Notes
            </Link>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="container-max pb-24">
        <div className="grid gap-5 md:grid-cols-4">
          {[
            ["100+", "Study Notes"],
            ["40+", "Students"],
            ["15+", "Subjects"],
            ["24/7", "Free Access"],
          ].map(([value, label]) => (
            <div key={label} className="glass-card p-6">
              <h3 className="text-4xl font-black text-red-500">{value}</h3>
              <p className="mt-3 text-white/50">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section className="border-t border-white/10 bg-zinc-950 py-24">
        <div className="container-max">
          <div className="max-w-3xl">
            <h2 className="text-5xl font-black">
              Why Students Use
              <span className="block text-red-500">NotesWallah</span>
            </h2>

            <p className="mt-6 text-lg text-white/60">
              Built for students who want organized, trusted and easy access to
              study material.
            </p>
          </div>

          <div className="mt-16 grid gap-6 md:grid-cols-3">
            <div className="glass-card p-8">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 text-3xl text-red-500">
                📚
              </div>

              <h3 className="mt-8 text-2xl font-bold">Smart Browsing</h3>

              <p className="mt-4 text-white/60">
                Find notes easily by class, subject and topic filters.
              </p>
            </div>

            <div className="glass-card p-8">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 text-3xl text-red-500">
                ⚡
              </div>

              <h3 className="mt-8 text-2xl font-bold">Instant Downloads</h3>

              <p className="mt-4 text-white/60">
                Download study material instantly without confusion.
              </p>
            </div>

            <div className="glass-card p-8">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 text-3xl text-red-500">
                👥
              </div>

              <h3 className="mt-8 text-2xl font-bold">Community Driven</h3>

              <p className="mt-4 text-white/60">
                Students help other students learn smarter together.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="container-max py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-5xl font-black">How It Works</h2>

          <p className="mt-6 text-lg text-white/60">
            NotesWallah makes sharing and finding notes simple.
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {[
            [
              "01",
              "Upload Notes",
              "Students upload useful PDFs, handwritten notes, PYQs and assignments.",
            ],
            [
              "02",
              "Admin Approval",
              "Uploaded notes are reviewed before they appear publicly.",
            ],
            [
              "03",
              "Browse & Download",
              "Students search, preview, save and download verified notes.",
            ],
          ].map(([step, title, desc]) => (
            <div key={step} className="glass-card p-8">
              <p className="text-5xl font-black text-red-500">{step}</p>

              <h3 className="mt-6 text-2xl font-bold">{title}</h3>

              <p className="mt-4 text-white/60">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="border-t border-white/10 bg-zinc-950 py-24">
        <div className="container-max text-center">
          <h2 className="text-5xl font-black">
            Start Sharing Knowledge Today
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-white/60">
            Upload your best notes and help students prepare better for exams.
          </p>

          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <Link href="/upload" className="btn-primary">
              Upload Notes
            </Link>

            <Link href="/browse" className="btn-secondary">
              Explore Notes
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}