import Link from "next/link";

const benefits = [
  {
    title: "Verified Notes",
    desc: "Only approved notes appear publicly, keeping quality high.",
  },
  {
    title: "Smart Filters",
    desc: "Find notes by class, subject, topic, and keywords.",
  },
  {
    title: "Student Powered",
    desc: "Upload your notes and help thousands of learners.",
  },
];

const steps = [
  "Create your free account",
  "Upload PDF notes with class and subject",
  "Admin verifies the notes",
  "Students browse and download",
];

export default function HomePage() {
  return (
    <main>
      <section className="container-max py-16 md:py-24">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="mb-4 inline-flex rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
              India&apos;s modern notes sharing platform
            </p>

            <h1 className="text-4xl font-bold leading-tight md:text-6xl">
              Study Smarter with{" "}
              <span className="text-red-500">NotesWallah</span>
            </h1>

            <p className="mt-5 max-w-2xl text-base text-white/70 md:text-lg">
              Upload, explore, and download high-quality PDF notes with smart
              filters like class, subject, and topic. Built for students who
              want results.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link href="/browse" className="btn-primary">
                Browse Notes
              </Link>
              <Link href="/upload" className="btn-secondary">
                Upload Notes
              </Link>
            </div>
          </div>

          <div className="glass-card p-6 md:p-8">
            <div className="rounded-2xl border border-white/10 bg-black/40 p-6">
              <p className="text-sm text-white/50">Featured Note</p>
              <h2 className="mt-3 text-2xl font-bold">
                Class 12 Physics — Current Electricity
              </h2>
              <p className="mt-3 text-white/60">
                Clean handwritten notes, PYQs, formulas, and important board
                exam questions.
              </p>

              <div className="mt-6 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-xl bg-white/5 p-4">
                  <p className="text-2xl font-bold text-red-400">12th</p>
                  <p className="text-xs text-white/50">Class</p>
                </div>
                <div className="rounded-xl bg-white/5 p-4">
                  <p className="text-2xl font-bold text-red-400">PDF</p>
                  <p className="text-xs text-white/50">Format</p>
                </div>
                <div className="rounded-xl bg-white/5 p-4">
                  <p className="text-2xl font-bold text-red-400">Free</p>
                  <p className="text-xs text-white/50">Access</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container-max pb-16">
        <div className="grid gap-6 md:grid-cols-3">
          {benefits.map((item) => (
            <div key={item.title} className="glass-card p-6">
              <h3 className="text-xl font-semibold">{item.title}</h3>
              <p className="mt-3 text-sm text-white/60">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-max pb-16">
        <div className="glass-card p-8 md:p-10">
          <h2 className="text-3xl font-bold">How NotesWallah Works</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {steps.map((step, index) => (
              <div key={step} className="rounded-2xl bg-white/5 p-5">
                <p className="text-3xl font-bold text-red-500">
                  0{index + 1}
                </p>
                <p className="mt-3 text-sm text-white/70">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-max pb-20">
        <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-8 text-center md:p-12">
          <h2 className="text-3xl font-bold">Ready to share your notes?</h2>
          <p className="mx-auto mt-3 max-w-2xl text-white/70">
            Help students across India learn better by uploading your best PDF
            notes today.
          </p>

          <div className="mt-8 flex justify-center">
            <Link href="/upload" className="btn-primary">
              Start Uploading
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}