"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Home, HelpCircle, Phone, MessageCircle, X, UploadCloud } from "lucide-react";
import { BigButton } from "./BigButton";
import { Bi } from "./Bi";
import { useSpatialNavigation } from "@/hooks/useSpatialNavigation";
import { STRINGS } from "@/lib/strings";

export interface PageShellProps {
  /** Page heading */
  title?: { en: string; te: string };
  /** Explicit English title */
  titleEn?: string;
  /** Explicit Telugu title */
  titleTe?: string;
  /** Key from STRINGS glossary for heading */
  titleKey?: keyof typeof STRINGS;
  /** Alias for titleKey */
  titleStringKey?: keyof typeof STRINGS;
  /** Whether to show the Back button (default true) */
  showBack?: boolean;
  /** Whether to show the Home button (default true) */
  showHome?: boolean;
  /** Whether to show small Upload button in top corner (default false) */
  showUpload?: boolean;
  /** Custom back URL (if not router.back()) */
  backHref?: string;
  /** Optional header right-side custom action */
  headerAction?: React.ReactNode;
  /** Optional header left-side custom action (e.g. on Home page) */
  topLeftAction?: React.ReactNode;
  /** Page main content */
  children: React.ReactNode;
  /** Optional flag indicating an admin-only view */
  adminOnly?: boolean;
  /** Optional admin or section navigation items */
  navItems?: Array<{ key: string; href: string }>;
  /** Optional extra classes for content area */
  contentClassName?: string;
}

/**
 * <PageShell>
 *
 * Core layout wrapper for every single screen in Kutumbam.
 * Guarantees the "No Dead Ends" rule with prominent Back and Home buttons.
 * Integrates full-screen family Help modal and keyboard/D-Pad navigation.
 */
export const PageShell: React.FC<PageShellProps> = ({
  title,
  titleEn,
  titleTe,
  titleKey,
  titleStringKey,
  showBack = true,
  showHome = true,
  showUpload = false,
  backHref,
  headerAction,
  topLeftAction,
  adminOnly,
  navItems,
  children,
  contentClassName = "",
}) => {
  const router = useRouter();
  const effectiveTitle = title || (titleEn && titleTe ? { en: titleEn, te: titleTe } : undefined);
  const effectiveTitleKey = titleKey || titleStringKey;
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [helpInfo, setHelpInfo] = useState({
    contactName: process.env.NEXT_PUBLIC_HELP_CONTACT_NAME || "Jaggu",
    phoneNumber: process.env.NEXT_PUBLIC_HELP_PHONE_NUMBER || "+919110300509",
    whatsappNumber: process.env.NEXT_PUBLIC_HELP_WHATSAPP_NUMBER || "+919110300509",
  });

  // Fetch help settings and profile preferences on mount
  React.useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.helpContactName) {
          setHelpInfo({
            contactName: data.helpContactName,
            phoneNumber: data.helpPhoneNumber || "+919110300509",
            whatsappNumber: data.helpWhatsappNumber || "+919110300509",
          });
        }
      })
      .catch(() => {});

    // Hydrate per-profile text scale and high contrast theme
    fetch("/api/auth/session")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          if (data.user.textSize) {
            const scale = data.user.textSize.toLowerCase().replace(/_/g, "-");
            document.documentElement.setAttribute("data-text-scale", scale);
          }
          if (data.user.highContrast) {
            document.documentElement.setAttribute("data-theme", "high-contrast");
          } else if (document.documentElement.getAttribute("data-theme") === "high-contrast") {
            document.documentElement.setAttribute("data-theme", "dark");
          }
        }
      })
      .catch(() => {});
  }, []);

  // Idle timeout (4 hours) return quietly to Home
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const IDLE_LIMIT_MS = 4 * 60 * 60 * 1000; // 4 hours
    let idleTimer: NodeJS.Timeout;

    const resetIdle = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        if (window.location.pathname !== "/") {
          router.push("/");
        }
      }, IDLE_LIMIT_MS);
    };

    resetIdle();
    const events = ["mousedown", "mousemove", "keydown", "touchstart", "scroll"];
    events.forEach((ev) => window.addEventListener(ev, resetIdle, { passive: true }));

    return () => {
      clearTimeout(idleTimer);
      events.forEach((ev) => window.removeEventListener(ev, resetIdle));
    };
  }, [router]);

  // Spatial navigation hook
  useSpatialNavigation({
    onBack: () => {
      if (showHelpModal) {
        setShowHelpModal(false);
      } else if (backHref) {
        router.push(backHref);
      } else if (window.location.pathname !== "/") {
        router.back();
      }
    },
  });

  const handleBackClick = () => {
    if (backHref) {
      router.push(backHref);
    } else {
      router.back();
    }
  };

  const helpContactName = helpInfo.contactName;
  const helpPhoneNumber = helpInfo.phoneNumber;
  const helpWhatsApp = helpInfo.whatsappNumber;

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-main)] text-[var(--text-primary)] w-full max-w-full overflow-x-clip">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 bg-[var(--bg-main)]/95 backdrop-blur-sm border-b-4 border-[var(--border-subtle)] px-2 sm:px-8 py-2 sm:py-3 w-full max-w-full overflow-hidden">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-1 sm:gap-3 w-full">
          {/* Navigation Controls: Back & Home or Top-Left Brand/Action */}
          <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
            {topLeftAction}

            {showBack && (
              <BigButton
                k="back"
                size="small"
                icon={<ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />}
                onClick={handleBackClick}
                variant="secondary"
                className="!min-h-[42px] sm:!min-h-[44px] !px-2.5 sm:!px-4 !py-1 !text-xs sm:!text-sm rounded-xl shrink whitespace-nowrap"
              />
            )}

            {showHome && (
              <BigButton
                k="home"
                size="small"
                icon={<Home className="w-4 h-4 sm:w-5 sm:h-5" />}
                href="/"
                variant="secondary"
                className="!min-h-[42px] sm:!min-h-[44px] !px-2.5 sm:!px-4 !py-1 !text-xs sm:!text-sm rounded-xl shrink whitespace-nowrap"
              />
            )}
          </div>

          {/* Center Heading (if provided) */}
          {(effectiveTitle || effectiveTitleKey) && (
            <h1 className="flex-1 text-base sm:text-[var(--text-heading)] font-bold text-center px-1 sm:px-2 truncate">
              <Bi
                text={effectiveTitle}
                k={effectiveTitleKey}
                layout="auto"
                enClassName="text-[0.8em] sm:text-[0.85em] text-[var(--text-secondary)]"
                teClassName="text-[1.0em] sm:text-[1.05em] text-[var(--accent)]"
              />
            </h1>
          )}

          {/* Right Header Action & Help Trigger */}
          <div className="flex items-center gap-1 sm:gap-2.5 shrink-0 ml-auto">
            {headerAction}

            {showUpload && (
              <BigButton
                k="uploadPhotosMovies"
                size="small"
                icon={<UploadCloud className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-300" />}
                href="/admin/upload"
                variant="secondary"
                className="!min-h-[42px] sm:!min-h-[44px] !px-2 sm:!px-3.5 !py-1 !text-xs sm:!text-sm font-bold rounded-xl border-2 border-yellow-400/80 bg-yellow-400/10 hover:bg-yellow-400 hover:text-black shrink whitespace-nowrap"
              />
            )}

            <BigButton
              k="help"
              size="small"
              icon={<HelpCircle className="w-4 h-4 sm:w-5 sm:h-5" />}
              onClick={() => setShowHelpModal(true)}
              variant="accent"
              className="!min-h-[42px] sm:!min-h-[44px] !px-2 sm:!px-3.5 !py-1 !text-xs sm:!text-sm font-bold rounded-xl shrink whitespace-nowrap"
            />
          </div>
        </div>
      </header>

      {/* Admin/Section Sub-Navigation Bar */}
      {navItems && navItems.length > 0 && (
        <nav
          aria-label="Admin Navigation"
          className="w-full max-w-full overflow-hidden bg-[var(--bg-surface)] border-b-4 border-[var(--border-subtle)] px-2.5 sm:px-4 py-2 sm:py-3"
        >
          <div className="max-w-7xl mx-auto flex items-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar py-1">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="whitespace-nowrap shrink-0 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-sm sm:text-[var(--text-body)] font-semibold border-2 border-[var(--border-thick)] hover:bg-[var(--bg-surface-elevated)] transition-colors focus:ring-4 focus:ring-yellow-400"
              >
                <Bi k={item.key as any} />
              </a>
            ))}
          </div>
        </nav>
      )}

      {/* Main Page Content */}
      <main className={`flex-1 w-full max-w-7xl mx-auto p-3 sm:p-8 ${contentClassName}`}>
        {children}
      </main>

      {/* Reassuring Fullscreen Family Help Modal */}
      {showHelpModal && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-3 sm:p-8"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-[var(--bg-surface-elevated)] border-4 sm:border-6 border-[var(--accent)] rounded-3xl p-5 sm:p-12 max-w-2xl w-full flex flex-col items-center text-center gap-6 sm:gap-8 shadow-2xl overflow-y-auto max-h-[95vh]">
            <h2 className="text-2xl sm:text-[var(--text-heading)] font-bold text-yellow-300">
              <Bi k="askForHelp" layout="stacked" />
            </h2>

            <p className="text-base sm:text-[var(--text-body)] text-white font-medium max-w-lg">
              కంగారు పడకండి! సహాయం కోసం మీ కుటుంబ సభ్యుడికి నేరుగా కాల్ చేయండి.
              <br />
              <span className="text-[0.9em] text-slate-300">
                (Don&apos;t worry! Call or message your family member for instant help.)
              </span>
            </p>

            <div className="flex flex-col w-full gap-3.5 sm:gap-4">
              <a
                href={`tel:${helpPhoneNumber}`}
                className="kutumbam-focus min-h-[72px] sm:min-h-[88px] px-4 sm:px-8 py-3.5 sm:py-5 bg-green-700 hover:bg-green-600 text-white border-4 border-white rounded-3xl flex items-center justify-center gap-3 sm:gap-4 text-lg sm:text-[var(--text-btn)] font-bold shadow-lg"
                data-nav-item="true"
              >
                <Phone className="w-8 h-8 sm:w-10 sm:h-10 shrink-0" />
                <span className="truncate">Call {helpContactName} · కాల్ చేయండి</span>
              </a>

              <a
                href={`https://wa.me/${helpWhatsApp.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="kutumbam-focus min-h-[72px] sm:min-h-[88px] px-4 sm:px-8 py-3.5 sm:py-5 bg-[#25D366] hover:bg-[#20bd5a] text-black border-4 border-white rounded-3xl flex items-center justify-center gap-3 sm:gap-4 text-lg sm:text-[var(--text-btn)] font-bold shadow-lg"
                data-nav-item="true"
              >
                <MessageCircle className="w-8 h-8 sm:w-10 sm:h-10 shrink-0" />
                <span className="truncate">WhatsApp {helpContactName}</span>
              </a>
            </div>

            <BigButton
              k="close"
              icon={<X className="w-6 h-6 sm:w-8 sm:h-8" />}
              onClick={() => setShowHelpModal(false)}
              variant="secondary"
              className="w-full mt-2"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PageShell;
