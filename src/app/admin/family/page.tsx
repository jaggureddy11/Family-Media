"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { UserPlus, QrCode, Copy, Check, MessageSquare, Laptop, User as UserIcon } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { Bi } from "@/components/Bi";
import { BigButton } from "@/components/BigButton";

interface UserItem {
  id: string;
  name_en: string;
  name_te: string;
  role: "ADMIN" | "FAMILY";
  textSize?: string;
  highContrast?: boolean;
  devices: { id: string; deviceName: string; lastSeenAt: string }[];
}

interface GeneratedLink {
  linkUrl: string;
  qrDataUrl: string;
  userNameEn: string;
  userNameTe: string;
  expiresAt: string;
}

export default function AdminFamilyPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [nameEn, setNameEn] = useState("");
  const [nameTe, setNameTe] = useState("");
  const [role, setRole] = useState<"FAMILY" | "ADMIN">("FAMILY");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<GeneratedLink | null>(null);
  const [copied, setCopied] = useState(false);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/family");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error("Failed to load family members:", err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUpdateProfile = async (
    id: string,
    updates: { textSize?: string; highContrast?: boolean }
  ) => {
    setSavingUserId(id);
    try {
      const res = await fetch("/api/admin/family", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates }),
      });
      if (res.ok) {
        await fetchUsers();
      }
    } catch (err) {
      console.error("Failed to update profile:", err);
    } finally {
      setSavingUserId(null);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameEn.trim() || !nameTe.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/family", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name_en: nameEn.trim(), name_te: nameTe.trim(), role }),
      });

      if (res.ok) {
        setNameEn("");
        setNameTe("");
        setRole("FAMILY");
        await fetchUsers();
      }
    } catch (err) {
      console.error("Failed to add member:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateLink = async (userId: string) => {
    try {
      const res = await fetch("/api/admin/family/create-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (res.ok) {
        const data = await res.json();
        setGeneratedLink(data);
        setCopied(false);
      }
    } catch (err) {
      console.error("Failed to create device link:", err);
    }
  };

  const copyToClipboard = () => {
    if (!generatedLink) return;
    navigator.clipboard.writeText(generatedLink.linkUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <PageShell
      titleKey="familyMembers"
      showBack={true}
      showHome={true}
      headerAction={
        <Link
          href="/admin/devices"
          className="kutumbam-focus min-h-[56px] sm:min-h-[80px] px-3 sm:px-6 py-1 bg-[var(--bg-surface-elevated)] border-4 border-[var(--border-subtle)] hover:border-white rounded-3xl flex items-center gap-2 text-[var(--text-min)] font-bold"
          data-nav-item="true"
        >
          <Laptop className="w-6 h-6 text-yellow-300" />
          <Bi k="activeDevices" />
        </Link>
      }
      navItems={[
        { key: "library", href: "/admin/library" },
        { key: "uploadMedia", href: "/admin/upload" },
        { key: "activeDevices", href: "/admin/devices" },
        { key: "installGuide", href: "/admin/install" },
      ]}
    >
      <div className="flex flex-col gap-12 pb-16">
        {/* Generated Link Modal / Card */}
        {generatedLink && (
          <div className="p-6 sm:p-10 bg-yellow-950/40 border-4 border-yellow-400 rounded-3xl flex flex-col items-center text-center gap-6 shadow-2xl">
            <h2 className="text-[var(--text-heading)] font-bold text-yellow-300">
              <Bi k="deviceLinkCreated" layout="stacked" />
            </h2>
            <p className="text-[var(--text-body)] text-white font-semibold">
              {generatedLink.userNameEn} · {generatedLink.userNameTe}
            </p>

            {/* QR Code */}
            <div className="p-4 bg-white rounded-2xl shadow-lg inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={generatedLink.qrDataUrl}
                alt="Device link QR code"
                className="w-56 h-56 sm:w-72 sm:h-72 object-contain"
              />
            </div>

            {/* Link Text Box */}
            <div className="w-full max-w-xl p-4 bg-black/80 border-2 border-slate-700 rounded-2xl break-all font-mono text-base sm:text-lg text-yellow-200 select-all">
              {generatedLink.linkUrl}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xl">
              <button
                type="button"
                onClick={copyToClipboard}
                className="kutumbam-focus flex-1 min-h-[72px] px-6 py-3 bg-[var(--accent)] hover:bg-yellow-400 !text-black font-bold border-4 border-white rounded-2xl flex items-center justify-center gap-3 text-[var(--text-body)] cursor-pointer"
                data-nav-item="true"
              >
                {copied ? (
                  <>
                    <Check className="w-8 h-8 text-green-900" />
                    <Bi k="copied" />
                  </>
                ) : (
                  <>
                    <Copy className="w-8 h-8" />
                    <Bi k="copyLink" />
                  </>
                )}
              </button>

              <a
                href={`https://wa.me/?text=${encodeURIComponent(
                  `Kutumbam · కుటుంబం login link for ${generatedLink.userNameEn}: ${generatedLink.linkUrl}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="kutumbam-focus flex-1 min-h-[72px] px-6 py-3 bg-green-700 hover:bg-green-600 text-white font-bold border-4 border-green-400 rounded-2xl flex items-center justify-center gap-3 text-[var(--text-body)] cursor-pointer"
                data-nav-item="true"
              >
                <MessageSquare className="w-8 h-8 text-white" />
                <Bi k="sendViaWhatsApp" />
              </a>
            </div>

            <button
              type="button"
              onClick={() => setGeneratedLink(null)}
              className="kutumbam-focus min-h-[56px] px-8 py-2 bg-slate-800 text-slate-300 hover:text-white border-2 border-slate-600 rounded-2xl text-[var(--text-body)]"
              data-nav-item="true"
            >
              <Bi k="close" />
            </button>
          </div>
        )}

        {/* Add Member Form */}
        <section className="bg-[var(--bg-surface)] border-4 border-[var(--border-subtle)] p-6 sm:p-10 rounded-3xl flex flex-col gap-6">
          <h2 className="text-[var(--text-heading)] font-bold text-yellow-300 flex items-center gap-3">
            <UserPlus className="w-10 h-10" />
            <Bi k="addFamilyMember" />
          </h2>

          <form onSubmit={handleAddMember} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-[var(--text-body)] font-semibold text-slate-200">
                English Name (e.g. Amma)
              </label>
              <input
                type="text"
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                placeholder="Amma"
                required
                className="kutumbam-focus min-h-[64px] px-4 text-[var(--text-body)] bg-[var(--bg-surface-elevated)] text-white border-4 border-[var(--border-thick)] rounded-2xl font-sans"
                data-nav-item="true"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[var(--text-body)] font-semibold text-slate-200">
                Telugu Name (e.g. అమ్మా)
              </label>
              <input
                type="text"
                value={nameTe}
                onChange={(e) => setNameTe(e.target.value)}
                placeholder="అమ్మా"
                required
                className="kutumbam-focus min-h-[64px] px-4 text-[var(--text-body)] bg-[var(--bg-surface-elevated)] text-white border-4 border-[var(--border-thick)] rounded-2xl font-telugu"
                data-nav-item="true"
              />
            </div>

            <div className="sm:col-span-2 flex justify-end">
              <BigButton
                k="addFamilyMember"
                icon={<UserPlus className="w-8 h-8" />}
                onClick={() => {}}
                variant="accent"
                disabled={isSubmitting || !nameEn.trim() || !nameTe.trim()}
                className="w-full sm:w-auto"
              />
            </div>
          </form>
        </section>

        {/* Family Members List */}
        <section className="flex flex-col gap-6">
          <h2 className="text-[var(--text-heading)] font-bold text-white border-b-4 border-[var(--border-subtle)] pb-3">
            <Bi k="familyMembers" />
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {users.map((u) => (
              <div
                key={u.id}
                className="p-6 bg-[var(--bg-surface-elevated)] border-4 border-[var(--border-subtle)] rounded-3xl flex flex-col justify-between gap-6"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-yellow-400 flex items-center justify-center text-yellow-300">
                        <UserIcon className="w-10 h-10" />
                      </div>
                      <div>
                        <h3 className="text-[var(--text-heading)] font-bold text-white">
                          <Bi text={{ en: u.name_en, te: u.name_te }} layout="auto" />
                        </h3>
                        <span className="text-sm font-semibold uppercase px-3 py-1 bg-slate-800 text-yellow-300 rounded-full border border-slate-600 inline-block mt-1">
                          {u.role}
                        </span>
                      </div>
                    </div>

                    <span className="text-slate-400 text-[var(--text-body)]">
                      {u.devices.length} {u.devices.length === 1 ? "device" : "devices"}
                    </span>
                  </div>

                  {/* Accessibility & Visual Preferences per Profile */}
                  <div className="bg-black/40 border-2 border-zinc-700 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-zinc-300">
                        <Bi en="Text Scale" te="అక్షరాల పరిమాణం" />
                      </span>
                      <select
                        value={u.textSize || "EXTRA_LARGE"}
                        onChange={(e) =>
                          handleUpdateProfile(u.id, { textSize: e.target.value })
                        }
                        className="bg-zinc-800 border-2 border-zinc-600 text-yellow-400 font-bold px-3 py-2 rounded-xl text-base focus:border-yellow-400 focus:outline-none"
                      >
                        <option value="LARGE">Large (1.0x)</option>
                        <option value="EXTRA_LARGE">Extra Large (1.25x - Default)</option>
                        <option value="HUGE">Huge (1.5x)</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-zinc-300">
                        <Bi en="High Contrast Theme" te="అధిక కాంట్రాస్ట్" />
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateProfile(u.id, { highContrast: !u.highContrast })
                        }
                        className={`px-4 py-1.5 rounded-xl text-base font-bold border-2 transition-colors ${
                          u.highContrast
                            ? "bg-yellow-400 text-black border-yellow-300"
                            : "bg-zinc-800 text-zinc-300 border-zinc-600"
                        }`}
                      >
                        {u.highContrast ? "ON (Yellow/Black)" : "OFF (Dark Theme)"}
                      </button>
                    </div>
                  </div>
                </div>

                <BigButton
                  k="createDeviceLink"
                  icon={<QrCode className="w-8 h-8" />}
                  onClick={() => handleCreateLink(u.id)}
                  variant="primary"
                  className="w-full"
                />
              </div>
            ))}
          </div>
        </section>
      </div>
    </PageShell>
  );
}

