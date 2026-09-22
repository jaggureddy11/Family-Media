"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Bi } from "./Bi";
import { BilingualText, StringKey } from "@/lib/strings";

export interface BigTileProps {
  /** Optional key from STRINGS glossary for static category tiles */
  k?: StringKey;
  /** Explicit BilingualText pair */
  text?: BilingualText;
  /** Title English */
  titleEn?: string;
  /** Title Telugu */
  titleTe?: string;
  /** Image/Thumbnail URL */
  imageUrl?: string;
  /** Fallback icon component when image is missing */
  icon?: React.ReactNode;
  /** Destination link */
  href?: string;
  /** Click handler */
  onClick?: () => void;
  /** Optional secondary metadata string (e.g., "1980 · 2h 20m") */
  meta?: string;
  /** Watch progress percentage (0 - 100) */
  progressPercent?: number;
  /** Optional custom CSS classes */
  className?: string;
  /** Aspect ratio of the thumbnail: 'poster' (2:3) or 'video' (16:9) or 'square' (1:1) */
  aspectRatio?: "poster" | "video" | "square";
}

/**
 * <BigTile>
 *
 * Designed for low-vision users and 10-foot TV navigation.
 * - Captions sit on a solid high-contrast bar beneath the image, NEVER overlaid.
 * - Telugu title rendered BIG in bold type.
 * - 4px thick borders and 6px focus rings.
 * - High-contrast progress bar indicator for continue-watching items.
 */
export const BigTile: React.FC<BigTileProps> = ({
  k,
  text,
  titleEn,
  titleTe,
  imageUrl,
  icon,
  href,
  onClick,
  meta,
  progressPercent,
  className = "",
  aspectRatio = "poster",
}) => {
  let aspectClass = "aspect-[2/3]";
  if (aspectRatio === "video") {
    aspectClass = "aspect-[16/9]";
  } else if (aspectRatio === "square") {
    aspectClass = "aspect-square";
  }

  const tileContent = (
    <div
      className={`
        kutumbam-focus
        group
        relative
        flex flex-col
        w-full
        bg-[var(--bg-surface)]
        border-3 sm:border-4 border-[var(--border-subtle)]
        hover:border-white
        rounded-2xl sm:rounded-3xl
        overflow-hidden
        cursor-pointer
        select-none
        transition-transform duration-150
        active:scale-98
        ${className}
      `}
      data-nav-item="true"
      onClick={onClick}
    >
      {/* Visual Thumbnail Area */}
      <div className={`relative w-full ${aspectClass} bg-[#111827] flex items-center justify-center overflow-hidden`}>
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={titleEn || titleTe || "Media poster"}
            fill
            unoptimized
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-4 sm:p-6 text-[var(--accent)]">
            {icon ? (
              <span className="w-12 h-12 sm:w-20 sm:h-20 flex items-center justify-center">
                {icon}
              </span>
            ) : (
              <span className="text-3xl sm:text-4xl">🎬</span>
            )}
          </div>
        )}

        {/* Watch Progress Bar (if continuing watching) */}
        {typeof progressPercent === "number" && progressPercent > 0 && (
          <div
            className="absolute bottom-0 left-0 right-0 h-3 sm:h-4 bg-black/80 border-t-2 border-slate-700"
            role="progressbar"
            aria-label="Watch progress · చూసిన సమయం"
            aria-valuenow={Math.round(progressPercent)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full bg-[var(--accent)] transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
            />
          </div>
        )}
      </div>

      {/* Solid Caption Bar Beneath Thumbnail */}
      <div className="p-2.5 sm:p-5 bg-[var(--bg-surface-elevated)] border-t-3 sm:border-t-4 border-[var(--border-subtle)] flex flex-col gap-0.5 sm:gap-1.5 min-h-[64px] sm:min-h-[96px] justify-center">
        <Bi
          k={k}
          text={text}
          en={titleEn}
          te={titleTe}
          layout="auto"
          className="w-full text-left"
          enClassName="text-xs sm:text-[1.1em] text-[var(--text-secondary)] font-medium leading-snug line-clamp-1 sm:line-clamp-none"
          teClassName="text-sm sm:text-[1.35em] text-[var(--text-primary)] font-bold text-yellow-300 leading-snug line-clamp-1 sm:line-clamp-none"
        />

        {meta && (
          <span className="text-[11px] sm:text-[var(--text-min)] text-[var(--text-secondary)] font-medium mt-0.5 sm:mt-1 truncate">
            {meta}
          </span>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block w-full focus:outline-none">
        {tileContent}
      </Link>
    );
  }

  return tileContent;
};

export default BigTile;
