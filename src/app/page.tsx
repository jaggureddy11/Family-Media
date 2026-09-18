"use client";

import React from "react";
import Link from "next/link";
import { Film, Image as ImageIcon, Video, Folder, Play } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { Bi } from "@/components/Bi";
import { BigTile } from "@/components/BigTile";

export default function HomePage() {
  return (
    <PageShell showBack={false} showHome={false}>
      <div className="flex flex-col gap-10 sm:gap-14 py-4 sm:py-6">
        {/* Warm Bilingual Greeting for Mom */}
        <div className="flex flex-col sm:flex-row items-start sm:items-baseline justify-between gap-4 border-b-4 border-[var(--border-subtle)] pb-6">
          <h1 className="text-[var(--text-heading)] font-extrabold tracking-tight">
            <Bi
              text={{ en: "Namaste, Amma", te: "నమస్తే, అమ్మా" }}
              layout="auto"
              enClassName="text-[var(--text-secondary)] text-[0.9em]"
              teClassName="text-[var(--accent)] text-[1.25em]"
            />
          </h1>

          <Link
            href="/styleguide"
            className="text-[var(--text-min)] text-slate-400 hover:text-white underline underline-offset-4"
          >
            Styleguide · స్టైల్ గైడ్
          </Link>
        </div>

        {/* Continue Watching Row */}
        <section className="flex flex-col gap-4">
          <h2 className="text-[var(--text-body)] font-bold text-yellow-300">
            <Bi k="continueWatching" layout="auto" />
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <BigTile
              titleEn="Maya Bazaar"
              titleTe="మాయాబజార్"
              meta="1957 · 2h 45m"
              aspectRatio="video"
              progressPercent={65}
              icon={<Play className="w-16 h-16 fill-current text-[var(--accent)]" />}
              href="/movies"
            />
          </div>
        </section>

        {/* Exactly 4 Giant Destination Buttons (2x2 on phone, 4 across on TV) */}
        <section className="flex flex-col gap-4">
          <h2 className="sr-only">
            <Bi text={{ en: "Main Media Destinations", te: "ప్రధాన విభాగాలు" }} />
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {/* 1. Movies */}
            <Link
              href="/movies"
              className="kutumbam-focus group flex flex-col items-center justify-center text-center p-8 sm:p-10 min-h-[220px] sm:min-h-[260px] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-elevated)] border-6 border-[var(--border-subtle)] hover:border-[var(--accent)] rounded-3xl cursor-pointer transition-all duration-200 active:scale-95"
              data-nav-item="true"
            >
              <div className="w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center text-[var(--accent)] mb-6 group-hover:scale-110 transition-transform">
                <Film className="w-16 h-16 sm:w-20 sm:h-20" />
              </div>
              <Bi
                k="movies"
                layout="stacked"
                className="font-bold text-[var(--text-heading)]"
                enClassName="text-[0.9em] text-[var(--text-secondary)]"
                teClassName="text-[1.2em] text-white"
              />
            </Link>

            {/* 2. Photos */}
            <Link
              href="/photos"
              className="kutumbam-focus group flex flex-col items-center justify-center text-center p-8 sm:p-10 min-h-[220px] sm:min-h-[260px] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-elevated)] border-6 border-[var(--border-subtle)] hover:border-[var(--accent)] rounded-3xl cursor-pointer transition-all duration-200 active:scale-95"
              data-nav-item="true"
            >
              <div className="w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center text-[var(--accent)] mb-6 group-hover:scale-110 transition-transform">
                <ImageIcon className="w-16 h-16 sm:w-20 sm:h-20" />
              </div>
              <Bi
                k="photos"
                layout="stacked"
                className="font-bold text-[var(--text-heading)]"
                enClassName="text-[0.9em] text-[var(--text-secondary)]"
                teClassName="text-[1.2em] text-white"
              />
            </Link>

            {/* 3. Family Videos */}
            <Link
              href="/family-videos"
              className="kutumbam-focus group flex flex-col items-center justify-center text-center p-8 sm:p-10 min-h-[220px] sm:min-h-[260px] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-elevated)] border-6 border-[var(--border-subtle)] hover:border-[var(--accent)] rounded-3xl cursor-pointer transition-all duration-200 active:scale-95"
              data-nav-item="true"
            >
              <div className="w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center text-[var(--accent)] mb-6 group-hover:scale-110 transition-transform">
                <Video className="w-16 h-16 sm:w-20 sm:h-20" />
              </div>
              <Bi
                k="familyVideos"
                layout="stacked"
                className="font-bold text-[var(--text-heading)]"
                enClassName="text-[0.9em] text-[var(--text-secondary)]"
                teClassName="text-[1.2em] text-white"
              />
            </Link>

            {/* 4. Other Files */}
            <Link
              href="/files"
              className="kutumbam-focus group flex flex-col items-center justify-center text-center p-8 sm:p-10 min-h-[220px] sm:min-h-[260px] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-elevated)] border-6 border-[var(--border-subtle)] hover:border-[var(--accent)] rounded-3xl cursor-pointer transition-all duration-200 active:scale-95"
              data-nav-item="true"
            >
              <div className="w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center text-[var(--accent)] mb-6 group-hover:scale-110 transition-transform">
                <Folder className="w-16 h-16 sm:w-20 sm:h-20" />
              </div>
              <Bi
                k="otherFiles"
                layout="stacked"
                className="font-bold text-[var(--text-heading)]"
                enClassName="text-[0.9em] text-[var(--text-secondary)]"
                teClassName="text-[1.2em] text-white"
              />
            </Link>
          </div>
        </section>
      </div>
    </PageShell>
  );
}
