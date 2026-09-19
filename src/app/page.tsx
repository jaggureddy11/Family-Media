"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Film, Image as ImageIcon, Video, Folder, Play } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { Bi } from "@/components/Bi";
import { BigTile } from "@/components/BigTile";

interface ContinueItem {
  id: string;
  type: string;
  titleEn: string;
  titleTe: string;
  year?: number;
  durationSeconds: number;
  positionSeconds: number;
  percent: number;
  posterUrl?: string;
  thumbUrl?: string;
}

export default function HomePage() {
  const [profileNameEn, setProfileNameEn] = useState<string>("Amma");
  const [profileNameTe, setProfileNameTe] = useState<string>("అమ్మా");
  const [continueItems, setContinueItems] = useState<ContinueItem[]>([]);
  const [loadingContinue, setLoadingContinue] = useState(true);

  useEffect(() => {
    // 1. Fetch user profile from active session
    fetch("/api/auth/session")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          if (data.user.name_en) setProfileNameEn(data.user.name_en);
          if (data.user.name_te) setProfileNameTe(data.user.name_te);
        }
      })
      .catch(() => {});

    // 2. Fetch continue watching items
    fetch("/api/media/continue-watching")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.items && Array.isArray(data.items)) {
          setContinueItems(data.items);
        }
      })
      .catch(() => {})
      .finally(() => {
        setLoadingContinue(false);
      });
  }, []);

  return (
    <PageShell
      showBack={false}
      showHome={false}
      showUpload={true}
      topLeftAction={
        <Link
          href="/"
          className="flex items-center gap-1 sm:gap-2 px-1 py-0.5 rounded-xl focus:outline-none focus:ring-4 focus:ring-yellow-400 group"
          aria-label="Kutumbam Home"
        >
          <span className="text-lg sm:text-2xl md:text-3xl font-extrabold text-yellow-400 tracking-tight group-hover:brightness-110">
            కుటుంబం
          </span>
          <span className="text-xs sm:text-sm md:text-base font-medium text-stone-300">
            · Kutumbam
          </span>
        </Link>
      }
    >
      <div className="flex flex-col gap-4 sm:gap-8 py-2 sm:py-6">
        {/* Warm Bilingual Greeting from Mom's Profile */}
        <div className="flex flex-col sm:flex-row items-start sm:items-baseline justify-between gap-2 border-b-4 border-[var(--border-subtle)] pb-3 sm:pb-5">
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
            <Bi
              text={{
                en: `Namaste, ${profileNameEn}`,
                te: `నమస్తే, ${profileNameTe}`,
              }}
              layout="auto"
              enClassName="text-[var(--text-secondary)] text-[0.85em]"
              teClassName="text-[var(--accent)] text-[1.15em]"
            />
          </h1>
        </div>

        {/* Continue Watching Row (Only shown if items exist) */}
        {!loadingContinue && continueItems.length > 0 && (
          <section className="flex flex-col gap-3">
            <h2 className="text-lg sm:text-2xl font-bold text-yellow-300">
              <Bi k="continueWatching" layout="auto" />
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {continueItems.slice(0, 4).map((item) => (
                <BigTile
                  key={item.id}
                  titleEn={item.titleEn}
                  titleTe={item.titleTe}
                  meta={
                    item.year
                      ? `${item.year} · ${Math.round(item.percent)}%`
                      : `${Math.round(item.percent)}%`
                  }
                  aspectRatio="video"
                  progressPercent={item.percent}
                  imageUrl={item.posterUrl || item.thumbUrl}
                  icon={<Play className="w-12 h-12 sm:w-16 sm:h-16 fill-current text-[var(--accent)]" />}
                  href={`/watch/${item.id}`}
                />
              ))}
            </div>
          </section>
        )}

        {/* Exactly 4 Giant Destination Buttons: Movies, Photos, Family Videos, Other Files */}
        <section className="flex flex-col gap-3">
          <h2 className="sr-only">
            <Bi text={{ en: "Main Destinations", te: "ప్రధాన విభాగాలు" }} />
          </h2>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {/* 1. Movies */}
            <Link
              href="/movies"
              className="kutumbam-focus group flex flex-col items-center justify-center text-center p-3.5 sm:p-8 min-h-[140px] sm:min-h-[220px] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-elevated)] border-4 sm:border-6 border-[var(--border-subtle)] hover:border-[var(--accent)] rounded-2xl sm:rounded-3xl cursor-pointer transition-all duration-200 active:scale-95"
              data-nav-item="true"
            >
              <div className="w-12 h-12 sm:w-20 sm:h-20 flex items-center justify-center text-[var(--accent)] mb-2 sm:mb-4 group-hover:scale-110 transition-transform">
                <Film className="w-10 h-10 sm:w-16 sm:h-16" />
              </div>
              <Bi
                k="movies"
                layout="stacked"
                className="font-bold text-base sm:text-2xl md:text-3xl"
                enClassName="text-[0.8em] sm:text-[0.9em] text-[var(--text-secondary)]"
                teClassName="text-[1.05em] sm:text-[1.2em] text-white"
              />
            </Link>

            {/* 2. Photos */}
            <Link
              href="/photos"
              className="kutumbam-focus group flex flex-col items-center justify-center text-center p-3.5 sm:p-8 min-h-[140px] sm:min-h-[220px] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-elevated)] border-4 sm:border-6 border-[var(--border-subtle)] hover:border-[var(--accent)] rounded-2xl sm:rounded-3xl cursor-pointer transition-all duration-200 active:scale-95"
              data-nav-item="true"
            >
              <div className="w-12 h-12 sm:w-20 sm:h-20 flex items-center justify-center text-[var(--accent)] mb-2 sm:mb-4 group-hover:scale-110 transition-transform">
                <ImageIcon className="w-10 h-10 sm:w-16 sm:h-16" />
              </div>
              <Bi
                k="photos"
                layout="stacked"
                className="font-bold text-base sm:text-2xl md:text-3xl"
                enClassName="text-[0.8em] sm:text-[0.9em] text-[var(--text-secondary)]"
                teClassName="text-[1.05em] sm:text-[1.2em] text-white"
              />
            </Link>

            {/* 3. Family Videos */}
            <Link
              href="/family-videos"
              className="kutumbam-focus group flex flex-col items-center justify-center text-center p-3.5 sm:p-8 min-h-[140px] sm:min-h-[220px] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-elevated)] border-4 sm:border-6 border-[var(--border-subtle)] hover:border-[var(--accent)] rounded-2xl sm:rounded-3xl cursor-pointer transition-all duration-200 active:scale-95"
              data-nav-item="true"
            >
              <div className="w-12 h-12 sm:w-20 sm:h-20 flex items-center justify-center text-[var(--accent)] mb-2 sm:mb-4 group-hover:scale-110 transition-transform">
                <Video className="w-10 h-10 sm:w-16 sm:h-16" />
              </div>
              <Bi
                k="familyVideos"
                layout="stacked"
                className="font-bold text-base sm:text-2xl md:text-3xl"
                enClassName="text-[0.8em] sm:text-[0.9em] text-[var(--text-secondary)]"
                teClassName="text-[1.05em] sm:text-[1.2em] text-white"
              />
            </Link>

            {/* 4. Other Files */}
            <Link
              href="/files"
              className="kutumbam-focus group flex flex-col items-center justify-center text-center p-3.5 sm:p-8 min-h-[140px] sm:min-h-[220px] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-elevated)] border-4 sm:border-6 border-[var(--border-subtle)] hover:border-[var(--accent)] rounded-2xl sm:rounded-3xl cursor-pointer transition-all duration-200 active:scale-95"
              data-nav-item="true"
            >
              <div className="w-12 h-12 sm:w-20 sm:h-20 flex items-center justify-center text-[var(--accent)] mb-2 sm:mb-4 group-hover:scale-110 transition-transform">
                <Folder className="w-10 h-10 sm:w-16 sm:h-16" />
              </div>
              <Bi
                k="otherFiles"
                layout="stacked"
                className="font-bold text-base sm:text-2xl md:text-3xl"
                enClassName="text-[0.8em] sm:text-[0.9em] text-[var(--text-secondary)]"
                teClassName="text-[1.05em] sm:text-[1.2em] text-white"
              />
            </Link>
          </div>
        </section>
      </div>
    </PageShell>
  );
}
