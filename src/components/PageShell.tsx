"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Home, HelpCircle, Phone, MessageCircle, X } from "lucide-react";
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
    contactName: "Family Admin",
    phoneNumber: "+919876543210",
    whatsappNumber: "+919876543210",
  });

  // Fetch help settings and profile preferences on mount
  React.useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.helpContactName) {
          setHelpInfo({
            contactName: data.helpContactName,
            phoneNumber: data.helpPhoneNumber || "+919876543210",
            whatsappNumber: data.helpWhatsappNumber || "+919876543210",
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
      } else {
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
    <div className="min-h-screen flex flex-col bg-[var(--bg-main)] text-[var(--text-primary)]">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 bg-[var(--bg-main)]/95 backdrop-blur-sm border-b-4 border-[var(--border-subtle)] px-2 sm:px-8 py-2.5 sm:py-5">
        <div className="max-w-7xl mx-auto flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 sm:gap-4">
          {/* Navigation Controls: Back & Home or Top-Left Action */}
          <div className="flex items-center gap-1 sm:gap-4">
            {topLeftAction}

            {showBack && (
              <BigButton
                k="back"
                icon={<ArrowLeft className="w-6 h-6 sm:w-8 sm:h-8" />}
                onClick={handleBackClick}
                variant="secondary"
                className="!min-h-[56px] sm:!min-h-[80px] !px-2 sm:!px-6 !py-1 !text-[var(--text-min)] shrink"
              />
            )}

            {showHome && (
              <BigButton
                k="home"
                icon={<Home className="w-6 h-6 sm:w-8 sm:h-8" />}
                href="/"
                variant="secondary"
                className="!min-h-[56px] sm:!min-h-[80px] !px-2 sm:!px-6 !py-1 !text-[var(--text-min)] shrink"
              />
            )}
          </div>

          {/* Right Header Action & Help Trigger */}
          <div className="flex items-center gap-1 sm:gap-4">
            {headerAction}

            <BigButton
              k="help"
              icon={<HelpCircle className="w-6 h-6 sm:w-8 sm:h-8" />}
              onClick={() => setShowHelpModal(true)}
              variant="accent"
              className="!min-h-[56px] sm:!min-h-[80px] !px-2 sm:!px-6 !py-1 !text-[var(--text-min)] shrink"
            />
          </div>

          {/* Heading (if provided) */}
          {(effectiveTitle || effectiveTitleKey) && (
            <h1 className="w-full sm:w-auto sm:flex-1 text-[var(--text-heading)] font-bold text-center order-last sm:order-none px-2 mt-2 sm:mt-0">
              <Bi
                text={effectiveTitle}
                k={effectiveTitleKey}
                layout="auto"
                enClassName="text-[0.85em] text-[var(--text-secondary)]"
                teClassName="text-[1.05em] text-[var(--accent)]"
              />
            </h1>
          )}
        </div>
      </header>

      {/* Admin/Section Sub-Navigation Bar */}
      {navItems && navItems.length > 0 && (
        <nav
          aria-label="Admin Navigation"
          className="bg-[var(--bg-surface)] border-b-4 border-[var(--border-subtle)] px-4 py-3"
        >
          <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-3">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="px-4 py-2 rounded-xl text-[var(--text-body)] font-semibold border-2 border-[var(--border-thick)] hover:bg-[var(--bg-surface-elevated)] transition-colors focus:ring-4 focus:ring-yellow-400"
              >
                <Bi k={item.key as any} />
              </a>
            ))}
          </div>
        </nav>
      )}

      {/* Main Page Content */}
      <main className={`flex-1 w-full max-w-7xl mx-auto p-4 sm:p-8 ${contentClassName}`}>
        {children}
      </main>

      {/* Reassuring Fullscreen Family Help Modal */}
      {showHelpModal && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 sm:p-8"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-[var(--bg-surface-elevated)] border-6 border-[var(--accent)] rounded-3xl p-6 sm:p-12 max-w-2xl w-full flex flex-col items-center text-center gap-8 shadow-2xl">
            <h2 className="text-[var(--text-heading)] font-bold text-yellow-300">
              <Bi k="askForHelp" layout="stacked" />
            </h2>

            <p className="text-[var(--text-body)] text-white font-medium max-w-lg">
              కంగారు పడకండి! సహాయం కోసం మీ కుటుంబ సభ్యుడికి నేరుగా కాల్ చేయండి.
              <br />
              <span className="text-[0.9em] text-slate-300">
                (Don&apos;t worry! Call or message your family member for instant help.)
              </span>
            </p>

            <div className="flex flex-col w-full gap-4">
              <a
                href={`tel:${helpPhoneNumber}`}
                className="kutumbam-focus min-h-[88px] px-8 py-5 bg-green-700 hover:bg-green-600 text-white border-4 border-white rounded-3xl flex items-center justify-center gap-4 text-[var(--text-btn)] font-bold"
                data-nav-item="true"
              >
                <Phone className="w-10 h-10" />
                <span>Call {helpContactName} · కాల్ చేయండి</span>
              </a>

              <a
                href={`https://wa.me/${helpWhatsApp.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="kutumbam-focus min-h-[88px] px-8 py-5 bg-[#25D366] hover:bg-[#20bd5a] text-black border-4 border-white rounded-3xl flex items-center justify-center gap-4 text-[var(--text-btn)] font-bold"
                data-nav-item="true"
              >
                <MessageCircle className="w-10 h-10" />
                <span>WhatsApp {helpContactName}</span>
              </a>
            </div>

            <BigButton
              k="close"
              icon={<X className="w-8 h-8" />}
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
