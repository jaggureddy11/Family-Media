"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Maximize,
  Minimize,
  Subtitles,
  ArrowLeft,
  Home,
  Film,
  HelpCircle,
} from "lucide-react";
import { Bi } from "@/components/Bi";
import { BigButton } from "@/components/BigButton";

interface MediaDetails {
  id: string;
  type: string;
  titleEn: string;
  titleTe: string;
  year?: number;
  durationSeconds: number;
}

interface WatchResponse {
  media: MediaDetails;
  urls: {
    videoUrl: string;
    posterUrl: string | null;
    subtitleUrl: string | null;
    expiresAt: number;
  };
  progress: {
    positionSeconds: number;
    durationSeconds: number;
    isCompleted: boolean;
  } | null;
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function WatchPlayerPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const id = typeof params.id === "string" ? params.id : Array.isArray(params.id) ? params.id[0] : "";
  const shouldResume = searchParams.get("resume") === "true";

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [loading, setLoading] = useState(true);
  const [mediaData, setMediaData] = useState<WatchResponse | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [subtitlesActive, setSubtitlesActive] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isEnded, setIsEnded] = useState(false);
  const [playbackError, setPlaybackError] = useState<string | null>(null);

  // 1. Fetch media details and signed URLs
  useEffect(() => {
    if (!id) return;

    setLoading(true);
    fetch(`/api/media/watch/${id}`)
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Failed to load movie stream");
        }
        return res.json();
      })
      .then((data: WatchResponse) => {
        setMediaData(data);
      })
      .catch((err) => {
        console.error("Watch load error:", err);
        setPlaybackError(err.message || "Failed to load video stream");
        // Log failure to admin library
        fetch("/api/media/error-log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mediaId: id,
            error: err.message || "Initial load error",
          }),
        }).catch(() => {});
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  // 2. Setup Wake Lock to keep screen awake during playback
  useEffect(() => {
    let wakeLock: any = null;
    const requestWakeLock = async () => {
      try {
        if ("wakeLock" in navigator && isPlaying) {
          wakeLock = await (navigator as any).wakeLock.request("screen");
        }
      } catch (e) {
        console.warn("Screen Wake Lock not active:", e);
      }
    };

    if (isPlaying) {
      requestWakeLock();
    } else if (wakeLock) {
      wakeLock.release().catch(() => {});
      wakeLock = null;
    }

    return () => {
      if (wakeLock) {
        wakeLock.release().catch(() => {});
      }
    };
  }, [isPlaying]);

  // 3. Save progress helper
  const saveProgress = useCallback(
    (pos: number, dur: number) => {
      if (!id || dur <= 0) return;
      fetch("/api/media/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mediaItemId: id,
          positionSeconds: pos,
          durationSeconds: dur,
        }),
      }).catch(() => {});
    },
    [id]
  );

  // 4. Send progress via sendBeacon on unload/exit
  useEffect(() => {
    const handleUnload = () => {
      if (!id || !videoRef.current) return;
      const pos = videoRef.current.currentTime;
      const dur = videoRef.current.duration || 0;
      if (dur > 0 && typeof navigator !== "undefined" && navigator.sendBeacon) {
        navigator.sendBeacon(
          "/api/media/progress",
          JSON.stringify({
            mediaItemId: id,
            positionSeconds: pos,
            durationSeconds: dur,
          })
        );
      }
    };

    window.addEventListener("pagehide", handleUnload);
    window.addEventListener("beforeunload", handleUnload);
    return () => {
      window.removeEventListener("pagehide", handleUnload);
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, [id]);

  // 5. Periodic progress save every 5s during playback
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      if (videoRef.current) {
        const pos = videoRef.current.currentTime;
        const dur = videoRef.current.duration || 0;
        if (dur > 0) {
          saveProgress(pos, dur);
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isPlaying, saveProgress]);

  // 6. Silent URL refresh before 2-hour expiration (refreshes every 45 mins)
  useEffect(() => {
    if (!id) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/media/watch/${id}/refresh`, { method: "POST" });
        if (res.ok) {
          const data = await res.json();
          // Keep current source or smoothly continue
          if (data.videoUrl && mediaData) {
            setMediaData((prev) =>
              prev
                ? {
                    ...prev,
                    urls: { ...prev.urls, videoUrl: data.videoUrl, expiresAt: data.expiresAt },
                  }
                : null
            );
          }
        }
      } catch (err) {
        console.warn("Silent signed URL refresh warning:", err);
      }
    }, 45 * 60 * 1000);

    return () => clearInterval(interval);
  }, [id, mediaData]);

  // 7. Initial Resume Position logic (resumes ~5s earlier)
  const handleLoadedMetadata = () => {
    if (!videoRef.current || !mediaData) return;

    setDuration(videoRef.current.duration || mediaData.media.durationSeconds || 0);

    if (shouldResume && mediaData.progress?.positionSeconds) {
      const resumePos = Math.max(0, mediaData.progress.positionSeconds - 5);
      videoRef.current.currentTime = resumePos;
      setCurrentTime(resumePos);
    }

    // Auto-attempt playback on load
    videoRef.current
      .play()
      .then(() => setIsPlaying(true))
      .catch(() => {
        // Autoplay policy prevented playback, remains paused for user tap
        setIsPlaying(false);
      });
  };

  // 8. Auto-hide controls after 3 seconds of inactivity
  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  }, [isPlaying]);

  useEffect(() => {
    resetControlsTimer();
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [isPlaying, resetControlsTimer]);

  // 9. Playback Controls
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => console.error("Play error:", err));
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
      saveProgress(videoRef.current.currentTime, videoRef.current.duration || 0);
    }
    resetControlsTimer();
  };

  const seekBy = (seconds: number) => {
    if (!videoRef.current) return;
    const newPos = Math.max(
      0,
      Math.min(videoRef.current.duration || 0, videoRef.current.currentTime + seconds)
    );
    videoRef.current.currentTime = newPos;
    setCurrentTime(newPos);
    resetControlsTimer();
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const target = parseFloat(e.target.value);
    videoRef.current.currentTime = target;
    setCurrentTime(target);
    resetControlsTimer();
  };

  const toggleSubtitles = () => {
    if (!videoRef.current) return;
    const newActive = !subtitlesActive;
    setSubtitlesActive(newActive);

    const tracks = videoRef.current.textTracks;
    if (tracks && tracks.length > 0) {
      for (let i = 0; i < tracks.length; i++) {
        tracks[i].mode = newActive ? "showing" : "hidden";
      }
    }
    resetControlsTimer();
  };

  const toggleFullscreen = () => {
    if (!containerRef.current && !videoRef.current) return;

    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    } else if (containerRef.current?.requestFullscreen) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else if ((videoRef.current as any)?.webkitEnterFullscreen) {
      // iOS Safari fallback
      (videoRef.current as any).webkitEnterFullscreen();
    }
    resetControlsTimer();
  };

  // 10. D-Pad and Keyboard Remote Controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      resetControlsTimer();

      switch (e.key) {
        case " ":
        case "Enter":
          e.preventDefault();
          togglePlay();
          break;
        case "ArrowLeft":
          e.preventDefault();
          seekBy(-10);
          break;
        case "ArrowRight":
          e.preventDefault();
          seekBy(10);
          break;
        case "Escape":
        case "Backspace":
          e.preventDefault();
          router.push("/movies");
          break;
        case "f":
        case "F":
          e.preventDefault();
          toggleFullscreen();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [resetControlsTimer, isPlaying]);

  // 11. Media Session API for Lockscreen and Remote integration
  useEffect(() => {
    if (!mediaData || typeof navigator === "undefined" || !("mediaSession" in navigator)) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: `${mediaData.media.titleEn} · ${mediaData.media.titleTe}`,
      artist: "Kutumbam · కుటుంబం",
      artwork: mediaData.urls.posterUrl
        ? [{ src: mediaData.urls.posterUrl, sizes: "512x512", type: "image/jpeg" }]
        : [],
    });

    navigator.mediaSession.setActionHandler("play", () => {
      videoRef.current?.play();
      setIsPlaying(true);
    });
    navigator.mediaSession.setActionHandler("pause", () => {
      videoRef.current?.pause();
      setIsPlaying(false);
    });
    navigator.mediaSession.setActionHandler("seekbackward", () => seekBy(-10));
    navigator.mediaSession.setActionHandler("seekforward", () => seekBy(10));
  }, [mediaData]);

  // 12. Handle Playback Error
  const handleVideoError = (e: any) => {
    const errObj = videoRef.current?.error;
    const msg = `Video load error code: ${errObj?.code || "unknown"}`;
    setPlaybackError(msg);

    fetch("/api/media/error-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mediaId: id,
        error: msg,
        details: errObj?.message || "HTML5 video error event triggered",
      }),
    }).catch(() => {});
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
    setIsEnded(true);
    if (duration > 0) {
      saveProgress(duration, duration);
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={resetControlsTimer}
      onTouchStart={resetControlsTimer}
      onClick={resetControlsTimer}
      className="relative w-screen h-screen bg-black text-white overflow-hidden select-none flex items-center justify-center"
    >
      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center gap-6 z-30">
          <div className="w-16 h-16 border-6 border-yellow-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-[var(--text-heading)] font-bold text-yellow-300">
            <Bi k="loadingVideo" />
          </p>
        </div>
      )}

      {/* Playback Error Screen */}
      {playbackError && (
        <div className="z-40 p-6 sm:p-12 max-w-2xl bg-zinc-950 border-6 border-red-500 rounded-3xl text-center space-y-8 shadow-2xl mx-4">
          <div className="text-red-400 text-6xl">⚠️</div>
          <h2 className="text-[var(--text-heading)] font-extrabold text-white">
            <Bi k="playbackFailed" />
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <BigButton k="movies" href="/movies" variant="primary" />
            <BigButton k="home" href="/" variant="secondary" />
          </div>
        </div>
      )}

      {/* Native HTML5 Video Element */}
      {mediaData && (
        <video
          ref={videoRef}
          src={mediaData.urls.videoUrl}
          poster={mediaData.urls.posterUrl || undefined}
          playsInline
          controls={false}
          crossOrigin="anonymous"
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={() => {
            if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
          }}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={handleVideoEnded}
          onError={handleVideoError}
          className="w-full h-full object-contain cursor-pointer"
          onClick={togglePlay}
        >
          {mediaData.urls.subtitleUrl && (
            <track
              kind="subtitles"
              src={mediaData.urls.subtitleUrl}
              srcLang="te"
              label="Telugu · తెలుగు"
              default={subtitlesActive}
            />
          )}
        </video>
      )}

      {/* Controls Overlay (Auto-hides after 3s when playing) */}
      {!loading && !playbackError && !isEnded && (
        <div
          className={`absolute inset-0 z-30 pointer-events-none transition-opacity duration-300 flex flex-col justify-between p-3 sm:p-8 bg-gradient-to-t from-black/95 via-transparent to-black/85 ${
            showControls ? "opacity-100" : "opacity-0"
          }`}
        >
          {/* Top Bar: Back Button & Title Info */}
          <div className="flex items-center justify-between gap-3 pointer-events-auto w-full pt-1 sm:pt-2">
            <button
              type="button"
              onClick={() => router.push("/movies")}
              className="kutumbam-focus min-h-[52px] sm:min-h-[72px] px-4 sm:px-6 bg-black/80 hover:bg-black border-4 border-white text-white rounded-2xl flex items-center gap-2 sm:gap-3 text-base sm:text-[var(--text-btn)] font-bold shadow-2xl transition-transform active:scale-95 shrink-0"
              data-nav-item="true"
            >
              <ArrowLeft className="w-6 h-6 sm:w-8 sm:h-8" />
              <Bi k="back" />
            </button>

            {mediaData && (
              <div className="text-right truncate flex-1 min-w-0 pl-2">
                <h1 className="text-base sm:text-[var(--text-heading)] font-bold text-white drop-shadow-md truncate">
                  {mediaData.media.titleEn}
                </h1>
                <div className="text-xs sm:text-[var(--text-body)] font-bold text-yellow-300 drop-shadow-md font-sans truncate">
                  {mediaData.media.titleTe}
                </div>
              </div>
            )}
          </div>

          {/* Center Play/Pause & 10s Skip Giant Buttons */}
          <div className="flex items-center justify-center gap-4 sm:gap-12 pointer-events-auto my-auto">
            {/* Back 10s Button */}
            <button
              type="button"
              onClick={() => seekBy(-10)}
              className="kutumbam-focus min-h-[64px] sm:min-h-[96px] min-w-[64px] sm:min-w-[96px] p-3 sm:p-5 rounded-full bg-black/80 hover:bg-zinc-800 border-4 border-white text-white flex flex-col items-center justify-center shadow-xl active:scale-90"
              data-nav-item="true"
              aria-label="Back 10s · 10 సెకన్లు వెనుకకు"
            >
              <RotateCcw className="w-7 h-7 sm:w-12 sm:h-12" />
              <span className="text-xs sm:text-[var(--text-min)] font-extrabold mt-0.5 sm:mt-1">10s</span>
            </button>

            {/* Giant Play/Pause Button */}
            <button
              type="button"
              onClick={togglePlay}
              className="kutumbam-focus min-h-[84px] sm:min-h-[128px] min-w-[84px] sm:min-w-[128px] p-4 sm:p-6 rounded-full bg-[var(--accent)] hover:bg-yellow-300 border-4 sm:border-6 border-white text-black flex items-center justify-center shadow-2xl active:scale-95 transition-transform"
              data-nav-item="true"
              aria-label={isPlaying ? "Pause · పాజ్" : "Play · ప్లే"}
            >
              {isPlaying ? (
                <Pause className="w-10 h-10 sm:w-20 sm:h-20 fill-current" />
              ) : (
                <Play className="w-10 h-10 sm:w-20 sm:h-20 fill-current ml-1 sm:ml-2" />
              )}
            </button>

            {/* Forward 10s Button */}
            <button
              type="button"
              onClick={() => seekBy(10)}
              className="kutumbam-focus min-h-[64px] sm:min-h-[96px] min-w-[64px] sm:min-w-[96px] p-3 sm:p-5 rounded-full bg-black/80 hover:bg-zinc-800 border-4 border-white text-white flex flex-col items-center justify-center shadow-xl active:scale-90"
              data-nav-item="true"
              aria-label="Forward 10s · 10 సెకన్లు ముందుకు"
            >
              <RotateCw className="w-7 h-7 sm:w-12 sm:h-12" />
              <span className="text-xs sm:text-[var(--text-min)] font-extrabold mt-0.5 sm:mt-1">10s</span>
            </button>
          </div>

          {/* Bottom Bar: Seek Bar, Big Digits, Subtitles & Fullscreen */}
          <div className="space-y-3 sm:space-y-4 pointer-events-auto bg-black/80 backdrop-blur-md p-3 sm:p-6 rounded-2xl sm:rounded-3xl border-2 border-zinc-800">
            {/* Thick Seek Bar (>= 24px) */}
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={handleSeekChange}
                className="w-full h-7 sm:h-9 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-yellow-400 border-2 border-zinc-500 focus:outline-none focus:ring-4 focus:ring-yellow-400"
                aria-label="Seek video · సమయం ఎంచుకోండి"
              />
            </div>

            {/* Large Digits & Right-hand Action Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Large Digits */}
              <div className="text-base sm:text-[var(--text-heading)] font-extrabold font-mono text-yellow-300 tracking-wider">
                <span>{formatTime(currentTime)}</span>
                <span className="text-zinc-500 mx-2 sm:mx-3">/</span>
                <span className="text-zinc-300">{formatTime(duration)}</span>
              </div>

              {/* Action Controls: Subtitles Toggle & Fullscreen */}
              <div className="flex items-center gap-2 sm:gap-4">
                {/* Subtitles Toggle Button */}
                <button
                  type="button"
                  onClick={toggleSubtitles}
                  className={`kutumbam-focus min-h-[48px] sm:min-h-[64px] px-4 sm:px-6 rounded-xl sm:rounded-2xl border-4 font-bold flex items-center gap-2 sm:gap-3 transition-all flex-1 sm:flex-initial justify-center ${
                    subtitlesActive
                      ? "bg-yellow-400 text-black border-white shadow-lg"
                      : "bg-zinc-800 text-zinc-300 border-zinc-600 hover:border-zinc-400"
                  }`}
                  data-nav-item="true"
                  aria-label="Toggle subtitles · ఉపశీర్షికలు"
                >
                  <Subtitles className="w-5 h-5 sm:w-8 sm:h-8 shrink-0" />
                  <span className="text-xs sm:text-[var(--text-btn)]">
                    <Bi k={subtitlesActive ? "subtitlesOn" : "subtitlesOff"} />
                  </span>
                </button>

                {/* Fullscreen Button */}
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  className="kutumbam-focus min-h-[48px] sm:min-h-[64px] px-4 sm:px-6 rounded-xl sm:rounded-2xl bg-zinc-800 hover:bg-zinc-700 border-4 border-zinc-500 text-white font-bold flex items-center gap-2 sm:gap-3 flex-1 sm:flex-initial justify-center"
                  data-nav-item="true"
                  aria-label="Fullscreen · పూర్తి స్క్రీన్"
                >
                  {isFullscreen ? (
                    <Minimize className="w-5 h-5 sm:w-8 sm:h-8 shrink-0" />
                  ) : (
                    <Maximize className="w-5 h-5 sm:w-8 sm:h-8 shrink-0" />
                  )}
                  <span className="text-xs sm:text-[var(--text-btn)]">
                    <Bi k="fullscreen" />
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Video Ended Screen (No Autoplay, Big Reassuring Actions) */}
      {isEnded && (
        <div className="absolute inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-6 text-center space-y-8">
          <div className="w-24 h-24 rounded-full bg-yellow-400/20 border-4 border-yellow-400 flex items-center justify-center text-yellow-400">
            <Film className="w-14 h-14" />
          </div>

          <div className="space-y-3">
            <h2 className="text-[var(--text-heading)] font-extrabold text-white">
              {mediaData?.media.titleEn}
            </h2>
            <div className="text-[1.2em] font-bold text-yellow-300 font-sans">
              {mediaData?.media.titleTe}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 w-full max-w-xl">
            <BigButton
              k="watchAnother"
              href="/movies"
              variant="primary"
              className="flex-1 !min-h-[88px]"
            />
            <BigButton
              k="home"
              href="/"
              variant="secondary"
              className="flex-1 !min-h-[88px]"
            />
          </div>

          <button
            type="button"
            onClick={() => {
              setIsEnded(false);
              if (videoRef.current) {
                videoRef.current.currentTime = 0;
                videoRef.current.play();
                setIsPlaying(true);
              }
            }}
            className="text-[var(--text-body)] text-slate-400 hover:text-white underline underline-offset-8 mt-4"
          >
            <Bi k="startOver" />
          </button>
        </div>
      )}
    </div>
  );
}
