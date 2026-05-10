import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "sonner";

import "./globals.css";

import { AuthProvider } from "@/contexts/AuthContext";
import LayoutClient from "@/components/LayoutClient";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "NotesWallah — Smart Notes Sharing Platform",
    template: "%s | NotesWallah",
  },
  description:
    "NotesWallah is a modern educational platform where students upload, browse, save, and download study notes.",
  keywords: [
    "NotesWallah",
    "notes sharing",
    "study notes",
    "student notes",
    "education platform",
    "PDF notes",
    "CBSE notes",
    "Class 12 notes",
  ],
  authors: [{ name: "NotesWallah Team" }],
  creator: "NotesWallah",
  metadataBase: new URL("https://noteswallah.co.in"),
  openGraph: {
    title: "NotesWallah",
    description:
      "Upload, browse, save, and download educational notes easily.",
    url: "https://noteswallah.co.in",
    siteName: "NotesWallah",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <body className="min-h-screen overflow-x-hidden bg-[#050607] text-white selection:bg-red-500/30 selection:text-white">
        <div className="fixed inset-0 -z-10 bg-[#050607]" />
        <div className="fixed left-[-10%] top-[-10%] -z-10 h-[420px] w-[420px] rounded-full bg-red-500/10 blur-[140px]" />
        <div className="fixed bottom-[-12%] right-[-10%] -z-10 h-[420px] w-[420px] rounded-full bg-red-700/10 blur-[150px]" />
        <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.04),transparent_35%)]" />

        <AuthProvider>
          <LayoutClient>{children}</LayoutClient>

          <Toaster richColors theme="dark" position="top-right" />

          <Analytics />
        </AuthProvider>
      </body>
    </html>
  );
}