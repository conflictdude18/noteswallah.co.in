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
      <div className="flex min-h-screen overflow-x-hidden bg-[#050505] text-white">
        <div className="flex min-w-0 flex-1 flex-col">
          <main className="w-full flex-1 px-3 pb-24 pt-3 sm:px-5 sm:pb-8 sm:pt-5 lg:px-6">
            <div className="mx-auto w-full max-w-[1800px]">
              {children}
            </div>
          </main>

          <Footer />
        </div>
      </div>
    </AppShell>
  );
}