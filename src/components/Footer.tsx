"use client";
import Image from "next/image";
import Link from "next/link";
import {
  BookOpen,
  Heart,
  Camera,
  Mail,
  UploadCloud,
  Users,
} from "lucide-react";

export default function Footer() {
  return (
    <footer className="mt-4 border-t border-white/10 bg-[#050505]">
      <div className="container-max px-4 py-12">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="relative h-12 w-12 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                <Image
                  src="/icon.png"
                  alt="NotesWallah Logo"
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              </div>

              <div>
                <h2 className="text-2xl font-black text-white">
                  Notes<span className="text-red-500">Wallah</span>
                </h2>

                <p className="text-xs text-white/40">
                  Smart Notes Platform
                </p>
              </div>
            </div>

            <p className="mt-5 text-sm leading-7 text-white/55">
              NotesWallah helps students upload, discover and share useful study
              notes, PDFs and educational resources.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-black text-white">
              Explore
            </h3>

            <div className="mt-5 flex flex-col gap-3 text-sm text-white/60">
              <FooterLink href="/">Home</FooterLink>
              <FooterLink href="/browse">Browse Notes</FooterLink>
              <FooterLink href="/creators">Creators</FooterLink>
              <FooterLink href="/feedback">Feedback</FooterLink>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-black text-white">
              Students
            </h3>

            <div className="mt-5 flex flex-col gap-3 text-sm text-white/60">
              <FooterLink href="/saved-notes">
                Saved Notes
              </FooterLink>

              <FooterLink href="/following">
                Following Feed
              </FooterLink>

              <FooterLink href="/dashboard">
                Dashboard
              </FooterLink>

              <FooterLink href="/profile">
                Profile
              </FooterLink>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-black text-white">
              Connect
            </h3>

            <div className="mt-5 flex flex-col gap-3">
              <a
                href="https://instagram.com/noteswallah.co.in"
                target="_blank"
                className="flex items-center gap-3 text-sm text-white/60 transition hover:text-white"
              >
                <Camera size={17} />
                Instagram
              </a>

              <a
                href="mailto:support@noteswallah.co.in"
                className="flex items-center gap-3 text-sm text-white/60 transition hover:text-white"
              >
                <Mail size={17} />
                Contact
              </a>

              <Link
                href="/upload"
                className="flex items-center gap-3 text-sm text-white/60 transition hover:text-white"
              >
                <UploadCloud size={17} />
                Upload Notes
              </Link>

              <Link
                href="/creators"
                className="flex items-center gap-3 text-sm text-white/60 transition hover:text-white"
              >
                <Users size={17} />
                Top Creators
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-white/10 pt-6 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-white/40">
            © {new Date().getFullYear()} NotesWallah. All rights reserved.
          </p>

          <div className="flex items-center gap-2 text-sm text-white/45">
            Built with
            <Heart size={15} className="fill-red-500 text-red-500" />
            for students
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="transition hover:text-white"
    >
      {children}
    </Link>
  );
}