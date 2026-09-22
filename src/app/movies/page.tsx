"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Mic, MicOff, Star, Play, RotateCcw, X } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { Bi } from "@/components/Bi";
import { BigButton } from "@/components/BigButton";
import { BigTile } from "@/components/BigTile";

interface Movie {
  id: string;
  type: string;
  status: string;
  titleEn: string;
  titleTe: string;
  year?: number;
  durationSeconds: number;
  posterUrl?: string;
  thumbUrl?: string;
  isFavorite: boolean;
  progress?: {
    positionSeconds: number;
    durationSeconds: number;
    isCompleted: boolean;
    percent: number;
  } | null;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function MoviesPage() {
  const router = useRouter();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<"ALL" | "TELUGU" | "FAVORITES">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState(false);

  // Resume modal state
  const [resumeMovie, setResumeMovie] = useState<Movie | null>(null);

  // Load movies
  const fetchMovies = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeFilter !== "ALL") params.append("filter", activeFilter);
      if (searchQuery.trim()) params.append("q", searchQuery.trim());

      const res = await fetch(`/api/media/movies?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setMovies(data.movies || []);
      }
    } catch (err) {
      console.error("Failed to load movies:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovies();
  }, [activeFilter, searchQuery]);

  // Voice Search Web Speech API
  const startVoiceSearch = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceError(true);
      setTimeout(() => setVoiceError(false), 4000);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "te-IN"; // Telugu (India) fallback to English
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setSearchQuery(transcript);
          setShowSearchModal(false);
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (e) {
      console.error("Voice recognition failed:", e);
      setVoiceError(true);
      setTimeout(() => setVoiceError(false), 4000);
    }
  };

  const handleTileClick = (movie: Movie) => {
    if (
      movie.progress &&
      movie.progress.positionSeconds > 10 &&
      !movie.progress.isCompleted &&
      movie.progress.percent < 95
    ) {
      // Has existing progress -> prompt Resume vs Start Over
      setResumeMovie(movie);
    } else {
      // Direct playback
      router.push(`/watch/${movie.id}`);
    }
  };

  return (
    <PageShell
      titleKey="movies"
      headerAction={
        <BigButton
          k="search"
          size="small"
          icon={<Search className="w-4 h-4 sm:w-5 sm:h-5" />}
          onClick={() => setShowSearchModal(true)}
          variant="accent"
          className="!min-h-[38px] sm:!min-h-[44px] !px-2.5 sm:!px-3.5 !py-1 !text-xs sm:!text-sm font-bold rounded-xl shrink whitespace-nowrap"
        />
      }
    >
      <div className="flex flex-col gap-6 sm:gap-8 pb-16">
        {/* Three Big Filter Chips: All · అన్నీ, Telugu · తెలుగు, Favorites · ఇష్టమైనవి */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <button
            type="button"
            onClick={() => setActiveFilter("ALL")}
            className={`kutumbam-focus min-h-[56px] sm:min-h-[72px] px-4 sm:px-8 rounded-2xl font-bold text-base sm:text-[var(--text-btn)] border-3 sm:border-4 transition-all duration-150 active:scale-95 ${
              activeFilter === "ALL"
                ? "bg-[var(--accent)] text-black border-white shadow-lg"
                : "bg-[var(--bg-surface)] text-white border-[var(--border-thick)] hover:border-slate-300"
            }`}
            data-nav-item="true"
          >
            <Bi k="all" />
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter("TELUGU")}
            className={`kutumbam-focus min-h-[56px] sm:min-h-[72px] px-4 sm:px-8 rounded-2xl font-bold text-base sm:text-[var(--text-btn)] border-3 sm:border-4 transition-all duration-150 active:scale-95 ${
              activeFilter === "TELUGU"
                ? "bg-[var(--accent)] text-black border-white shadow-lg"
                : "bg-[var(--bg-surface)] text-white border-[var(--border-thick)] hover:border-slate-300"
            }`}
            data-nav-item="true"
          >
            <Bi k="telugu" />
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter("FAVORITES")}
            className={`kutumbam-focus min-h-[56px] sm:min-h-[72px] px-4 sm:px-8 rounded-2xl font-bold text-base sm:text-[var(--text-btn)] border-3 sm:border-4 flex items-center gap-2 sm:gap-3 transition-all duration-150 active:scale-95 ${
              activeFilter === "FAVORITES"
                ? "bg-[var(--accent)] text-black border-white shadow-lg"
                : "bg-[var(--bg-surface)] text-white border-[var(--border-thick)] hover:border-slate-300"
            }`}
            data-nav-item="true"
          >
            <Star className="w-5 h-5 sm:w-6 sm:h-6 fill-current shrink-0" />
            <Bi k="favorites" />
          </button>

          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="min-h-[56px] sm:min-h-[64px] px-3.5 sm:px-5 bg-red-950/80 border-2 border-red-500 text-red-200 rounded-2xl text-sm sm:text-[var(--text-body)] font-bold flex items-center gap-2 hover:bg-red-900"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
              <span>&quot;{searchQuery}&quot;</span>
              <span className="text-[0.85em] text-red-300">
                (<Bi k="clearSearch" />)
              </span>
            </button>
          )}
        </div>

        {/* Poster Grid: 2 per row on phone (390px), 3 on TV (1920px) */}
        {loading ? (
          <div className="py-20 text-center text-white text-[var(--text-body)] font-medium">
            <Bi k="gettingReady" />
          </div>
        ) : movies.length === 0 ? (
          <div className="py-12 sm:py-20 px-4 sm:px-6 text-center bg-[var(--bg-surface)] border-4 border-[var(--border-subtle)] rounded-3xl space-y-6 max-w-xl mx-auto">
            <p className="text-xl sm:text-[var(--text-heading)] font-bold text-slate-300">
              {searchQuery ? <Bi k="noMoviesFound" /> : <Bi k="noMoviesEmpty" />}
            </p>
            {searchQuery && (
              <BigButton
                k="clearSearch"
                onClick={() => setSearchQuery("")}
                variant="accent"
                className="mx-auto"
              />
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-8">
            {movies.map((movie) => {
              const metaParts = [];
              if (movie.year) metaParts.push(`${movie.year}`);
              if (movie.durationSeconds) {
                const hours = Math.floor(movie.durationSeconds / 3600);
                const mins = Math.floor((movie.durationSeconds % 3600) / 60);
                metaParts.push(`${hours}h ${mins}m`);
              }

              const hasResumeProgress =
                movie.progress &&
                movie.progress.positionSeconds > 10 &&
                !movie.progress.isCompleted &&
                movie.progress.percent < 95;

              return (
                <div key={movie.id} className="relative group">
                  <BigTile
                    titleEn={movie.titleEn}
                    titleTe={movie.titleTe}
                    meta={metaParts.join(" · ")}
                    imageUrl={movie.posterUrl || movie.thumbUrl}
                    aspectRatio="poster"
                    progressPercent={movie.progress?.percent || 0}
                    href={hasResumeProgress ? undefined : `/watch/${movie.id}`}
                    onClick={() => handleTileClick(movie)}
                  />
                  {movie.isFavorite && (
                    <div className="absolute top-4 right-4 z-10 p-2 bg-black/80 rounded-full border-2 border-yellow-400 text-yellow-400 pointer-events-none">
                      <Star className="w-7 h-7 fill-current" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Fullscreen Search Modal with Voice Input */}
      {/* Fullscreen Search Modal with Voice Input */}
      {showSearchModal && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex flex-col p-4 sm:p-10 justify-start items-center overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-3xl flex justify-between items-center mb-4 sm:mb-8 border-b-4 border-slate-800 pb-3 sm:pb-4">
            <h2 className="text-xl sm:text-[var(--text-heading)] font-extrabold text-white">
              <Bi k="search" layout="auto" />
            </h2>
            <BigButton
              k="close"
              icon={<X className="w-6 h-6 sm:w-8 sm:h-8" />}
              onClick={() => setShowSearchModal(false)}
              variant="secondary"
              className="!min-h-[48px] sm:!min-h-[64px] !px-4 sm:!px-6 !text-sm sm:!text-[var(--text-btn)]"
            />
          </div>

          <div className="w-full max-w-3xl space-y-4 sm:space-y-6">
            <div className="relative flex items-center">
              <input
                type="search"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Maya Bazaar / మాయాబజార్..."
                className="w-full min-h-[64px] sm:min-h-[84px] px-4 sm:px-6 pr-16 sm:pr-24 bg-[var(--bg-surface-elevated)] border-3 sm:border-4 border-white text-white rounded-2xl sm:rounded-3xl text-base sm:text-[var(--text-btn)] font-medium placeholder-slate-400 focus:ring-4 sm:focus:ring-6 focus:ring-yellow-400 outline-none"
              />
              <button
                type="button"
                onClick={startVoiceSearch}
                aria-label="Voice Search · వాయిస్ సెర్చ్"
                className={`absolute right-2 sm:right-4 p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border-2 transition-all ${
                  isListening
                    ? "bg-red-600 border-white text-white animate-pulse"
                    : "bg-slate-800 border-slate-600 text-yellow-400 hover:bg-slate-700"
                }`}
              >
                {isListening ? (
                  <MicOff className="w-6 h-6 sm:w-8 sm:h-8" />
                ) : (
                  <Mic className="w-6 h-6 sm:w-8 sm:h-8" />
                )}
              </button>
            </div>

            {isListening && (
              <div className="p-4 sm:p-6 bg-red-950/80 border-3 sm:border-4 border-red-500 rounded-2xl text-center text-red-200 text-base sm:text-[var(--text-body)] font-bold animate-pulse">
                <Bi k="listening" /> · <Bi k="speakNow" />
              </div>
            )}

            {voiceError && (
              <div className="p-3.5 sm:p-4 bg-slate-800 border-2 border-slate-600 rounded-2xl text-center text-slate-300 text-sm sm:text-[var(--text-body)]">
                <Bi k="voiceNotSupported" />
              </div>
            )}

            <div className="flex gap-3 sm:gap-4">
              <BigButton
                k="search"
                onClick={() => setShowSearchModal(false)}
                variant="accent"
                className="flex-1 !min-h-[56px] sm:!min-h-[84px] !text-base sm:!text-[var(--text-btn)]"
              />
              {searchQuery && (
                <BigButton
                  k="clearSearch"
                  onClick={() => setSearchQuery("")}
                  variant="secondary"
                  className="!min-h-[56px] sm:!min-h-[84px] !px-4 sm:!px-8 !text-base sm:!text-[var(--text-btn)]"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reassuring Resume Modal (Two Big Buttons) */}
      {resumeMovie && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-3.5 sm:p-8 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-[var(--bg-surface-elevated)] border-4 sm:border-6 border-[var(--accent)] rounded-2xl sm:rounded-3xl p-5 sm:p-12 max-w-2xl w-full flex flex-col items-center text-center gap-6 sm:gap-8 shadow-2xl">
            <h2 className="text-xl sm:text-[var(--text-heading)] font-bold text-white">
              {resumeMovie.titleEn}
              <div className="text-[1.1em] sm:text-[1.2em] text-yellow-300 font-sans mt-1.5 sm:mt-2">
                {resumeMovie.titleTe}
              </div>
            </h2>

            <div className="flex flex-col w-full gap-3.5 sm:gap-5">
              {/* Button 1: Resume from [time] · [time] నుండి కొనసాగించండి */}
              <button
                type="button"
                onClick={() => router.push(`/watch/${resumeMovie.id}?resume=true`)}
                className="kutumbam-focus min-h-[64px] sm:min-h-[88px] px-4 sm:px-8 py-3.5 sm:py-5 bg-[var(--accent)] hover:bg-yellow-300 text-black border-3 sm:border-4 border-white rounded-2xl sm:rounded-3xl flex items-center justify-center gap-3 sm:gap-4 text-base sm:text-[var(--text-btn)] font-extrabold shadow-lg active:scale-95"
                data-nav-item="true"
              >
                <Play className="w-7 h-7 sm:w-10 sm:h-10 fill-current shrink-0" />
                <Bi
                  text={{
                    en: `Resume from ${formatDuration(resumeMovie.progress?.positionSeconds || 0)}`,
                    te: `${formatDuration(resumeMovie.progress?.positionSeconds || 0)} నుండి కొనసాగించండి`,
                  }}
                  layout="stacked"
                  enClassName="text-[0.85em] sm:text-[0.9em]"
                  teClassName="text-[1em] sm:text-[1.1em] font-bold"
                />
              </button>

              {/* Button 2: Start over · మొదటి నుండి */}
              <button
                type="button"
                onClick={() => router.push(`/watch/${resumeMovie.id}?resume=false`)}
                className="kutumbam-focus min-h-[64px] sm:min-h-[88px] px-4 sm:px-8 py-3.5 sm:py-5 bg-slate-800 hover:bg-slate-700 text-white border-3 sm:border-4 border-slate-500 hover:border-white rounded-2xl sm:rounded-3xl flex items-center justify-center gap-3 sm:gap-4 text-base sm:text-[var(--text-btn)] font-bold shadow-lg active:scale-95"
                data-nav-item="true"
              >
                <RotateCcw className="w-6 h-6 sm:w-9 sm:h-9 shrink-0" />
                <Bi k="startOver" />
              </button>
            </div>

            <BigButton
              k="cancel"
              onClick={() => setResumeMovie(null)}
              variant="secondary"
              className="w-full mt-1 sm:mt-2 !min-h-[56px] sm:!min-h-[64px]"
            />
          </div>
        </div>
      )}
    </PageShell>
  );
}
