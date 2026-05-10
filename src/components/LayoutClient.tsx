"use client";

import { ReactNode } from "react";

import AppShell from "@/components/AppShell";

type Props = {
  children: ReactNode;
};

export default function LayoutClient({ children }: Props) {
  return (
    <AppShell>
      <div className="relative min-h-screen">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-[-180px] top-[-180px] h-[420px] w-[420px] rounded-full bg-red-500/10 blur-[150px]" />

          <div className="absolute right-[-180px] top-[20%] h-[320px] w-[320px] rounded-full bg-red-700/10 blur-[140px]" />

          <div className="absolute bottom-[-180px] left-[20%] h-[360px] w-[360px] rounded-full bg-red-500/8 blur-[160px]" />

          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.04),transparent_38%)]" />

          <div className="absolute inset-0 opacity-[0.03] [background-image:linear-gradient(rgba(255,255,255,0.7)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.7)_1px,transparent_1px)] [background-size:80px_80px]" />
        </div>

        <div className="relative z-10">
          <div className="mx-auto w-full max-w-[1700px]">
            {children}
          </div>
        </div>
      </div>
    </AppShell>
  );
}