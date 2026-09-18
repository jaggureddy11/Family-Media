"use client";

import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

export interface SpatialNavigationOptions {
  /** CSS selector for focusable items in the grid/container */
  itemSelector?: string;
  /** Number of columns in the grid (for Up/Down navigation). If undefined, calculates dynamically from DOM */
  columns?: number;
  /** Custom handler when Escape or Backspace is pressed */
  onBack?: () => void;
  /** Whether spatial navigation is active */
  enabled?: boolean;
}

/**
 * useSpatialNavigation
 *
 * Enables full keyboard and TV remote D-Pad spatial navigation (Arrow keys, Enter, Escape, Backspace).
 * Allows Mom or any TV user to navigate grids and screens without touching a mouse.
 */
export function useSpatialNavigation({
  itemSelector = "[data-nav-item='true']",
  columns,
  onBack,
  enabled = true,
}: SpatialNavigationOptions = {}) {
  const router = useRouter();

  const handleBack = useCallback(() => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  }, [onBack, router]);

  useEffect(() => {
    if (!enabled) return;

    function getItems(): HTMLElement[] {
      const elements = Array.from(
        document.querySelectorAll<HTMLElement>(itemSelector)
      );
      return elements.filter(
        (el) => !el.hasAttribute("disabled") && el.offsetParent !== null
      );
    }

    function handleKeyDown(event: KeyboardEvent) {
      // Back navigation (Escape, Backspace, or TV Remote Back / Browser Back)
      if (
        event.key === "Escape" ||
        (event.key === "Backspace" && !(event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement))
      ) {
        event.preventDefault();
        handleBack();
        return;
      }

      // Check arrow keys
      const isArrowKey = [
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
      ].includes(event.key);

      if (!isArrowKey) return;

      const items = getItems();
      if (items.length === 0) return;

      const currentElement = document.activeElement as HTMLElement | null;
      let currentIndex = currentElement ? items.indexOf(currentElement) : -1;

      // If nothing is focused yet, focus the first item
      if (currentIndex === -1) {
        event.preventDefault();
        items[0].focus();
        return;
      }

      // Determine columns dynamically if not provided
      let colCount = columns;
      if (!colCount || colCount <= 1) {
        const firstTop = items[0].getBoundingClientRect().top;
        colCount = items.filter(
          (item) => Math.abs(item.getBoundingClientRect().top - firstTop) < 15
        ).length;
        colCount = Math.max(1, colCount);
      }

      let nextIndex = currentIndex;

      switch (event.key) {
        case "ArrowRight":
          if (currentIndex + 1 < items.length) {
            nextIndex = currentIndex + 1;
          }
          break;
        case "ArrowLeft":
          if (currentIndex - 1 >= 0) {
            nextIndex = currentIndex - 1;
          }
          break;
        case "ArrowDown":
          if (currentIndex + colCount < items.length) {
            nextIndex = currentIndex + colCount;
          } else {
            // Jump to the last item if closer
            nextIndex = items.length - 1;
          }
          break;
        case "ArrowUp":
          if (currentIndex - colCount >= 0) {
            nextIndex = currentIndex - colCount;
          } else {
            nextIndex = 0;
          }
          break;
      }

      if (nextIndex !== currentIndex && items[nextIndex]) {
        event.preventDefault();
        items[nextIndex].focus();
        items[nextIndex].scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "nearest",
        });
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [itemSelector, columns, handleBack, enabled]);
}

export default useSpatialNavigation;
