import React from "react";
import { Bi } from "./Bi";

export interface LoadingBlockProps {
  /** Optional layout mode: 'grid' renders tile skeletons, 'detail' renders single item skeleton */
  variant?: "grid" | "tile" | "banner";
  /** Number of items if grid */
  count?: number;
}

/**
 * <LoadingBlock>
 *
 * Calm, smooth skeleton loader.
 * Completely avoids frantic or broken-looking spinners.
 * Provides clear bilingual reassuring status: "Getting ready... · సిద్ధం చేస్తోంది..."
 */
export const LoadingBlock: React.FC<LoadingBlockProps> = ({
  variant = "grid",
  count = 4,
}) => {
  return (
    <div className="w-full flex flex-col items-center gap-8 py-6">
      {/* Calm Status Label */}
      <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-[var(--bg-surface-elevated)] border-2 border-[var(--border-subtle)]">
        <div className="w-4 h-4 rounded-full bg-[var(--accent)] animate-pulse" />
        <span className="text-[var(--text-body)] font-medium text-[var(--text-secondary)]">
          <Bi k="gettingReady" layout="auto" />
        </span>
      </div>

      {/* Skeletons */}
      {variant === "grid" && (
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: count }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col bg-[var(--bg-surface)] border-4 border-[var(--border-subtle)] rounded-3xl overflow-hidden animate-pulse"
            >
              <div className="w-full aspect-[2/3] bg-slate-800/60" />
              <div className="p-5 flex flex-col gap-3 bg-[var(--bg-surface-elevated)] border-t-4 border-[var(--border-subtle)]">
                <div className="h-7 w-3/4 bg-slate-700/60 rounded-lg" />
                <div className="h-6 w-1/2 bg-slate-700/40 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      )}

      {variant === "banner" && (
        <div className="w-full h-64 bg-[var(--bg-surface)] border-4 border-[var(--border-subtle)] rounded-3xl animate-pulse" />
      )}

      {variant === "tile" && (
        <div className="w-full aspect-[2/3] max-w-sm bg-[var(--bg-surface)] border-4 border-[var(--border-subtle)] rounded-3xl animate-pulse" />
      )}
    </div>
  );
};

export default LoadingBlock;
