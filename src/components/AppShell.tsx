"use client";

import { ReactNode } from "react";

import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";

type Props = {
  children: ReactNode;
};

export default function AppShell({ children }: Props) {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#050607] text-white">
      <Sidebar />

      <main className="relative min-h-screen pb-28 lg:pl-[290px] lg:pb-0">
        <div className="mx-auto w-full max-w-[1700px] px-4 py-4 sm:px-6 lg:px-8 lg:py-8">
          <div className="relative">
            <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[3rem]">
              <div className="absolute left-[-120px] top-[-120px] h-[260px] w-[260px] rounded-full bg-red-500/6 blur-[100px]" />

              <div className="absolute bottom-[-120px] right-[-120px] h-[260px] w-[260px] rounded-full bg-red-500/6 blur-[100px]" />
            </div>

            <div className="relative z-10">
              {children}
            </div>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}