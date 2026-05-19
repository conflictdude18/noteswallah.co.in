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
  metadataBase: new URL("https://www.noteswallah.co.in"),

  title: {
    default: "NotesWallah — Free Study Notes, PDFs, PYQs & Assignments",
    template: "%s | NotesWallah",
  },

  description:
    "Upload, browse and download free study notes, PDFs, assignments, PYQs and revision material. Built for students to share resources and study smarter.",

  keywords: [
    "NotesWallah",
    "free study notes",
    "PDF notes",
    "PYQs",
    "assignments",
    "revision material",
    "student resources",
    "download notes",
    "upload notes",
  ],

  openGraph: {
    title: "NotesWallah — Free Study Notes, PDFs, PYQs & Assignments",
    description:
      "Upload, browse and download free study notes, PDFs, assignments, PYQs and revision material. Built for students to share resources and study smarter.",
    url: "https://www.noteswallah.co.in",
    siteName: "NotesWallah",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "NotesWallah Study Notes Platform",
      },
    ],
    locale: "en_IN",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "NotesWallah — Free Study Notes, PDFs, PYQs & Assignments",
    description:
      "Upload, browse and download free study notes, PDFs, assignments, PYQs and revision material.",
    images: ["/og-image.png"],
  },

  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "NotesWallah",
    url: "https://noteswallah.co.in",
    logo: "https://noteswallah.co.in/logo.png",
  };

  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <body className="min-h-screen overflow-x-hidden bg-[#050607] pb-24 text-white selection:bg-red-500/30 selection:text-white lg:pb-0">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema),
          }}
        />

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