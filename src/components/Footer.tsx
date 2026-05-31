"use client";

import Image from "next/image";
import Link from "next/link";
import { Camera, Heart, Mail, UploadCloud, Users } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#050505]">
      <div className="container-max py-10 pb-28 lg:pb-10">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="relative h-11 w-11 overflow-hidden rounded-xl border border-white/10 bg-white/5">
                <Image
                  src="/icon.png"
                  alt="NotesWallah Logo"
                  fill
                  sizes="44px"
                  className="object-cover"
                />
              </div>

              <div>
                <h2 className="text-xl font-black tracking-tight text-white">
                  Notes<span className="text-red-500">Wallah</span>
                </h2>

                <p className="text-xs font-medium text-white/40">
                  Smart Notes Platform
                </p>
              </div>
            </div>

            <p className="mt-4 max-w-sm text-sm leading-6 text-white/50">
              Upload, discover and share useful study notes, PDFs and
              educational resources.
            </p>
          </div>

          <FooterSection title="Explore">
            <FooterLink href="/">Home</FooterLink>
            <FooterLink href="/browse">Browse Notes</FooterLink>
            <FooterLink href="/creators">Creators</FooterLink>
            <FooterLink href="/feedback">Feedback</FooterLink>
          </FooterSection>

          <FooterSection title="Students">
            <FooterLink href="/saved-notes">Saved Notes</FooterLink>
            <FooterLink href="/following">Following Feed</FooterLink>
            <FooterLink href="/dashboard">Dashboard</FooterLink>
            <FooterLink href="/profile">Profile</FooterLink>
          </FooterSection>

          <FooterSection title="Connect">
            <ExternalFooterLink href="https://instagram.com/noteswallah.co.in">
              <Camera size={16} />
              Instagram
            </ExternalFooterLink>

            <ExternalFooterLink href="mailto:support@noteswallah.co.in">
              <Mail size={16} />
              Contact
            </ExternalFooterLink>

            <FooterIconLink href="/upload">
              <UploadCloud size={16} />
              Upload Notes
            </FooterIconLink>

            <FooterIconLink href="/creators">
              <Users size={16} />
              Top Creators
            </FooterIconLink>
          </FooterSection>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-white/10 pt-5 text-sm text-white/40 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} NotesWallah. All rights reserved.</p>

          <p className="text-xs">
            Founded & developed by{" "}
            <a
              href="https://instagram.com/imxanshul"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-white/75 transition hover:text-red-400"
            >
              Anshul Harish Chaware
            </a>
          </p>

          <div className="flex items-center gap-2">
            Built with
            <Heart size={14} className="fill-red-500 text-red-500" />
            for students
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="text-sm font-black uppercase tracking-[0.18em] text-white/80">
        {title}
      </h3>

      <div className="mt-4 flex flex-col gap-2.5 text-sm text-white/55">
        {children}
      </div>
    </div>
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
    <Link href={href} className="transition hover:text-white">
      {children}
    </Link>
  );
}

function FooterIconLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 transition hover:text-white"
    >
      {children}
    </Link>
  );
}

function ExternalFooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const isMail = href.startsWith("mailto:");

  return (
    <a
      href={href}
      target={isMail ? undefined : "_blank"}
      rel={isMail ? undefined : "noopener noreferrer"}
      className="flex items-center gap-2.5 transition hover:text-white"
    >
      {children}
    </a>
  );
}