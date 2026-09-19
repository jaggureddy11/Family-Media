"use client";

import React from "react";
import { Image as ImageIcon } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { Bi } from "@/components/Bi";
import { BigButton } from "@/components/BigButton";

export default function PhotosPlaceholderPage() {
  return (
    <PageShell titleKey="photos">
      <div className="flex flex-col items-center justify-center text-center py-12 sm:py-20 max-w-2xl mx-auto space-y-8">
        <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl bg-[var(--bg-surface)] border-4 border-[var(--border-subtle)] flex items-center justify-center text-[var(--accent)] shadow-lg">
          <ImageIcon className="w-16 h-16 sm:w-20 sm:h-20" />
        </div>

        <div className="space-y-4">
          <h2 className="text-[var(--text-heading)] font-extrabold text-white">
            <Bi k="photos" layout="auto" />
          </h2>
          <p className="text-[var(--text-body)] text-slate-300 font-medium">
            <Bi k="photosDescription" layout="auto" />
          </p>
          <div className="inline-block px-6 py-2 rounded-2xl bg-yellow-950/60 border-2 border-yellow-500 text-yellow-300 text-[var(--text-body)] font-bold">
            <Bi k="comingSoon" layout="auto" />
          </div>
        </div>

        <BigButton k="home" href="/" variant="primary" className="!min-w-[240px]" />
      </div>
    </PageShell>
  );
}
