"use client";

import React, { useState, useRef, useEffect } from "react";
import { Bi } from "./Bi";

interface AudioPlayerProps {
  title_en: string;
  title_te: string;
  audioUrl: string;
  downloadUrl?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  title_en,
  title_te,
  audioUrl,
  downloadUrl,
  isOpen,
  onClose,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setIsPlaying(true);
      setCurrentTime(0);
    } else if (audioRef.current) {
      audioRef.current.pause();
    }
  }, [isOpen, audioUrl]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
    }
  };

  const skip = (seconds: number) => {
    if (!audioRef.current) return;
    const target = Math.max(0, Math.min(audioRef.current.currentTime + seconds, duration));
    audioRef.current.currentTime = target;
    setCurrentTime(target);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${title_en} · ${title_te} Audio Player`}
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md text-white flex items-center justify-center p-4 sm:p-6"
    >
      <div className="w-full max-w-2xl bg-slate-900 border-4 border-amber-400 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center">
        {/* Hidden Native Audio Element */}
        <audio
          ref={audioRef}
          src={audioUrl}
          autoPlay
          onTimeUpdate={() => audioRef.current && setCurrentTime(audioRef.current.currentTime)}
          onLoadedMetadata={() => audioRef.current && setDuration(audioRef.current.duration)}
          onEnded={() => setIsPlaying(false)}
        />

        {/* Header Title */}
        <div className="text-center w-full mb-4 sm:mb-8">
          <div className="text-amber-400 text-xs sm:text-sm font-bold uppercase tracking-wider mb-1 sm:mb-2">
            <Bi stringKey="audio" />
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white mb-1 sm:mb-2 truncate">
            {title_en}
          </h2>
          <h3 className="text-xl sm:text-3xl font-bold text-amber-300 truncate">
            {title_te}
          </h3>
        </div>

        {/* Big Animated Vinyl / Speaker Graphic */}
        <div className="w-24 h-24 sm:w-36 sm:h-36 rounded-full bg-slate-800 border-3 sm:border-4 border-amber-400 flex items-center justify-center mb-4 sm:mb-8 shadow-inner">
          <span className={`text-4xl sm:text-6xl ${isPlaying ? "animate-bounce" : ""}`}>🎵</span>
        </div>

        {/* Large 24px Seek Bar */}
        <div className="w-full mb-4">
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-6 rounded-lg appearance-none cursor-pointer bg-slate-700 accent-amber-400 focus:outline-none focus:ring-4 focus:ring-amber-300"
            aria-label="Seek audio"
          />
          <div className="flex justify-between items-center text-lg sm:text-2xl font-mono font-bold text-slate-300 mt-2">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Giant Play/Pause & Skip Controls */}
        <div className="flex items-center justify-center gap-2.5 sm:gap-6 my-2 sm:my-4 w-full">
          <button
            type="button"
            onClick={() => skip(-10)}
            className="min-h-[58px] min-w-[58px] sm:min-h-[72px] sm:min-w-[72px] bg-slate-800 hover:bg-slate-700 text-amber-400 border-2 sm:border-4 border-slate-600 rounded-xl sm:rounded-2xl text-lg sm:text-2xl font-extrabold flex items-center justify-center transition-transform active:scale-95 focus:ring-4 focus:ring-amber-400"
            aria-label="Back 10 seconds"
          >
            -10s
          </button>

          <button
            type="button"
            onClick={togglePlay}
            className="min-h-[72px] sm:min-h-[88px] min-w-[120px] sm:min-w-[140px] px-5 sm:px-8 bg-amber-400 hover:bg-amber-300 text-black border-3 sm:border-4 border-amber-200 rounded-2xl sm:rounded-3xl text-2xl sm:text-3xl font-extrabold flex items-center justify-center gap-2 sm:gap-3 transition-transform active:scale-95 shadow-xl focus:ring-6 focus:ring-amber-300"
            aria-label={isPlaying ? "Pause audio" : "Play audio"}
          >
            <span className="text-3xl sm:text-4xl">{isPlaying ? "⏸" : "▶"}</span>
            <Bi stringKey={isPlaying ? "pause" : "play"} />
          </button>

          <button
            type="button"
            onClick={() => skip(10)}
            className="min-h-[58px] min-w-[58px] sm:min-h-[72px] sm:min-w-[72px] bg-slate-800 hover:bg-slate-700 text-amber-400 border-2 sm:border-4 border-slate-600 rounded-xl sm:rounded-2xl text-lg sm:text-2xl font-extrabold flex items-center justify-center transition-transform active:scale-95 focus:ring-4 focus:ring-amber-400"
            aria-label="Forward 10 seconds"
          >
            +10s
          </button>
        </div>

        {/* Action Buttons: Download & Close */}
        <div className="flex items-center gap-3 sm:gap-4 mt-4 sm:mt-6 w-full justify-center">
          {downloadUrl && (
            <a
              href={downloadUrl}
              download
              className="flex-1 sm:flex-initial min-h-[56px] sm:min-h-[64px] px-4 sm:px-6 py-2 sm:py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-lg sm:text-xl rounded-2xl border-2 sm:border-4 border-slate-600 flex items-center justify-center gap-2"
            >
              <span>⬇</span>
              <Bi stringKey="download" />
            </a>
          )}

          <button
            type="button"
            onClick={onClose}
            className="flex-1 sm:flex-initial min-h-[56px] sm:min-h-[64px] px-6 sm:px-8 py-2 sm:py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-lg sm:text-xl rounded-2xl border-2 sm:border-4 border-slate-600 hover:border-amber-400"
          >
            <Bi stringKey="close" />
          </button>
        </div>
      </div>
    </div>
  );
};
export default AudioPlayer;
