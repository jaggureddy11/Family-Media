"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Film, Image as ImageIcon, Video, Folder, Play, UploadCloud } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { Bi } from "@/components/Bi";
import { BigTile } from "@/components/BigTile";
import { BigButton } from "@/components/BigButton";

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
      topLeftAction={
        <BigButton
          k="uploadPhotosMovies"
          icon={<UploadCloud className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-300" />}
          href="/admin/upload"
          variant="secondary"
          className="!min-h-[56px] sm:!min-h-[80px] !px-3 sm:!px-6 !py-1 !text-[var(--text-min)] font-bold border-4 border-yellow-400/80 bg-yellow-400/10 hover:bg-yellow-400 hover:text-black shrink"
        />
      }
    >
      <div className="flex flex-col gap-10 sm:gap-14 py-4 sm:py-6">
        {/* Warm Bilingual Greeting from Mom's Profile */}
        <div className="flex flex-col sm:flex-row items-start sm:items-baseline justify-between gap-4 border-b-4 border-[var(--border-subtle)] pb-6">
          <h1 className="text-[var(--text-heading)] font-extrabold tracking-tight">
            <Bi
              text={{
                en: `Namaste, ${profileNameEn}`,
                te: `నమస్తే, ${profileNameTe}`,
              }}
              layout="auto"
              enClassName="text-[var(--text-secondary)] text-[0.9em]"
              teClassName="text-[var(--accent)] text-[1.25em]"
            />
          </h1>
        </div>

        {/* Continue Watching Row (Only shown if items exist) */}
        {!loadingContinue && continueItems.length > 0 && (
          <section className="flex flex-col gap-4">
            <h2 className="text-[var(--text-body)] font-bold text-yellow-300">
              <Bi k="continueWatching" layout="auto" />
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
                  icon={<Play className="w-16 h-16 fill-current text-[var(--accent)]" />}
                  href={`/watch/${item.id}`}
                />
              ))}
            </div>
          </section>
        )}

        {/* Exactly 4 Giant Destination Buttons: Movies, Photos, Family Videos, Other Files */}
        <section className="flex flex-col gap-4">
          <h2 className="sr-only">
            <Bi text={{ en: "Main Destinations", te: "ప్రధాన విభాగాలు" }} />
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
