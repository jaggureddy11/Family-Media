"use client";

import React, { useState, useEffect, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import { Bi } from "@/components/Bi";

interface FamilyVideoItem {
  id: string;
  type: string;
  title_en: string;
  title_te: string;
  year: number;
  durationSeconds: number;
  posterUrl: string | null;
  videoUrl: string | null;
  bilingualDate?: { en: string; te: string };
  progress?: {
    positionSeconds: number;
    durationSeconds: number;
    isCompleted: boolean;
  } | null;
  isFavorite: boolean;
}

interface YearVideoGroup {
  year: number;
  title: { en: string; te: string };
  items: FamilyVideoItem[];
}

export default function FamilyVideosPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<YearVideoGroup[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "favorites">("all");
  const [isLoading, setIsLoading] = useState(true);
  const [, startTransition] = useTransition();

  // Resume Modal State
  const [selectedVideo, setSelectedVideo] = useState<FamilyVideoItem | null>(null);

  const fetchVideos = async () => {
    setIsLoading(true);
    try {
      const url = new URL("/api/media/family-videos", window.location.origin);
      if (searchQuery) url.searchParams.set("q", searchQuery);
      if (activeFilter === "favorites") url.searchParams.set("filter", "favorites");

      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        setGroups(data.groups || []);
      }
    } catch (err) {
      console.error("Failed to load family videos:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, [searchQuery, activeFilter]);

  const handleVideoClick = (video: FamilyVideoItem) => {
    if (video.progress && video.progress.positionSeconds > 10 && !video.progress.isCompleted) {
      setSelectedVideo(video);
    } else {
      router.push(`/watch/${video.id}`);
    }
  };

  const handleResume = (startOver: boolean) => {
    if (!selectedVideo) return;
    const url = `/watch/${selectedVideo.id}${startOver ? "?startOver=true" : ""}`;
    setSelectedVideo(null);
    router.push(url);
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${String(secs).padStart(2, "0")}`;
  };

  const formatTimeMinutes = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    return `${mins}m`;
  };

  return (
    <PageShell titleStringKey="familyVideos">
      {/* Search & Filter Header Bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        {/* Live Search Input */}
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search family videos... / వీడియోలను వెతకండి..."
            className="w-full min-h-[64px] sm:min-h-[72px] px-6 py-4 bg-slate-900 border-4 border-slate-700 rounded-3xl text-2xl font-bold text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-400"
            aria-label="Search family videos"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 min-h-[48px] px-4 bg-slate-800 text-slate-300 font-bold rounded-xl"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => startTransition(() => setActiveFilter("all"))}
            className={`min-h-[64px] sm:min-h-[72px] px-8 py-3 rounded-2xl font-extrabold text-2xl border-4 transition-all shadow-md focus:ring-4 focus:ring-amber-400 ${
              activeFilter === "all"
                ? "bg-amber-400 text-black border-amber-300 shadow-amber-400/20"
                : "bg-slate-900 text-white border-slate-700 hover:border-amber-400"
            }`}
          >
            <Bi stringKey="all" />
          </button>

          <button
            type="button"
            onClick={() => startTransition(() => setActiveFilter("favorites"))}
            className={`min-h-[64px] sm:min-h-[72px] px-8 py-3 rounded-2xl font-extrabold text-2xl border-4 transition-all shadow-md flex items-center gap-2 focus:ring-4 focus:ring-amber-400 ${
              activeFilter === "favorites"
                ? "bg-rose-600 text-white border-rose-400 shadow-rose-600/30"
                : "bg-slate-900 text-white border-slate-700 hover:border-rose-400"
            }`}
          >
            <span>❤️</span>
            <Bi stringKey="favorites" />
          </button>
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mb-4" />
          <div className="text-2xl font-bold text-slate-400">
            <Bi stringKey="gettingReady" />
          </div>
        </div>
      ) : groups.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/60 rounded-3xl border-2 border-slate-800">
          <p className="text-3xl text-slate-400 font-bold mb-4">
            <Bi stringKey="noVideosEmpty" />
          </p>
        </div>
      ) : (
        /* Video Groups by Year */
        <div className="space-y-12">
          {groups.map((group) => (
            <section key={group.year}>
              {/* Year Header */}
              <div className="py-3 mb-6 border-b-4 border-amber-400/40 flex items-center justify-between">
                <h2 className="text-3xl sm:text-4xl font-extrabold text-amber-400 flex items-center gap-3">
                  <span>📹</span>
                  <span>{group.title.te}</span>
                  <span className="text-slate-500">·</span>
                  <span className="text-white">{group.title.en}</span>
                </h2>
                <span className="text-slate-400 font-mono font-bold text-xl">
                  {group.items.length} <Bi stringKey="videoCount" />
                </span>
              </div>

              {/* 16:9 Landscape Video Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {group.items.map((video) => (
                  <button
                    key={video.id}
                    type="button"
                    onClick={() => handleVideoClick(video)}
                    className="group bg-slate-900 rounded-3xl overflow-hidden border-4 border-slate-800 hover:border-amber-400 focus:ring-4 focus:ring-amber-400 text-left transition-all shadow-xl active:scale-95 flex flex-col"
                    aria-label={`${video.title_en} · ${video.title_te}`}
                  >
                    {/* 16:9 Thumbnail Box */}
                    <div className="relative aspect-video w-full bg-slate-950 flex items-center justify-center">
                      {video.posterUrl ? (
                        <Image
                          src={video.posterUrl}
                          alt={video.title_en}
                          fill
                          unoptimized
                          className="object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <span className="text-6xl">📹</span>
                      )}

                      {/* Giant Play Icon Overlay */}
                      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                        <div className="w-20 h-20 bg-amber-400 text-black rounded-full flex items-center justify-center text-4xl font-bold shadow-2xl group-hover:scale-110 transition-transform">
                          ▶
                        </div>
                      </div>

                      {/* Duration on Solid Bar */}
                      <div className="absolute bottom-3 right-3 bg-black/90 px-3.5 py-1.5 rounded-xl text-amber-400 font-mono font-extrabold text-xl border border-slate-700">
                        {formatDuration(video.durationSeconds)}
                      </div>

                      {video.isFavorite && (
                        <div className="absolute top-3 right-3 text-2xl drop-shadow">
                          ❤️
                        </div>
                      )}
                    </div>

                    {/* Titles on Solid Bar Underneath */}
                    <div className="p-5 bg-slate-900 border-t-2 border-slate-800 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-1 group-hover:text-amber-400 transition-colors">
                          {video.title_te}
                        </h3>
                        <h4 className="text-xl sm:text-2xl font-bold text-slate-300">
                          {video.title_en}
                        </h4>
                      </div>

                      {/* Watch Progress Bar if started */}
                      {video.progress && video.progress.positionSeconds > 10 && !video.progress.isCompleted && (
                        <div className="mt-4 pt-3 border-t border-slate-800">
                          <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden mb-1">
                            <div
                              className="bg-amber-400 h-full rounded-full"
                              style={{
                                width: `${Math.min(
                                  100,
                                  (video.progress.positionSeconds /
                                    (video.progress.durationSeconds || 1)) *
                                    100
                                )}%`,
                              }}
                            />
                          </div>
                          <div className="text-sm font-mono text-amber-400 font-bold">
                            <Bi stringKey="resumeFrom" /> {formatTimeMinutes(video.progress.positionSeconds)}
                          </div>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* 2-Button Resume Modal */}
      {selectedVideo && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Resume Video Confirmation"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
        >
          <div className="w-full max-w-xl bg-slate-900 border-4 border-amber-400 rounded-3xl p-6 sm:p-8 shadow-2xl text-center">
            <h3 className="text-3xl sm:text-4xl font-extrabold text-white mb-2">
              {selectedVideo.title_te}
            </h3>
            <h4 className="text-2xl font-bold text-slate-400 mb-6">
              {selectedVideo.title_en}
            </h4>

            <p className="text-2xl text-amber-300 font-bold mb-8">
              <Bi stringKey="resumeFrom" /> {formatTimeMinutes(selectedVideo.progress?.positionSeconds || 0)}?
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                type="button"
                onClick={() => handleResume(false)}
                className="flex-1 min-h-[80px] px-6 py-4 bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-2xl rounded-2xl border-4 border-amber-200 shadow-lg active:scale-95 focus:ring-4 focus:ring-amber-300"
              >
                <Bi stringKey="resume" />
              </button>

              <button
                type="button"
                onClick={() => handleResume(true)}
                className="flex-1 min-h-[80px] px-6 py-4 bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-2xl rounded-2xl border-4 border-slate-600 active:scale-95 focus:ring-4 focus:ring-amber-400"
              >
                <Bi stringKey="startOver" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setSelectedVideo(null)}
              className="mt-6 text-slate-400 font-bold text-xl hover:text-white underline"
            >
              <Bi stringKey="cancel" />
            </button>
          </div>
        </div>
      )}
    </PageShell>
  );
}
