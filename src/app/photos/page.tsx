"use client";

import React, { useState, useEffect, useTransition } from "react";
import Image from "next/image";
import { PageShell } from "@/components/PageShell";
import { Bi } from "@/components/Bi";
import { YearJumpBar } from "@/components/YearJumpBar";
import { MediaViewer, MediaViewerItem } from "@/components/MediaViewer";

interface TimelineGroup {
  key: string;
  year: number;
  month: number;
  title: { en: string; te: string };
  items: MediaViewerItem[];
}

interface Album {
  id: string;
  title_en: string;
  title_te: string;
  year?: number;
  count: number;
  coverUrl?: string | null;
  isAutoYearly?: boolean;
}

export default function PhotosPage() {
  const [activeTab, setActiveTab] = useState<"timeline" | "albums" | "favorites">("timeline");
  const [timelineGroups, setTimelineGroups] = useState<TimelineGroup[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [yearlyAlbums, setYearlyAlbums] = useState<Album[]>([]);
  const [customAlbums, setCustomAlbums] = useState<Album[]>([]);
  const [favoriteItems, setFavoriteItems] = useState<MediaViewerItem[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<{ id: string; title: { en: string; te: string }; items: MediaViewerItem[] } | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [, startTransition] = useTransition();

  // Fullscreen Viewer State
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerItems, setViewerItems] = useState<MediaViewerItem[]>([]);
  const [viewerInitialIndex, setViewerInitialIndex] = useState(0);

  // Active Year in View
  const [activeYear, setActiveYear] = useState<number | undefined>(undefined);

  // Fetch Timeline Data
  const fetchTimeline = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/media/photos?tab=timeline");
      if (res.ok) {
        const data = await res.json();
        setTimelineGroups(data.groups || []);
        setAvailableYears(data.availableYears || []);
        if (data.availableYears?.length > 0) {
          setActiveYear(data.availableYears[0]);
        }
      }
    } catch (err) {
      console.error("Failed to load timeline:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch Albums Data
  const fetchAlbums = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/media/photos?tab=albums");
      if (res.ok) {
        const data = await res.json();
        setYearlyAlbums(data.yearlyAlbums || []);
        setCustomAlbums(data.customAlbums || []);
      }
    } catch (err) {
      console.error("Failed to load albums:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch Favorites Data
  const fetchFavorites = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/media/photos?tab=favorites");
      if (res.ok) {
        const data = await res.json();
        setFavoriteItems(data.items || []);
      }
    } catch (err) {
      console.error("Failed to load favorites:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Load active tab data
  useEffect(() => {
    setSelectedAlbum(null);
    if (activeTab === "timeline") {
      fetchTimeline();
    } else if (activeTab === "albums") {
      fetchAlbums();
    } else if (activeTab === "favorites") {
      fetchFavorites();
    }
  }, [activeTab]);

  // Open album detail
  const handleOpenAlbum = async (alb: Album) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/media/photos?albumId=${alb.id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedAlbum({
          id: alb.id,
          title: { en: alb.title_en, te: alb.title_te },
          items: data.items || [],
        });
      }
    } catch (err) {
      console.error("Failed to open album:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Open Fullscreen Viewer
  const openViewer = (itemsList: MediaViewerItem[], index: number) => {
    setViewerItems(itemsList);
    setViewerInitialIndex(index);
    setViewerOpen(true);
  };

  // Scroll to Year Section
  const handleJumpToYear = (year: number) => {
    setActiveYear(year);
    const element = document.getElementById(`year-section-${year}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // All flat items for timeline continuous viewer
  const allTimelineItems = timelineGroups.flatMap((g) => g.items);

  return (
    <PageShell titleStringKey="photos">
      {/* 3 Top Navigation Destination Buttons */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-8">
        <button
          type="button"
          onClick={() => startTransition(() => setActiveTab("timeline"))}
          className={`min-h-[48px] sm:min-h-[88px] px-2 sm:px-6 py-1.5 sm:py-4 rounded-2xl sm:rounded-3xl font-extrabold text-xs sm:text-2xl flex items-center justify-center gap-1.5 sm:gap-3 border-2 sm:border-4 transition-all shadow-lg active:scale-95 focus:ring-4 focus:ring-amber-400 ${
            activeTab === "timeline" && !selectedAlbum
              ? "bg-amber-400 text-black border-amber-300 shadow-amber-400/20"
              : "bg-slate-900 text-white border-slate-700 hover:border-amber-400 hover:bg-slate-800"
          }`}
          aria-current={activeTab === "timeline" ? "page" : undefined}
        >
          <span className="text-base sm:text-3xl">🗓</span>
          <Bi stringKey="timeline" />
        </button>

        <button
          type="button"
          onClick={() => startTransition(() => setActiveTab("albums"))}
          className={`min-h-[48px] sm:min-h-[88px] px-2 sm:px-6 py-1.5 sm:py-4 rounded-2xl sm:rounded-3xl font-extrabold text-xs sm:text-2xl flex items-center justify-center gap-1.5 sm:gap-3 border-2 sm:border-4 transition-all shadow-lg active:scale-95 focus:ring-4 focus:ring-amber-400 ${
            activeTab === "albums" || selectedAlbum
              ? "bg-amber-400 text-black border-amber-300 shadow-amber-400/20"
              : "bg-slate-900 text-white border-slate-700 hover:border-amber-400 hover:bg-slate-800"
          }`}
          aria-current={activeTab === "albums" ? "page" : undefined}
        >
          <span className="text-base sm:text-3xl">📁</span>
          <Bi stringKey="albums" />
        </button>

        <button
          type="button"
          onClick={() => startTransition(() => setActiveTab("favorites"))}
          className={`min-h-[48px] sm:min-h-[88px] px-2 sm:px-6 py-1.5 sm:py-4 rounded-2xl sm:rounded-3xl font-extrabold text-xs sm:text-2xl flex items-center justify-center gap-1.5 sm:gap-3 border-2 sm:border-4 transition-all shadow-lg active:scale-95 focus:ring-4 focus:ring-amber-400 ${
            activeTab === "favorites" && !selectedAlbum
              ? "bg-amber-400 text-black border-amber-300 shadow-amber-400/20"
              : "bg-slate-900 text-white border-slate-700 hover:border-amber-400 hover:bg-slate-800"
          }`}
          aria-current={activeTab === "favorites" ? "page" : undefined}
        >
          <span className="text-base sm:text-3xl">❤️</span>
          <Bi stringKey="favorites" />
        </button>
      </div>

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mb-4" />
          <div className="text-2xl font-bold text-slate-400">
            <Bi stringKey="gettingReady" />
          </div>
        </div>
      ) : selectedAlbum ? (
        /* ALBUM DETAIL VIEW */
        <div>
          <div className="flex items-center justify-between mb-8 pb-4 border-b-2 border-slate-800">
            <div>
              <button
                type="button"
                onClick={() => setSelectedAlbum(null)}
                className="mb-3 px-5 py-2.5 bg-slate-800 text-amber-400 rounded-xl font-bold text-xl flex items-center gap-2 hover:bg-slate-700"
              >
                <span>←</span>
                <Bi stringKey="albums" />
              </button>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
                {selectedAlbum.title.en} · {selectedAlbum.title.te}
              </h2>
            </div>
            {selectedAlbum.items.length > 0 && (
              <button
                type="button"
                onClick={() => openViewer(selectedAlbum.items, 0)}
                className="min-h-[64px] px-8 bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-2xl rounded-2xl border-4 border-amber-200 flex items-center gap-3 shadow-lg"
              >
                <span>▶</span>
                <Bi stringKey="startSlideshow" />
              </button>
            )}
          </div>

          {selectedAlbum.items.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/60 rounded-3xl border-2 border-slate-800">
              <p className="text-2xl text-slate-400 font-bold">
                <Bi stringKey="noPhotosEmpty" />
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 min-[500px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {selectedAlbum.items.map((item, idx) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => openViewer(selectedAlbum.items, idx)}
                  className="group relative aspect-square bg-slate-900 rounded-3xl overflow-hidden border-4 border-slate-800 hover:border-amber-400 focus:ring-4 focus:ring-amber-400 transition-all shadow-md active:scale-95 flex flex-col"
                  aria-label={`${item.title_en} · ${item.title_te}`}
                >
                  {item.thumbUrl ? (
                    <Image
                      src={item.thumbUrl}
                      alt={item.title_en}
                      fill
                      unoptimized
                      className="object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl">
                      📷
                    </div>
                  )}
                  {item.type === "FAMILY_VIDEO" && (
                    <div className="absolute top-3 right-3 bg-black/80 px-3 py-1.5 rounded-xl text-amber-400 font-bold text-lg">
                      ▶ Video
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : activeTab === "albums" ? (
        /* ALBUMS TAB */
        <div className="space-y-12">
          {/* Custom Family Albums */}
          {customAlbums.length > 0 && (
            <div>
              <h2 className="text-3xl font-extrabold text-amber-400 mb-6 flex items-center gap-3">
                <span>📁</span>
                <Bi stringKey="customAlbums" />
              </h2>
              <div className="grid grid-cols-1 min-[500px]:grid-cols-2 lg:grid-cols-3 gap-6">
                {customAlbums.map((alb) => (
                  <button
                    key={alb.id}
                    type="button"
                    onClick={() => handleOpenAlbum(alb)}
                    className="group bg-slate-900 rounded-3xl overflow-hidden border-4 border-slate-800 hover:border-amber-400 focus:ring-4 focus:ring-amber-400 text-left transition-all shadow-lg active:scale-95"
                  >
                    <div className="relative aspect-video bg-slate-950 flex items-center justify-center">
                      {alb.coverUrl ? (
                        <Image
                          src={alb.coverUrl}
                          alt={alb.title_en}
                          fill
                          unoptimized
                          className="object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <span className="text-6xl">📁</span>
                      )}
                      <div className="absolute bottom-3 right-3 bg-black/80 px-3 py-1 rounded-xl text-white font-mono font-bold text-lg">
                        {alb.count} <Bi stringKey="photoCount" />
                      </div>
                    </div>
                    <div className="p-5 bg-slate-900 border-t-2 border-slate-800">
                      <h3 className="text-2xl font-bold text-white mb-1">{alb.title_en}</h3>
                      <h4 className="text-xl font-bold text-amber-300">{alb.title_te}</h4>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Yearly Auto Albums */}
          <div>
            <h2 className="text-3xl font-extrabold text-amber-400 mb-6 flex items-center gap-3">
              <span>📅</span>
              <Bi stringKey="yearlyAlbums" />
            </h2>
            {yearlyAlbums.length === 0 ? (
              <div className="text-center py-16 bg-slate-900/60 rounded-3xl border-2 border-slate-800">
                <p className="text-2xl text-slate-400 font-bold">
                  <Bi stringKey="noPhotosEmpty" />
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 min-[500px]:grid-cols-2 lg:grid-cols-3 gap-6">
                {yearlyAlbums.map((alb) => (
                  <button
                    key={alb.id}
                    type="button"
                    onClick={() => handleOpenAlbum(alb)}
                    className="group bg-slate-900 rounded-3xl overflow-hidden border-4 border-slate-800 hover:border-amber-400 focus:ring-4 focus:ring-amber-400 text-left transition-all shadow-lg active:scale-95"
                  >
                    <div className="relative aspect-video bg-slate-950 flex items-center justify-center">
                      {alb.coverUrl ? (
                        <Image
                          src={alb.coverUrl}
                          alt={alb.title_en}
                          fill
                          unoptimized
                          className="object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <span className="text-6xl">🗓</span>
                      )}
                      <div className="absolute bottom-3 right-3 bg-black/80 px-3 py-1 rounded-xl text-white font-mono font-bold text-lg">
                        {alb.count} <Bi stringKey="photoCount" />
                      </div>
                    </div>
                    <div className="p-5 bg-slate-900 border-t-2 border-slate-800">
                      <h3 className="text-3xl font-extrabold text-white mb-1">{alb.year}</h3>
                      <h4 className="text-2xl font-bold text-amber-300">{alb.title_te}</h4>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : activeTab === "favorites" ? (
        /* FAVORITES TAB */
        <div>
          <div className="flex items-center justify-between mb-8 pb-4 border-b-2 border-slate-800">
            <h2 className="text-3xl font-extrabold text-white flex items-center gap-3">
              <span className="text-rose-500">❤️</span>
              <Bi stringKey="favorites" />
            </h2>
            {favoriteItems.length > 0 && (
              <button
                type="button"
                onClick={() => openViewer(favoriteItems, 0)}
                className="min-h-[64px] px-8 bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-2xl rounded-2xl border-4 border-amber-200 flex items-center gap-3 shadow-lg"
              >
                <span>▶</span>
                <Bi stringKey="startSlideshow" />
              </button>
            )}
          </div>

          {favoriteItems.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/60 rounded-3xl border-2 border-slate-800">
              <p className="text-2xl text-slate-400 font-bold mb-2">
                <Bi stringKey="noFavoritesEmpty" />
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 min-[500px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {favoriteItems.map((item, idx) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => openViewer(favoriteItems, idx)}
                  className="group relative aspect-square bg-slate-900 rounded-3xl overflow-hidden border-4 border-slate-800 hover:border-amber-400 focus:ring-4 focus:ring-amber-400 transition-all shadow-md active:scale-95"
                >
                  {item.thumbUrl ? (
                    <Image
                      src={item.thumbUrl}
                      alt={item.title_en}
                      fill
                      unoptimized
                      className="object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl">
                      📷
                    </div>
                  )}
                  <div className="absolute top-3 right-3 text-2xl">❤️</div>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* TIMELINE TAB */
        <div>
          {/* Sticky Year Jump Bar */}
          <YearJumpBar
            years={availableYears}
            activeYear={activeYear}
            onSelectYear={handleJumpToYear}
          />

          {timelineGroups.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/60 rounded-3xl border-2 border-slate-800 mt-6">
              <p className="text-2xl text-slate-400 font-bold">
                <Bi stringKey="noPhotosEmpty" />
              </p>
            </div>
          ) : (
            <div className="space-y-12 mt-6">
              {timelineGroups.map((group) => (
                <section
                  key={group.key}
                  id={`year-section-${group.year}`}
                  className="scroll-mt-36"
                >
                  {/* Big Sticky Telugu Month Header */}
                  <div className="sticky top-36 z-10 py-3 mb-4 bg-slate-950/95 backdrop-blur-md border-b-2 border-amber-400/40 flex items-center justify-between">
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-amber-400">
                      <span>{group.title.te}</span>
                      <span className="mx-3 text-slate-500">·</span>
                      <span className="text-white">{group.title.en}</span>
                    </h2>
                    <span className="text-slate-400 font-mono font-bold text-xl">
                      {group.items.length} <Bi stringKey="photoCount" />
                    </span>
                  </div>

                  {/* Responsive Photo Tiles: 1-2 per row on mobile, 4-6 on TV */}
                  <div className="grid grid-cols-1 min-[500px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
                    {group.items.map((item) => {
                      const globalIdx = allTimelineItems.findIndex((m) => m.id === item.id);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => openViewer(allTimelineItems, Math.max(0, globalIdx))}
                          className="group relative aspect-square bg-slate-900 rounded-3xl overflow-hidden border-4 border-slate-800 hover:border-amber-400 focus:ring-4 focus:ring-amber-400 transition-all shadow-md active:scale-95 flex flex-col"
                          aria-label={`${item.title_en} · ${item.title_te}`}
                        >
                          {item.thumbUrl ? (
                            <Image
                              src={item.thumbUrl}
                              alt={item.title_en}
                              fill
                              unoptimized
                              className="object-cover group-hover:scale-105 transition-transform"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-5xl">
                              📷
                            </div>
                          )}

                          {item.type === "FAMILY_VIDEO" && (
                            <div className="absolute top-3 right-3 bg-black/80 px-3 py-1.5 rounded-xl text-amber-400 font-bold text-lg">
                              ▶ Video
                            </div>
                          )}

                          {item.isFavorite && (
                            <div className="absolute bottom-3 right-3 text-2xl drop-shadow">
                              ❤️
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Fullscreen Interactive Viewer Modal */}
      <MediaViewer
        isOpen={viewerOpen}
        items={viewerItems}
        initialIndex={viewerInitialIndex}
        onClose={() => setViewerOpen(false)}
        onFavoriteToggle={(item, isFav) => {
          // Sync local favorite items list
          if (isFav) {
            setFavoriteItems((prev) => [item, ...prev.filter((p) => p.id !== item.id)]);
          } else {
            setFavoriteItems((prev) => prev.filter((p) => p.id !== item.id));
          }
        }}
      />
    </PageShell>
  );
}
