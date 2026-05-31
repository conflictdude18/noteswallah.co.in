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

  applicationName: "NotesWallah",

  title: {
    default: "NotesWallah — Free Study Notes, PDFs, PYQs & Assignments",
    template: "%s | NotesWallah",
  },

  description:
    "India’s modern student platform to upload, browse and download free study notes, PDFs, assignments, PYQs and revision material.",

  keywords: [
    "NotesWallah",
    "study notes",
    "free notes",
    "PDF notes",
    "PYQs",
    "assignments",
    "student resources",
    "revision notes",
    "notes sharing platform",
    "download notes",
    "upload notes",
    "class notes",
  ],

  authors: [
    {
      name: "NotesWallah",
      url: "https://www.noteswallah.co.in",
    },
  ],

  creator: "NotesWallah",
  publisher: "NotesWallah",

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  openGraph: {
    title: "NotesWallah — Free Study Notes, PDFs, PYQs & Assignments",
    description:
      "India’s modern student platform to upload, browse and download free study notes, PDFs, assignments, PYQs and revision material.",
    url: "https://www.noteswallah.co.in",
    siteName: "NotesWallah",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "NotesWallah Study Platform",
      },
    ],
    locale: "en_IN",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "NotesWallah — Free Study Notes, PDFs, PYQs & Assignments",
    description:
      "India’s modern student platform to upload, browse and download free study notes, PDFs, assignments, PYQs and revision material.",
    images: ["/og-image.png"],
    creator: "@noteswallah",
  },

  alternates: {
    canonical: "https://www.noteswallah.co.in",
  },

  category: "education",
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
    url: "https://www.noteswallah.co.in",
    logo: "https://www.noteswallah.co.in/logo.png",
  };

  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <body className="min-h-screen overflow-x-hidden bg-[#050505] text-white selection:bg-red-500/30 selection:text-white">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema),
          }}
        />

        <AuthProvider>
          <LayoutClient>{children}</LayoutClient>

          <Toaster
            richColors
            theme="dark"
            position="top-right"
            toastOptions={{
              style: {
                background: "#111111",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#ffffff",
              },
            }}
          />

          <Analytics />
        </AuthProvider>
      </body>
    </html>
  );
}