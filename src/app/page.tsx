export default function HomePage() {
  return (
    <main className="container-max py-14">
      <section className="glass-card p-8 md:p-14">
        <h1 className="text-4xl font-bold leading-tight md:text-6xl">
          Study Smarter with{" "}
          <span className="text-red-500">NotesWallah</span>
        </h1>

        <p className="mt-5 max-w-2xl text-base text-white/70 md:text-lg">
          Upload, explore, and download high-quality notes with smart filters
          like class, subject, and topic. Built for students who want results.
        </p>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row">
          <a href="/browse" className="btn-primary">
            Browse Notes
          </a>
          <a href="/upload" className="btn-secondary">
            Upload Notes
          </a>
        </div>
      </section>
    </main>
  );
}