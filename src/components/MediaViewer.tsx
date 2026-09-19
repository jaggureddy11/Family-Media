"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { Bi } from "./Bi";

export interface MediaViewerItem {
  id: string;
  type: "PHOTO" | "FAMILY_VIDEO" | "MOVIE" | "FILE";
  title_en: string;
  title_te: string;
  year?: number;
  takenAt?: string;
  bilingualDate?: { en: string; te: string };
  thumbUrl?: string | null;
  fullUrl?: string | null;
  durationSeconds?: number;
  isFavorite?: boolean;
}

interface MediaViewerProps {
  items: MediaViewerItem[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
  onFavoriteToggle?: (item: MediaViewerItem, isFav: boolean) => void;
  isAdmin?: boolean;
}

export const MediaViewer: React.FC<MediaViewerProps> = ({
  items,
  initialIndex = 0,
  isOpen,
  onClose,
  onFavoriteToggle,
  isAdmin = false,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isSlideshow, setIsSlideshow] = useState(false);
  const [favoritesMap, setFavoritesMap] = useState<Record<string, boolean>>({});
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  // Touch swipe support
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Sync initial index
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(Math.max(0, Math.min(initialIndex, items.length - 1)));
      setIsSlideshow(false);
      setIsVideoPlaying(false);

      // Initialize local favorites map
      const map: Record<string, boolean> = {};
      items.forEach((item) => {
        map[item.id] = !!item.isFavorite;
      });
      setFavoritesMap(map);
    }
  }, [isOpen, initialIndex, items]);

  const currentItem = items[currentIndex];

  const handleNext = useCallback(() => {
    setIsVideoPlaying(false);
    setCurrentIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
  }, [items.length]);

  const handlePrev = useCallback(() => {
    setIsVideoPlaying(false);
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
  }, [items.length]);

  // Slideshow timer: 6 seconds per slide
  useEffect(() => {
    if (!isSlideshow || !isOpen) return;

    const timer = setInterval(() => {
      handleNext();
    }, 6000);

    return () => clearInterval(timer);
  }, [isSlideshow, isOpen, handleNext]);

  // Preload neighbour photos for instant transition
  useEffect(() => {
    if (!isOpen || items.length <= 1) return;

    const preloadIndices = [
      (currentIndex + 1) % items.length,
      (currentIndex - 1 + items.length) % items.length,
    ];

    preloadIndices.forEach((idx) => {
      const itm = items[idx];
      if (itm && itm.fullUrl && (itm.type === "PHOTO" || itm.type === "FILE")) {
        const img = new window.Image();
        img.src = itm.fullUrl;
      }
    });
  }, [currentIndex, isOpen, items]);

  // Keyboard and D-pad controls
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowRight":
        case "PageDown":
          e.preventDefault();
          handleNext();
          break;
        case "ArrowLeft":
        case "PageUp":
          e.preventDefault();
          handlePrev();
          break;
        case "Escape":
        case "Backspace":
          e.preventDefault();
          onClose();
          break;
        case " ":
          e.preventDefault();
          setIsSlideshow((prev) => !prev);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleNext, handlePrev, onClose]);

  // Touch Swipe Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const diff = touchStartX.current - touchEndX.current;
    if (diff > 50) {
      handleNext();
    } else if (diff < -50) {
      handlePrev();
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  // Toggle Favorite
  const toggleFavorite = async () => {
    if (!currentItem) return;
    const newStatus = !favoritesMap[currentItem.id];

    // Optimistic UI update
    setFavoritesMap((prev) => ({ ...prev, [currentItem.id]: newStatus }));
    onFavoriteToggle?.(currentItem, newStatus);

    try {
      if (newStatus) {
        await fetch("/api/media/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mediaItemId: currentItem.id }),
        });
      } else {
        await fetch(`/api/media/favorites?id=${currentItem.id}`, {
          method: "DELETE",
        });
      }
    } catch (err) {
      console.error("Failed to toggle favorite:", err);
    }
  };

  if (!isOpen || !currentItem) return null;

  const isFavorited = !!favoritesMap[currentItem.id];
  const dateObj = currentItem.bilingualDate;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Full screen photo and video viewer"
      className="fixed inset-0 z-50 bg-black text-white flex flex-col justify-between select-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top Header Bar */}
      <header className="relative z-20 flex items-center justify-between p-3 sm:p-6 bg-gradient-to-b from-black via-black/80 to-transparent">
        {/* Back Button */}
        <button
          type="button"
          onClick={onClose}
          className="min-h-[56px] sm:min-h-[72px] px-4 sm:px-8 py-2 sm:py-3 bg-slate-900/90 hover:bg-slate-800 text-white rounded-2xl border-4 border-slate-700 hover:border-amber-400 font-bold text-xl sm:text-3xl flex items-center gap-2 sm:gap-3 transition-all focus:ring-4 focus:ring-amber-400 shrink-0"
          aria-label="Back, వెనుకకు"
        >
          <span className="text-2xl sm:text-3xl">←</span>
          <span className="hidden xs:inline">
            <Bi stringKey="back" />
          </span>
        </button>

        {/* Friendly Bilingual Date Header (No tech metadata) */}
        <div className="text-center px-2 sm:px-4 flex-1 min-w-0">
          {dateObj ? (
            <div className="font-bold text-base sm:text-2xl text-amber-400 truncate">
              <span>{dateObj.en}</span>
              <span className="mx-1 sm:mx-2 text-slate-500">·</span>
              <span className="text-white">{dateObj.te}</span>
            </div>
          ) : (
            <div className="font-bold text-base sm:text-2xl text-white truncate">
              {currentItem.title_en} · {currentItem.title_te}
            </div>
          )}
          <div className="text-xs sm:text-base text-slate-400 mt-0.5 font-mono">
            {currentIndex + 1} / {items.length}
          </div>
        </div>

        {/* Slideshow & Favorite Controls */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Slideshow Toggle */}
          <button
            type="button"
            onClick={() => setIsSlideshow((prev) => !prev)}
            className={`min-h-[56px] sm:min-h-[72px] px-3.5 sm:px-6 py-2 sm:py-3 rounded-2xl border-4 font-bold text-lg sm:text-2xl flex items-center gap-2 transition-all focus:ring-4 focus:ring-amber-400 ${
              isSlideshow
                ? "bg-amber-400 text-black border-amber-300 shadow-lg shadow-amber-400/30"
                : "bg-slate-900/90 text-white border-slate-700 hover:border-amber-400"
            }`}
            aria-label={isSlideshow ? "Pause Slideshow" : "Start Slideshow"}
          >
            <span className="text-xl sm:text-2xl">{isSlideshow ? "⏸" : "▶"}</span>
            <span className="hidden md:inline">
              <Bi stringKey={isSlideshow ? "pauseSlideshow" : "startSlideshow"} />
            </span>
          </button>

          {/* Big Favorite Heart Button */}
          <button
            type="button"
            onClick={toggleFavorite}
            className={`min-h-[56px] sm:min-h-[72px] px-3.5 sm:px-6 py-2 sm:py-3 rounded-2xl border-4 font-bold text-lg sm:text-2xl flex items-center gap-2 transition-all focus:ring-4 focus:ring-amber-400 ${
              isFavorited
                ? "bg-rose-600 text-white border-rose-400 shadow-lg shadow-rose-600/40 scale-105"
                : "bg-slate-900/90 text-white border-slate-700 hover:border-rose-400"
            }`}
            aria-label={isFavorited ? "Remove from Favorites" : "Add to Favorites"}
          >
            <span className="text-xl sm:text-2xl">{isFavorited ? "❤️" : "🤍"}</span>
            <span className="hidden md:inline">
              <Bi stringKey="favorite" />
            </span>
          </button>
        </div>
      </header>

      {/* Main Center Image / Video Display Area */}
      <main className="relative flex-1 flex items-center justify-center p-2 sm:p-4 overflow-hidden">
        {currentItem.type === "FAMILY_VIDEO" || currentItem.type === "MOVIE" ? (
          <div className="relative max-w-5xl w-full aspect-video bg-black rounded-3xl overflow-hidden flex items-center justify-center border-4 border-slate-800 shadow-2xl">
            {isVideoPlaying ? (
              <video
                src={currentItem.fullUrl || undefined}
                controls
                autoPlay
                playsInline
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="relative w-full h-full flex flex-col items-center justify-center bg-slate-950">
                {currentItem.thumbUrl && (
                  <Image
                    src={currentItem.thumbUrl}
                    alt={currentItem.title_en}
                    fill
                    unoptimized
                    className="object-contain opacity-50"
                  />
                )}
                <button
                  type="button"
                  onClick={() => setIsVideoPlaying(true)}
                  className="relative z-10 min-h-[88px] min-w-[200px] px-8 py-5 bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-3xl rounded-3xl border-4 border-amber-200 shadow-2xl flex items-center gap-4 transition-transform active:scale-95 focus:ring-8 focus:ring-amber-300"
                  aria-label="Play video"
                >
                  <span className="text-4xl">▶</span>
                  <Bi stringKey="play" />
                </button>
                <div className="relative z-10 mt-4 bg-black/80 px-4 py-2 rounded-xl text-lg text-slate-300 font-bold">
                  {currentItem.title_en} · {currentItem.title_te}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="relative w-full h-full flex items-center justify-center">
            {currentItem.fullUrl ? (
              <Image
                src={currentItem.fullUrl}
                alt={`${currentItem.title_en} · ${currentItem.title_te}`}
                fill
                unoptimized
                priority
                className="object-contain"
                sizes="100vw"
              />
            ) : (
              <div className="text-center text-slate-500 font-bold text-2xl">
                <Bi stringKey="gettingReady" />
              </div>
            )}
          </div>
        )}

        {/* Desktop / TV Floating Left & Right Navigation Arrows */}
        {items.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 min-h-[80px] min-w-[80px] sm:min-h-[88px] sm:min-w-[88px] bg-black/80 hover:bg-black text-amber-400 border-4 border-slate-700 hover:border-amber-400 rounded-3xl flex items-center justify-center text-4xl sm:text-5xl font-extrabold shadow-2xl transition-all active:scale-90 focus:ring-4 focus:ring-amber-400 z-20"
              aria-label="Previous, వెనుకటిది"
            >
              ←
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 min-h-[80px] min-w-[80px] sm:min-h-[88px] sm:min-w-[88px] bg-black/80 hover:bg-black text-amber-400 border-4 border-slate-700 hover:border-amber-400 rounded-3xl flex items-center justify-center text-4xl sm:text-5xl font-extrabold shadow-2xl transition-all active:scale-90 focus:ring-4 focus:ring-amber-400 z-20"
              aria-label="Next, తదుపరిది"
            >
              →
            </button>
          </>
        )}
      </main>

      {/* Bottom Big Touch Action Bar */}
      <footer className="p-4 sm:p-6 bg-gradient-to-t from-black via-black/80 to-transparent flex items-center justify-between gap-4 z-10">
        <button
          type="button"
          onClick={handlePrev}
          className="flex-1 min-h-[72px] sm:min-h-[88px] py-4 px-6 bg-slate-900/90 hover:bg-slate-800 text-white rounded-3xl border-4 border-slate-700 hover:border-amber-400 font-extrabold text-2xl sm:text-3xl flex items-center justify-center gap-3 transition-all active:scale-95 focus:ring-4 focus:ring-amber-400"
          aria-label="Previous, వెనుకటిది"
        >
          <span>←</span>
          <Bi stringKey="previous" />
        </button>

        {isSlideshow && (
          <div className="hidden md:flex items-center gap-2 text-amber-400 font-bold text-lg px-4 py-2 bg-amber-950/40 border-2 border-amber-500/40 rounded-2xl">
            <span className="animate-pulse">●</span>
            <Bi stringKey="slideIntervalNote" />
          </div>
        )}

        <button
          type="button"
          onClick={handleNext}
          className="flex-1 min-h-[72px] sm:min-h-[88px] py-4 px-6 bg-amber-400 hover:bg-amber-300 text-black rounded-3xl border-4 border-amber-200 font-extrabold text-2xl sm:text-3xl flex items-center justify-center gap-3 transition-all active:scale-95 focus:ring-4 focus:ring-amber-300"
          aria-label="Next, తదుపరిది"
        >
          <Bi stringKey="next" />
          <span>→</span>
        </button>
      </footer>
    </div>
  );
};
export default MediaViewer;
