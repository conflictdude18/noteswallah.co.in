"use client";

import { ReactNode } from "react";

import AppShell from "@/components/AppShell";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";

type Props = {
  children: ReactNode;
};

export default function LayoutClient({ children }: Props) {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen overflow-x-hidden bg-[#050505] text-white">
        {children}
      </div>
    );
  }

  return (
    <AppShell>
      <div className="min-h-screen overflow-x-hidden bg-[#050505] text-white">
        <main className="w-full px-0 pb-24 pt-3 sm:px-5 sm:pb-8 sm:pt-5 lg:px-8">
          <div className="mx-auto w-full max-w-[1760px]">
            {children}
          </div>
        </main>

        <Footer />
      </div>
    </AppShell>
  );
}