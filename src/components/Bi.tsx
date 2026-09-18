import React from "react";
import { BilingualText, STRINGS, StringKey } from "@/lib/strings";

export interface BiProps {
  /** A pre-defined key from the STRINGS glossary */
  k?: StringKey;
  /** Custom bilingual text object */
  text?: BilingualText;
  /** Explicit English string (e.g. dynamic title from database) */
  en?: string;
  /** Explicit Telugu string (e.g. dynamic title from database) */
  te?: string;
  /** Layout behaviour: 'auto' stacks on narrow and flows inline on wide, 'stacked' always stacks, 'inline' always inline */
  layout?: "auto" | "stacked" | "inline";
  /** Optional custom CSS classes for the container */
  className?: string;
  /** Optional custom CSS classes for the English portion */
  enClassName?: string;
  /** Optional custom CSS classes for the Telugu portion */
  teClassName?: string;
}

/**
 * <Bi> component
 *
 * Renders bilingual text in the canonical "English · తెలుగు" format.
 * - On narrow screens (phones / 390px): stacks vertically with Telugu comfortably large and no wrapping issues.
 * - On wider screens: renders inline with a bullet separator.
 * - Ensures Telugu text is always weighted >= 500 (medium) with generous line-height >= 1.7.
 */
export const Bi: React.FC<BiProps> = ({
  k,
  text,
  en,
  te,
  layout = "auto",
  className = "",
  enClassName = "",
  teClassName = "",
}) => {
  let resolvedEn = en || "";
  let resolvedTe = te || "";

  if (k && STRINGS[k]) {
    resolvedEn = STRINGS[k].en;
    resolvedTe = STRINGS[k].te;
  } else if (text) {
    resolvedEn = text.en;
    resolvedTe = text.te;
  }

  const ariaLabel = `${resolvedEn}, ${resolvedTe}`;

  // Layout container classes
  let containerClasses = "inline-flex items-center gap-1.5";
  if (layout === "auto") {
    containerClasses = "flex flex-col sm:inline-flex sm:flex-row sm:items-baseline sm:gap-2";
  } else if (layout === "stacked") {
    containerClasses = "flex flex-col items-center justify-center gap-1";
  }

  return (
    <span
      className={`${containerClasses} leading-normal ${className}`}
      aria-label={ariaLabel}
    >
      <span
        lang="en"
        className={`font-sans font-medium tracking-normal ${enClassName}`}
      >
        {resolvedEn}
      </span>

      {/* Separator only visible when rendered inline */}
      <span
        aria-hidden="true"
        className={
          layout === "stacked"
            ? "hidden"
            : layout === "auto"
            ? "hidden sm:inline opacity-75 select-none"
            : "inline opacity-75 select-none"
        }
      >
        ·
      </span>

      <span
        lang="te"
        className={`font-telugu font-semibold tracking-wide leading-relaxed ${teClassName}`}
      >
        {resolvedTe}
      </span>
    </span>
  );
};

export default Bi;
