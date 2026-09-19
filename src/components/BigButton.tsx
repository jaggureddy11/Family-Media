"use client";

import React from "react";
import Link from "next/link";
import { Bi } from "./Bi";
import { BilingualText, StringKey } from "@/lib/strings";

export interface BigButtonProps {
  /** Key from STRINGS glossary */
  k?: StringKey;
  /** Explicit BilingualText pair */
  text?: BilingualText;
  /** Explicit English label */
  en?: string;
  /** Explicit Telugu label */
  te?: string;
  /** Optional icon component */
  icon?: React.ReactNode;
  /** Custom children element */
  children?: React.ReactNode;
  /** Button sizing */
  size?: "small" | "medium" | "large";
  /** Click event handler */
  onClick?: () => void;
  /** Optional link destination if acting as a link */
  href?: string;
  /** Visual variant */
  variant?: "primary" | "secondary" | "accent" | "danger";
  /** Optional extra CSS classes */
  className?: string;
  /** Custom aria-label */
  ariaLabel?: string;
  /** Button element type */
  type?: "button" | "submit" | "reset";
  /** Disabled state */
  disabled?: boolean;
}

/**
 * <BigButton>
 *
 * Core interactive button designed for low-vision and TV remote interaction.
 * - Minimum height 88px with a large touch target.
 * - 4px solid border for clear visibility.
 * - Prominent filled icons (min 48px).
 * - Bilingual labels with high contrast (>= 10:1 ratio).
 * - Automatic keyboard/D-Pad spatial navigation item.
 */
export const BigButton: React.FC<BigButtonProps> = ({
  k,
  text,
  en,
  te,
  icon,
  children,
  size = "medium",
  onClick,
  href,
  variant = "primary",
  className = "",
  ariaLabel,
  type = "button",
  disabled = false,
}) => {
  let variantStyles =
    "bg-[var(--bg-surface-elevated)] hover:bg-[#334155] text-white border-[var(--border-subtle)] hover:border-white";

  if (variant === "accent") {
    variantStyles =
      "bg-[var(--accent)] hover:bg-yellow-400 !text-black border-white font-bold";
  } else if (variant === "secondary") {
    variantStyles =
      "bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-elevated)] text-white border-[var(--border-thick)]";
  } else if (variant === "danger") {
    variantStyles =
      "bg-red-800 hover:bg-red-700 text-white border-red-500 hover:border-white";
  }

  const sizeStyles =
    size === "small"
      ? "min-h-[56px] px-3 py-2 text-xl"
      : size === "large"
      ? "min-h-[88px] px-8 py-5 text-3xl"
      : "min-h-[72px] sm:min-h-[88px] px-3 sm:px-6 py-2.5 sm:py-4 text-[var(--text-btn)]";

  const baseStyles = `
    kutumbam-focus
    ${sizeStyles}
    border-4
    rounded-3xl
    flex items-center justify-center gap-2 sm:gap-4
    cursor-pointer
    transition-all duration-150
    active:scale-95
    select-none
    max-w-full
    box-border
    ${disabled ? "opacity-50 pointer-events-none cursor-not-allowed" : ""}
    ${variantStyles}
    ${className}
  `.trim();

  const content = (
    <>
      {icon && (
        <span
          className={`flex-shrink-0 flex items-center justify-center w-8 h-8 sm:w-12 sm:h-12 ${
            variant === "accent" ? "!text-black" : "text-[var(--accent)]"
          }`}
        >
          {icon}
        </span>
      )}
      {children ? (
        children
      ) : (
        <Bi
          k={k}
          text={text}
          en={en}
          te={te}
          layout="auto"
          className={`font-bold tracking-tight text-center ${variant === "accent" ? "!text-black" : ""}`}
          enClassName={`text-[0.9em] sm:text-[1.1em] ${variant === "accent" ? "!text-black" : ""}`}
          teClassName={`text-[1.05em] sm:text-[1.25em] ${variant === "accent" ? "!text-black" : ""}`}
        />
      )}
    </>
  );

  if (href && !disabled) {
    return (
      <Link
        href={href}
        role="button"
        className={baseStyles}
        aria-label={ariaLabel}
        data-nav-item="true"
        onClick={onClick}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={baseStyles}
      aria-label={ariaLabel}
      data-nav-item="true"
    >
      {content}
    </button>
  );
};

export default BigButton;
