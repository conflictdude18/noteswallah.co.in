"use client";

import { ReactNode } from "react";

import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";

type Props = {
  children: ReactNode;
};

export default function AppShell({ children }: Props) {
  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <Sidebar />

      <main className="min-h-screen pb-24 lg:pl-[290px] lg:pb-0">
        <div className="w-full px-4 py-4 sm:px-5 lg:px-6 lg:py-6">
          {children}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}