"use client";

import React from "react";
import { Bi } from "./Bi";

interface YearJumpBarProps {
  years: number[];
  activeYear?: number;
  onSelectYear: (year: number) => void;
}

export const YearJumpBar: React.FC<YearJumpBarProps> = ({
  years,
  activeYear,
  onSelectYear,
}) => {
  if (!years || years.length <= 1) return null;

  return (
    <nav
      aria-label="Year Jump Navigation"
      className="sticky top-14 sm:top-20 z-20 py-2 sm:py-3 px-2 bg-black/90 backdrop-blur-md border-b-2 border-slate-800"
    >
      <div className="max-w-6xl mx-auto flex items-center gap-2 sm:gap-3">
        <div className="flex-shrink-0 text-amber-400 font-bold text-sm sm:text-lg hidden sm:flex items-center gap-2">
          <Bi stringKey="jumpToYear" />
          <span>:</span>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5 overflow-x-auto no-scrollbar py-1 w-full">
          {years.map((year) => {
            const isActive = activeYear === year;
            return (
              <button
                key={year}
                type="button"
                onClick={() => onSelectYear(year)}
                className={`flex-shrink-0 min-h-[46px] sm:min-h-[56px] min-w-[68px] sm:min-w-[88px] px-3.5 sm:px-5 py-1.5 sm:py-2.5 rounded-xl sm:rounded-2xl font-bold text-lg sm:text-2xl tabular-nums transition-all border-3 sm:border-4 focus:outline-none focus:ring-4 focus:ring-amber-400 ${
                  isActive
                    ? "bg-amber-400 text-black border-amber-300 scale-105 shadow-lg shadow-amber-500/20"
                    : "bg-slate-900 text-white border-slate-700 hover:border-amber-400 hover:bg-slate-800"
                }`}
                aria-label={`Jump to year ${year}`}
                aria-current={isActive ? "true" : undefined}
              >
                {year}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
export default YearJumpBar;
