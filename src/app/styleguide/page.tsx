"use client";

import React, { useState } from "react";
import {
  Film,
  Image as ImageIcon,
  Video,
  Folder,
  Play,
  ArrowLeft,
  Home,
  AlertTriangle,
  Heart,
} from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { BigButton } from "@/components/BigButton";
import { BigTile } from "@/components/BigTile";
import { Bi } from "@/components/Bi";
import { EmptyState } from "@/components/EmptyState";
import { FriendlyError } from "@/components/FriendlyError";
import { LoadingBlock } from "@/components/LoadingBlock";

export default function StyleguidePage() {
  const [textScale, setTextScale] = useState<"large" | "extra-large" | "huge">("extra-large");
  const [theme, setTheme] = useState<"dark" | "light" | "high-contrast">("dark");

  const applyTextScale = (scale: "large" | "extra-large" | "huge") => {
    setTextScale(scale);
    document.documentElement.setAttribute("data-text-scale", scale);
  };

  const applyTheme = (t: "dark" | "light" | "high-contrast") => {
    setTheme(t);
    document.documentElement.setAttribute("data-theme", t);
  };

  return (
    <PageShell
      title={{ en: "Design System Styleguide", te: "డిజైన్ సిస్టమ్ స్టైల్ గైడ్" }}
      showBack={true}
      showHome={true}
    >
      <div className="flex flex-col gap-12 pb-16">
        {/* Styleguide Controls: Text Scale & Theme Switcher */}
        <section className="bg-[var(--bg-surface-elevated)] border-4 border-[var(--border-subtle)] p-6 rounded-3xl flex flex-col gap-6">
          <h2 className="text-[var(--text-heading)] font-bold text-yellow-300">
            <Bi text={{ en: "Auditing & Theme Controls", te: "థీమ్ మరియు పరిమాణ నియంత్రణ" }} />
          </h2>

          <div className="flex flex-col md:flex-row gap-6">
            {/* Text Scale Switcher */}
            <div className="flex flex-col gap-3 flex-1">
              <span className="text-[var(--text-body)] font-semibold">
                <Bi k="textSize" />
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => applyTextScale("large")}
                  className={`kutumbam-focus min-h-[64px] px-4 py-2 border-4 rounded-2xl font-bold ${
                    textScale === "large"
                      ? "bg-[var(--accent)] text-black border-white"
                      : "bg-[var(--bg-surface)] text-white border-[var(--border-subtle)]"
                  }`}
                  data-nav-item="true"
                >
                  <Bi k="sizeLarge" layout="stacked" /> (1.0x)
                </button>
                <button
                  type="button"
                  onClick={() => applyTextScale("extra-large")}
                  className={`kutumbam-focus min-h-[64px] px-4 py-2 border-4 rounded-2xl font-bold ${
                    textScale === "extra-large"
                      ? "bg-[var(--accent)] text-black border-white"
                      : "bg-[var(--bg-surface)] text-white border-[var(--border-subtle)]"
                  }`}
                  data-nav-item="true"
                >
                  <Bi k="sizeExtraLarge" layout="stacked" /> (1.25x)
                </button>
                <button
                  type="button"
                  onClick={() => applyTextScale("huge")}
                  className={`kutumbam-focus min-h-[64px] px-4 py-2 border-4 rounded-2xl font-bold ${
                    textScale === "huge"
                      ? "bg-[var(--accent)] text-black border-white"
                      : "bg-[var(--bg-surface)] text-white border-[var(--border-subtle)]"
                  }`}
                  data-nav-item="true"
                >
                  <Bi k="sizeHuge" layout="stacked" /> (1.5x)
                </button>
              </div>
            </div>

            {/* Theme Switcher */}
            <div className="flex flex-col gap-3 flex-1">
              <span className="text-[var(--text-body)] font-semibold">
                <Bi text={{ en: "Color Surface Theme", te: "రంగు థీమ్" }} />
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => applyTheme("dark")}
                  className={`kutumbam-focus min-h-[64px] px-4 py-2 border-4 rounded-2xl font-bold ${
                    theme === "dark"
                      ? "bg-slate-700 text-white border-white"
                      : "bg-[var(--bg-surface)] text-white border-[var(--border-subtle)]"
                  }`}
                  data-nav-item="true"
                >
                  Dark (Movie)
                </button>
                <button
                  type="button"
                  onClick={() => applyTheme("light")}
                  className={`kutumbam-focus min-h-[64px] px-4 py-2 border-4 rounded-2xl font-bold ${
                    theme === "light"
                      ? "bg-amber-100 text-black border-amber-600"
                      : "bg-[var(--bg-surface)] text-white border-[var(--border-subtle)]"
                  }`}
                  data-nav-item="true"
                >
                  Light (Photos)
                </button>
                <button
                  type="button"
                  onClick={() => applyTheme("high-contrast")}
                  className={`kutumbam-focus min-h-[64px] px-4 py-2 border-4 rounded-2xl font-bold ${
                    theme === "high-contrast"
                      ? "bg-yellow-400 text-black border-white"
                      : "bg-[var(--bg-surface)] text-white border-[var(--border-subtle)]"
                  }`}
                  data-nav-item="true"
                >
                  <Bi k="highContrast" layout="stacked" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Section 1: Bilingual Text Rendering & Telugu Conjuncts */}
        <section className="flex flex-col gap-6">
          <h2 className="text-[var(--text-heading)] font-bold text-yellow-300 border-b-4 border-[var(--border-subtle)] pb-3">
            <Bi text={{ en: "1. Bilingual Typography & Telugu Conjuncts", te: "1. ద్విభాషా అక్షరాలు మరియు ఒత్తులు" }} />
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[var(--bg-surface)] p-6 rounded-3xl border-4 border-[var(--border-subtle)]">
            <div className="flex flex-col gap-2">
              <span className="text-[var(--text-secondary)] font-medium">Auto-Responsive Layout:</span>
              <p className="text-[var(--text-heading)] font-bold">
                <Bi k="movies" layout="auto" />
              </p>
              <p className="text-[var(--text-heading)] font-bold">
                <Bi k="familyVideos" layout="auto" />
              </p>
              <p className="text-[var(--text-heading)] font-bold">
                <Bi text={{ en: "Maya Bazaar", te: "మాయాబజార్" }} layout="auto" />
              </p>
              <p className="text-[var(--text-heading)] font-bold">
                <Bi text={{ en: "Shankarabharanam", te: "శంకరాభరణం" }} layout="auto" />
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-[var(--text-secondary)] font-medium">Stacked Layout (for Tiles/Buttons):</span>
              <div className="p-4 bg-[var(--bg-surface-elevated)] border-2 border-[var(--border-subtle)] rounded-2xl text-center">
                <Bi k="continueWatching" layout="stacked" className="font-bold text-[var(--text-body)]" />
              </div>
              <div className="p-4 bg-[var(--bg-surface-elevated)] border-2 border-[var(--border-subtle)] rounded-2xl text-center">
                <Bi k="somethingWentWrong" layout="stacked" className="font-bold text-[var(--text-body)] text-red-300" />
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: BigButton Showcase */}
        <section className="flex flex-col gap-6">
          <h2 className="text-[var(--text-heading)] font-bold text-yellow-300 border-b-4 border-[var(--border-subtle)] pb-3">
            <Bi text={{ en: "2. BigButton Components (min 88px)", te: "2. పెద్ద బటన్లు (కనీసం 88px)" }} />
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <BigButton
              k="play"
              icon={<Play className="w-10 h-10 fill-current" />}
              variant="accent"
            />
            <BigButton
              k="resume"
              icon={<Play className="w-10 h-10" />}
              variant="primary"
            />
            <BigButton
              k="back"
              icon={<ArrowLeft className="w-10 h-10" />}
              variant="secondary"
            />
            <BigButton
              k="somethingWentWrong"
              icon={<AlertTriangle className="w-10 h-10" />}
              variant="danger"
            />
          </div>
        </section>

        {/* Section 3: BigTile Showcase (Posters, Videos, Albums) with D-Pad Grid */}
        <section className="flex flex-col gap-6">
          <h2 className="text-[var(--text-heading)] font-bold text-yellow-300 border-b-4 border-[var(--border-subtle)] pb-3">
            <Bi text={{ en: "3. BigTile Posters & Media Tiles", te: "3. సినిమా పోస్టర్లు మరియు టైల్స్" }} />
          </h2>
          <p className="text-[var(--text-body)] text-slate-300">
            Use Keyboard Arrow Keys (or TV Remote D-Pad) to navigate smoothly between the tiles below:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <BigTile
              titleEn="Maya Bazaar"
              titleTe="మాయాబజార్"
              meta="1957 · 2h 45m"
              aspectRatio="poster"
              progressPercent={65}
              icon={<Film className="w-20 h-20" />}
            />
            <BigTile
              titleEn="Shankarabharanam"
              titleTe="శంకరాభరణం"
              meta="1980 · 2h 20m"
              aspectRatio="poster"
              progressPercent={0}
              icon={<Film className="w-20 h-20" />}
            />
            <BigTile
              titleEn="Sankranti 2024"
              titleTe="సంక్రాంతి 2024"
              meta="24 Photos · ఫోటోలు"
              aspectRatio="square"
              icon={<ImageIcon className="w-20 h-20" />}
            />
            <BigTile
              titleEn="Family Function 2023"
              titleTe="కుటుంబ వేడుక 2023"
              meta="18m · Full HD"
              aspectRatio="video"
              progressPercent={30}
              icon={<Video className="w-20 h-20" />}
            />
          </div>
        </section>

        {/* Section 4: States (Empty State, Loading Block, Friendly Error) */}
        <section className="flex flex-col gap-6">
          <h2 className="text-[var(--text-heading)] font-bold text-yellow-300 border-b-4 border-[var(--border-subtle)] pb-3">
            <Bi text={{ en: "4. System States: Loading, Empty, & Friendly Error", te: "4. వ్యవస్థ స్థితులు: లోడింగ్, ఖాళీ మరియు లోపం" }} />
          </h2>

          <div className="flex flex-col gap-8">
            {/* Loading Block */}
            <div className="bg-[var(--bg-surface)] p-6 rounded-3xl border-4 border-[var(--border-subtle)]">
              <h3 className="text-[var(--text-body)] font-bold mb-4">Loading Block (Calm Skeletons):</h3>
              <LoadingBlock variant="grid" count={4} />
            </div>

            {/* Empty State */}
            <EmptyState
              titleKey="noMoviesEmpty"
              icon={<Film className="w-24 h-24" />}
              actionKey="home"
              actionHref="/"
              actionIcon={<Home className="w-8 h-8" />}
            />

            {/* Friendly Error */}
            <FriendlyError onRetry={() => alert("Retrying...")} />
          </div>
        </section>
      </div>
    </PageShell>
  );
}
