import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

import { AuthProvider } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";

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
    "NotesWallah is a modern platform where students can upload, browse, save, and download verified educational notes.",
  keywords: [
    "NotesWallah",
    "student notes",
    "PDF notes",
    "class 12 notes",
    "study notes",
    "education platform",
    "CBSE notes",
  ],
  authors: [{ name: "NotesWallah Team" }],
  creator: "NotesWallah",
  openGraph: {
    title: "NotesWallah — Smart Notes Sharing Platform",
    description:
      "Upload, browse, save, and download verified educational notes.",
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <Navbar />
          {children}
          <Toaster richColors position="top-right" theme="dark" />
        </AuthProvider>
      </body>
    </html>
  );
}