"use client";

import React, { useState, useEffect } from "react";
import { Settings, Phone, MessageSquare, User, Check } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { Bi } from "@/components/Bi";
import { BigButton } from "@/components/BigButton";

export default function AdminSettingsPage() {
  const [helpContactName, setHelpContactName] = useState("Kiran (Son)");
  const [helpPhoneNumber, setHelpPhoneNumber] = useState("+919876543210");
  const [helpWhatsappNumber, setHelpWhatsappNumber] = useState("+919876543210");
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.helpContactName) setHelpContactName(data.helpContactName);
        if (data.helpPhoneNumber) setHelpPhoneNumber(data.helpPhoneNumber);
        if (data.helpWhatsappNumber) setHelpWhatsappNumber(data.helpWhatsappNumber);
      })
      .catch((err) => console.error("Failed to load settings:", err));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          helpContactName: helpContactName.trim(),
          helpPhoneNumber: helpPhoneNumber.trim(),
          helpWhatsappNumber: helpWhatsappNumber.trim(),
        }),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      console.error("Failed to save settings:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <PageShell
      titleEn="System Settings"
      titleTe="వ్యవస్థ అమరికలు"
      backHref="/admin/library"
    >
      <div className="max-w-4xl mx-auto space-y-8">
        <section className="bg-zinc-900 border-4 border-zinc-700 rounded-3xl p-6 md:p-8">
          <h2 className="text-3xl font-bold text-yellow-400 mb-6 flex items-center gap-3">
            <Phone className="w-9 h-9" />
            <Bi en="Mom's Help Card Contact Settings" te="అమ్మ సహాయం కార్డు వివరాలు" />
          </h2>

          <p className="text-2xl text-zinc-300 mb-8 leading-relaxed">
            <Bi
              en="Configure the one-tap contact details shown when Mom presses the Help button on any screen."
              te="ఏ స్క్రీన్‌లోనైనా అమ్మ 'సహాయం' బటన్ నొక్కినప్పుడు కనిపించే సంప్రదింపు వివరాలను అమర్చండి."
            />
          </p>

          <form onSubmit={handleSave} className="space-y-6">
            <div>
              <label className="block text-2xl text-zinc-200 font-bold mb-2">
                <Bi en="Contact Person Name" te="సంప్రదించాల్సిన వ్యక్తి పేరు" />
              </label>
              <input
                type="text"
                value={helpContactName}
                onChange={(e) => setHelpContactName(e.target.value)}
                placeholder="e.g. Kiran (Son)"
                className="w-full bg-zinc-800 border-4 border-zinc-600 rounded-2xl px-5 py-4 text-2xl text-white focus:border-yellow-400 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-2xl text-zinc-200 font-bold mb-2">
                <Bi en="Phone Number (for direct Call)" te="ఫోన్ నంబర్ (కాల్ కోసం)" />
              </label>
              <input
                type="tel"
                value={helpPhoneNumber}
                onChange={(e) => setHelpPhoneNumber(e.target.value)}
                placeholder="+919876543210"
                className="w-full bg-zinc-800 border-4 border-zinc-600 rounded-2xl px-5 py-4 text-2xl text-white focus:border-yellow-400 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-2xl text-zinc-200 font-bold mb-2">
                <Bi en="WhatsApp Number" te="వాట్సాప్ నంబర్" />
              </label>
              <input
                type="tel"
                value={helpWhatsappNumber}
                onChange={(e) => setHelpWhatsappNumber(e.target.value)}
                placeholder="+919876543210"
                className="w-full bg-zinc-800 border-4 border-zinc-600 rounded-2xl px-5 py-4 text-2xl text-white focus:border-yellow-400 focus:outline-none"
                required
              />
            </div>

            <div className="pt-4 flex items-center gap-4">
              <BigButton type="submit" variant="primary" size="large" disabled={isSaving}>
                <Bi
                  en={isSaving ? "Saving..." : "Save Settings"}
                  te={isSaving ? "భద్రపరుస్తోంది..." : "అమరికలను భద్రపరచు"}
                />
              </BigButton>
              {saved && (
                <span className="flex items-center gap-2 text-2xl text-green-400 font-bold">
                  <Check className="w-8 h-8" />
                  <Bi en="Saved!" te="భద్రపరచబడింది!" />
                </span>
              )}
            </div>
          </form>
        </section>
      </div>
    </PageShell>
  );
}
