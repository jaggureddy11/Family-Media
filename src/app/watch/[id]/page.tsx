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
  ArrowLeft,
  Home,
  Film,
  HelpCircle,
  Expand,
  Shrink,
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
  const [showControls, setShowControls] = useState(true);
  const [videoFit, setVideoFit] = useState<"contain" | "cover">("contain");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isEnded, setIsEnded] = useState(false);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [bufferedEnd, setBufferedEnd] = useState(0);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverPercent, setHoverPercent] = useState<number>(0);

  const timelineRef = useRef<HTMLDivElement | null>(null);
  const targetSeekTimeRef = useRef<number | null>(null);
  const seekDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isSeekingRef = useRef(false);
  const lastSeekTimestampRef = useRef(0);
  const retryCountRef = useRef(0);

  // 1. Fetch media details and signed URLs with automatic retry
  useEffect(() => {
    if (!id) return;

    let isMounted = true;
    let attempt = 0;

    const loadStream = async () => {
      setLoading(true);
      while (attempt < 3 && isMounted) {
        try {
          attempt++;
          const res = await fetch(`/api/media/watch/${id}`);
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || "Failed to load movie stream");
          }
          const data: WatchResponse = await res.json();
          if (isMounted) {
            setMediaData(data);
            setPlaybackError(null);
            setLoading(false);
          }
          return;
        } catch (err: any) {
          console.warn(`Watch stream fetch attempt ${attempt} failed:`, err);
          if (attempt < 3 && isMounted) {
            await new Promise((r) => setTimeout(r, 1200));
          } else if (isMounted) {
            console.error("Watch load error:", err);
            setPlaybackError(err.message || "Failed to load video stream");
            setLoading(false);
            // Log failure to admin library
            fetch("/api/media/error-log", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                mediaId: id,
                error: err.message || "Initial load error",
              }),
            }).catch(() => {});
          }
        }
      }
    };

    loadStream();

    return () => {
      isMounted = false;
    };
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

  // 7. Buffered range tracking
  const updateBuffered = useCallback(() => {
    if (videoRef.current && videoRef.current.buffered.length > 0) {
      const cur = videoRef.current.currentTime;
      const b = videoRef.current.buffered;
      let end = 0;
      for (let i = 0; i < b.length; i++) {
        if (b.start(i) <= cur && cur <= b.end(i)) {
          end = b.end(i);
          break;
        } else if (b.end(i) > end) {
          end = b.end(i);
        }
      }
      setBufferedEnd(end);
    }
  }, []);

  // 7b. Initial Resume Position logic (resumes ~5s earlier)
  const handleLoadedMetadata = () => {
    if (!videoRef.current || !mediaData) return;

    const dur = videoRef.current.duration || mediaData.media.durationSeconds || 0;
    setDuration(dur);
    updateBuffered();

    if (shouldResume && mediaData.progress?.positionSeconds) {
      const resumePos = Math.max(0, mediaData.progress.positionSeconds - 5);
      videoRef.current.currentTime = resumePos;
      setCurrentTime(resumePos);
    }

    // Auto-attempt playback on load
    videoRef.current
      .play()
      .then(() => setIsPlaying(true))
      .catch((err) => {
        if (err?.name !== "AbortError") {
          setIsPlaying(false);
        }
      });
  };

  // 8. Auto-hide controls after 3.5 seconds of inactivity
  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3500);
    }
  }, [isPlaying]);

  useEffect(() => {
    resetControlsTimer();
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [isPlaying, resetControlsTimer]);

  const handleScreenClick = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("button, [role='slider'], a, input")) {
        return;
      }

      setShowControls((prev) => {
        const next = !prev;
        if (controlsTimeoutRef.current) {
          clearTimeout(controlsTimeoutRef.current);
          controlsTimeoutRef.current = null;
        }
        if (next && isPlaying) {
          controlsTimeoutRef.current = setTimeout(() => {
            setShowControls(false);
          }, 3500);
        }
        return next;
      });
    },
    [isPlaying]
  );

  const toggleVideoFit = useCallback(
    (e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      setVideoFit((prev) => (prev === "contain" ? "cover" : "contain"));
      resetControlsTimer();
    },
    [resetControlsTimer]
  );

  // 9. Playback Controls
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          if (err?.name !== "AbortError") {
            console.error("Play error:", err);
          }
        });
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
      saveProgress(videoRef.current.currentTime, videoRef.current.duration || 0);
    }
    resetControlsTimer();
  };

  // 9a. Smooth Seeking with Debounce & Request Coalescing (Netflix / YouTube style)
  const commitSeek = useCallback((targetSec: number) => {
    if (!videoRef.current) return;
    isSeekingRef.current = true;
    lastSeekTimestampRef.current = Date.now();
    try {
      videoRef.current.currentTime = targetSec;
    } catch (err) {
      console.warn("Seek assignment warning:", err);
    }
    targetSeekTimeRef.current = null;
  }, []);

  const seekBy = useCallback(
    (seconds: number) => {
      const maxDur = duration || videoRef.current?.duration || 0;
      if (maxDur <= 0) return;

      const base =
        targetSeekTimeRef.current !== null
          ? targetSeekTimeRef.current
          : (videoRef.current?.currentTime ?? currentTime);

      const newPos = Math.max(0, Math.min(maxDur, base + seconds));
      targetSeekTimeRef.current = newPos;
      setCurrentTime(newPos);
      resetControlsTimer();

      if (seekDebounceTimerRef.current) {
        clearTimeout(seekDebounceTimerRef.current);
      }

      seekDebounceTimerRef.current = setTimeout(() => {
        commitSeek(newPos);
      }, 200);
    },
    [duration, currentTime, resetControlsTimer, commitSeek]
  );

  // 9b. Netflix / YouTube Interactive Timeline pointer interactions
  const getTimeFromPointerEvent = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return { time: 0, ratio: 0 };
    const rect = timelineRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const maxDur = duration || videoRef.current?.duration || 0;
    return { time: ratio * maxDur, ratio: ratio * 100 };
  };

  const handleTimelinePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    timelineRef.current?.setPointerCapture(e.pointerId);
    setIsScrubbing(true);
    const { time, ratio } = getTimeFromPointerEvent(e);
    setHoverTime(time);
    setHoverPercent(ratio);
    targetSeekTimeRef.current = time;
    setCurrentTime(time);
    resetControlsTimer();
  };

  const handleTimelinePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const { time, ratio } = getTimeFromPointerEvent(e);
    setHoverTime(time);
    setHoverPercent(ratio);

    if (isScrubbing) {
      targetSeekTimeRef.current = time;
      setCurrentTime(time);
      resetControlsTimer();

      if (seekDebounceTimerRef.current) {
        clearTimeout(seekDebounceTimerRef.current);
      }
      seekDebounceTimerRef.current = setTimeout(() => {
        commitSeek(time);
      }, 150);
    }
  };

  const handleTimelinePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isScrubbing) {
      try {
        timelineRef.current?.releasePointerCapture(e.pointerId);
      } catch {}
      setIsScrubbing(false);
      const { time } = getTimeFromPointerEvent(e);
      if (seekDebounceTimerRef.current) {
        clearTimeout(seekDebounceTimerRef.current);
      }
      commitSeek(time);
      resetControlsTimer();
    }
  };

  const handleTimelinePointerLeave = () => {
    if (!isScrubbing) {
      setHoverTime(null);
    }
  };

  // 9b. Enhanced Fullscreen logic
  const toggleFullscreen = () => {
    const doc: any = document;
    const isCurrentlyFullscreen = Boolean(
      doc.fullscreenElement ||
      doc.webkitFullscreenElement ||
      doc.mozFullScreenElement ||
      doc.msFullscreenElement
    );

    if (isCurrentlyFullscreen) {
      if (doc.exitFullscreen) {
        doc.exitFullscreen().catch(() => {});
      } else if (doc.webkitExitFullscreen) {
        doc.webkitExitFullscreen();
      }
      setIsFullscreen(false);
      try {
        (screen.orientation as any)?.unlock?.();
      } catch {}
    } else {
      const container: any = containerRef.current;
      const video: any = videoRef.current;

      if (container?.requestFullscreen) {
        container.requestFullscreen().catch(() => {});
        setIsFullscreen(true);
      } else if (container?.webkitRequestFullscreen) {
        container.webkitRequestFullscreen();
        setIsFullscreen(true);
      } else if (video?.webkitEnterFullscreen) {
        // iOS Safari video element fullscreen fallback
        video.webkitEnterFullscreen();
      }

      // Automatically attempt landscape lock on mobile devices for theater experience
      try {
        (screen.orientation as any)?.lock?.("landscape").catch(() => {});
      } catch {}
    }
    resetControlsTimer();
  };

  // Synchronize fullscreen state on any browser change or gesture
  useEffect(() => {
    const handleFullscreenChange = () => {
      const doc: any = document;
      const isFs = Boolean(
        doc.fullscreenElement ||
        doc.webkitFullscreenElement ||
        doc.mozFullScreenElement ||
        doc.msFullscreenElement
      );
      setIsFullscreen(isFs);
      if (!isFs) {
        try {
          (screen.orientation as any)?.unlock?.();
        } catch {}
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
    };
  }, []);

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

  // 12. Handle Playback Error with Graceful Auto-Recovery
  const handleVideoError = (e: any) => {
    const errObj = videoRef.current?.error;
    const isTransient =
      errObj?.code === 2 || // MEDIA_ERR_NETWORK (frequent during rapid seeking/abort)
      isSeekingRef.current ||
      Date.now() - lastSeekTimestampRef.current < 5000;

    console.warn("Video playback error event caught:", {
      code: errObj?.code,
      message: errObj?.message,
      isTransient,
      retryCount: retryCountRef.current,
    });

    // Attempt automatic recovery up to 3 times without showing frightening error modal
    if (retryCountRef.current < 3 && mediaData?.urls?.videoUrl) {
      retryCountRef.current += 1;
      const resumePos =
        targetSeekTimeRef.current !== null
          ? targetSeekTimeRef.current
          : (videoRef.current?.currentTime ?? currentTime);

      setTimeout(() => {
        if (!videoRef.current || !mediaData?.urls?.videoUrl) return;
        const currentSrc = mediaData.urls.videoUrl;
        videoRef.current.src = currentSrc;
        videoRef.current.currentTime = Math.max(0, resumePos);
        videoRef.current.load();
        videoRef.current
          .play()
          .then(() => {
            setIsPlaying(true);
            retryCountRef.current = 0;
          })
          .catch((err) => {
            if (err?.name !== "AbortError") {
              console.warn("Auto-recovery play interrupted:", err);
            }
          });
      }, 300);
      return;
    }

    // Retries exhausted — display error reassuringly
    const msg = `Video load error code: ${errObj?.code || "unknown"}`;
    setPlaybackError(msg);

    fetch("/api/media/error-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mediaId: id,
        error: msg,
        details: errObj?.message || "HTML5 video error event triggered after retries",
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
      onClick={handleScreenClick}
      className="fixed inset-0 w-full h-[100dvh] bg-black text-white overflow-hidden select-none flex items-center justify-center touch-manipulation"
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
          disablePictureInPicture
          controlsList="nodownload nofullscreen noremoteplayback"
          crossOrigin="anonymous"
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={() => {
            if (videoRef.current && !isScrubbing && targetSeekTimeRef.current === null) {
              setCurrentTime(videoRef.current.currentTime);
              updateBuffered();
            }
          }}
          onProgress={updateBuffered}
          onSeeking={() => {
            isSeekingRef.current = true;
          }}
          onSeeked={() => {
            isSeekingRef.current = false;
            retryCountRef.current = 0;
            if (videoRef.current) {
              setCurrentTime(videoRef.current.currentTime);
              updateBuffered();
            }
          }}
          onCanPlay={() => {
            retryCountRef.current = 0;
          }}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={handleVideoEnded}
          onError={handleVideoError}
          className={`w-full h-full max-w-full max-h-full transition-all duration-300 ${
            videoFit === "cover" ? "object-cover" : "object-contain"
          }`}
        />
      )}

      {/* Controls Overlay (Auto-hides after 3.5s when playing) */}
      {!loading && !playbackError && !isEnded && (
        <div
          className={`absolute inset-0 z-30 transition-opacity duration-300 flex flex-col justify-between ${
            showControls ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleScreenClick(e);
            }
          }}
        >
          {/* Top Bar: Back Button & Title Info */}
          <div className="flex items-center justify-between gap-3 pointer-events-auto w-full pt-2 sm:pt-4 px-3 sm:px-6 bg-gradient-to-b from-black/80 to-transparent">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                router.push("/movies");
              }}
              className="kutumbam-focus min-h-[40px] sm:min-h-[48px] px-3 sm:px-4 bg-black/70 hover:bg-black/90 border-2 border-white/90 text-white rounded-xl flex items-center gap-2 text-xs sm:text-sm font-bold shadow-lg transition-transform active:scale-95 shrink-0 backdrop-blur-sm"
              data-nav-item="true"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              <Bi k="back" />
            </button>

            {mediaData && (
              <div className="text-right truncate flex-1 min-w-0 pl-2">
                <h1 className="text-xs sm:text-lg font-bold text-white drop-shadow truncate">
                  {mediaData.media.titleEn}
                </h1>
                <div className="text-[11px] sm:text-xs font-semibold text-yellow-300 drop-shadow font-sans truncate">
                  {mediaData.media.titleTe}
                </div>
              </div>
            )}
          </div>

          {/* Center Play/Pause & 10s Skip Buttons (Sleek, non-obtrusive, responsive) */}
          <div
            className="flex items-center justify-center gap-6 sm:gap-14 my-auto pointer-events-auto py-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                handleScreenClick(e);
              }
            }}
          >
            {/* Back 10s Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                seekBy(-10);
              }}
              className="kutumbam-focus w-11 h-11 sm:w-16 sm:h-16 rounded-full bg-black/60 hover:bg-black/80 border-2 border-white/80 text-white flex flex-col items-center justify-center shadow-xl active:scale-90 backdrop-blur-sm transition-transform"
              data-nav-item="true"
              aria-label="Back 10s · 10 సెకన్లు వెనుకకు"
            >
              <RotateCcw className="w-5 h-5 sm:w-7 sm:h-7" />
              <span className="text-[9px] sm:text-xs font-black tracking-tight leading-none mt-0.5">10s</span>
            </button>

            {/* Play/Pause Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                togglePlay();
              }}
              className="kutumbam-focus w-15 h-15 sm:w-20 sm:h-20 rounded-full bg-yellow-400 hover:bg-yellow-300 border-3 sm:border-4 border-white text-black flex items-center justify-center shadow-2xl active:scale-95 transition-transform"
              data-nav-item="true"
              aria-label={isPlaying ? "Pause · పాజ్" : "Play · ప్లే"}
            >
              {isPlaying ? (
                <Pause className="w-7 h-7 sm:w-10 sm:h-10 fill-current" />
              ) : (
                <Play className="w-7 h-7 sm:w-10 sm:h-10 fill-current ml-0.5" />
              )}
            </button>

            {/* Forward 10s Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                seekBy(10);
              }}
              className="kutumbam-focus w-11 h-11 sm:w-16 sm:h-16 rounded-full bg-black/60 hover:bg-black/80 border-2 border-white/80 text-white flex flex-col items-center justify-center shadow-xl active:scale-90 backdrop-blur-sm transition-transform"
              data-nav-item="true"
              aria-label="Forward 10s · 10 సెకన్లు ముందుకు"
            >
              <RotateCw className="w-5 h-5 sm:w-7 sm:h-7" />
              <span className="text-[9px] sm:text-xs font-black tracking-tight leading-none mt-0.5">10s</span>
            </button>
          </div>

          {/* Bottom Bar: Timeline & Sleek Action Controls */}
          <div
            className="w-full pointer-events-auto space-y-2 sm:space-y-3 bg-gradient-to-t from-black/95 via-black/75 to-transparent pt-6 pb-3 sm:pb-5 px-3 sm:px-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Netflix / YouTube Interactive Timeline Scrubber */}
            <div className="relative w-full pt-1 pb-1">
              <div
                ref={timelineRef}
                role="slider"
                tabIndex={0}
                aria-label="Timeline · సమయ క్రమం"
                aria-valuemin={0}
                aria-valuemax={duration || 100}
                aria-valuenow={currentTime}
                onPointerDown={handleTimelinePointerDown}
                onPointerMove={handleTimelinePointerMove}
                onPointerUp={handleTimelinePointerUp}
                onPointerCancel={handleTimelinePointerUp}
                onPointerLeave={handleTimelinePointerLeave}
                onKeyDown={(e) => {
                  if (e.key === "ArrowLeft") {
                    e.preventDefault();
                    seekBy(-10);
                  } else if (e.key === "ArrowRight") {
                    e.preventDefault();
                    seekBy(10);
                  }
                }}
                className="group relative flex items-center w-full h-7 sm:h-9 cursor-pointer touch-none select-none focus:outline-none focus-visible:ring-3 focus-visible:ring-yellow-400 rounded-full"
              >
                {/* Time Preview Tooltip (Floating bubble like YouTube/Netflix) */}
                {(hoverTime !== null || isScrubbing) && (
                  <div
                    className="absolute -top-10 -translate-x-1/2 px-2.5 py-0.5 bg-black/95 text-yellow-300 border-2 border-yellow-400 rounded-lg text-xs font-bold font-mono shadow-2xl pointer-events-none z-30 transition-opacity whitespace-nowrap after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-4 after:border-transparent after:border-t-yellow-400"
                    style={{
                      left: `${Math.max(
                        6,
                        Math.min(
                          94,
                          isScrubbing
                            ? duration > 0
                              ? (currentTime / duration) * 100
                              : 0
                            : hoverPercent
                        )
                      )}%`,
                    }}
                  >
                    {formatTime(isScrubbing ? currentTime : hoverTime ?? 0)}
                  </div>
                )}

                {/* Track Rail: expands on hover or scrubbing */}
                <div className="relative w-full h-2 sm:h-2.5 group-hover:h-3 sm:group-hover:h-3.5 group-focus-visible:h-3 bg-white/25 rounded-full transition-all duration-150 overflow-visible">
                  {/* Buffered Progress Bar (soft translucent white) */}
                  <div
                    className="absolute left-0 top-0 bottom-0 bg-white/40 rounded-full transition-all duration-200 pointer-events-none"
                    style={{
                      width: `${
                        duration > 0
                          ? Math.min(100, Math.max(0, (bufferedEnd / duration) * 100))
                          : 0
                      }%`,
                    }}
                  />

                  {/* Played Progress Bar (vibrant Kutumbam yellow) */}
                  <div
                    className="absolute left-0 top-0 bottom-0 bg-yellow-400 rounded-full pointer-events-none transition-all duration-75"
                    style={{
                      width: `${
                        duration > 0
                          ? Math.min(100, Math.max(0, (currentTime / duration) * 100))
                          : 0
                      }%`,
                    }}
                  />

                  {/* Scrubber Knob / Thumb: Sits at leading edge of played bar */}
                  <div
                    className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 sm:w-5 sm:h-5 rounded-full bg-yellow-400 border-2 border-white shadow-xl pointer-events-none transition-transform duration-150 ${
                      isScrubbing
                        ? "scale-125 ring-3 ring-yellow-400/50"
                        : "scale-100 group-hover:scale-125"
                    }`}
                    style={{
                      left: `${
                        duration > 0
                          ? Math.min(100, Math.max(0, (currentTime / duration) * 100))
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Large Digits & Right-hand Action Controls */}
            <div className="flex items-center justify-between gap-2">
              {/* Digits */}
              <div className="text-xs sm:text-base font-bold font-mono text-yellow-300 tracking-wider">
                <span>{formatTime(currentTime)}</span>
                <span className="text-zinc-500 mx-1.5 sm:mx-2">/</span>
                <span className="text-zinc-300">{formatTime(duration)}</span>
              </div>

              {/* Action Controls: Fit & Fullscreen */}
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Screen Fit Toggle Button */}
                <button
                  type="button"
                  onClick={toggleVideoFit}
                  className="kutumbam-focus min-h-[38px] sm:min-h-[46px] px-2.5 sm:px-4 rounded-xl border-2 font-bold flex items-center gap-1.5 transition-all justify-center shadow-md active:scale-95 bg-zinc-800/90 hover:bg-zinc-700 border-zinc-500 text-white"
                  data-nav-item="true"
                  aria-label={videoFit === "contain" ? "Fill Screen · పూర్తిగా నింపు" : "Original Fit · అసలు పరిమాణం"}
                >
                  {videoFit === "contain" ? (
                    <Expand className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                  ) : (
                    <Shrink className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                  )}
                  <span className="text-xs sm:text-sm font-semibold">
                    <Bi k={videoFit === "contain" ? "fitFill" : "fitOriginal"} />
                  </span>
                </button>

                {/* Fullscreen Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFullscreen();
                  }}
                  className={`kutumbam-focus min-h-[38px] sm:min-h-[46px] px-2.5 sm:px-4 rounded-xl border-2 font-bold flex items-center gap-1.5 transition-all justify-center shadow-md active:scale-95 ${
                    isFullscreen
                      ? "bg-yellow-400 text-black border-white"
                      : "bg-zinc-800/90 hover:bg-zinc-700 border-zinc-500 text-white"
                  }`}
                  data-nav-item="true"
                  aria-label={isFullscreen ? "Exit Fullscreen · స్క్రీన్ సాధారణ పరిమాణం" : "Fullscreen · పూర్తి స్క్రీన్"}
                >
                  {isFullscreen ? (
                    <Minimize className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                  ) : (
                    <Maximize className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                  )}
                  <span className="text-xs sm:text-sm font-semibold">
                    <Bi k={isFullscreen ? "exitFullscreen" : "fullscreen"} />
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
