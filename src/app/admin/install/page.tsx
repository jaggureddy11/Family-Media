"use client";

import React from "react";
import { Printer, Smartphone, Share, PlusSquare, MoreVertical, Download, CheckCircle2 } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { Bi } from "@/components/Bi";
import { BigButton } from "@/components/BigButton";

export default function AdminInstallGuidePage() {
  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <PageShell
      titleEn="Install on Mom's Phone"
      titleTe="అమ్మ ఫోన్‌లో ఇన్‌స్టాల్ చేయండి"
      backHref="/admin/library"
      adminOnly
      navItems={[
        { key: "library", href: "/admin/library" },
        { key: "uploadMedia", href: "/admin/upload" },
        { key: "familyMembers", href: "/admin/family" },
        { key: "activeDevices", href: "/admin/devices" },
      ]}
    >
      <div className="max-w-5xl mx-auto space-y-10">
        {/* Print Action Bar (Hidden on print) */}
        <div className="bg-zinc-900 border-4 border-zinc-700 rounded-2xl sm:rounded-3xl p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-yellow-400">
              <Bi en="Printable Setup Guide" te="ప్రింట్ చేయదగిన గైడ్" />
            </h2>
            <p className="text-base sm:text-xl text-zinc-300">
              <Bi
                en="Keep this paper beside Mom's phone or television for easy reference."
                te="సులభమైన సూచన కోసం ఈ కాగితాన్ని అమ్మ ఫోన్ లేదా టీవీ దగ్గర ఉంచండి."
              />
            </p>
          </div>

          <BigButton
            variant="primary"
            size="large"
            onClick={handlePrint}
            className="w-full sm:w-auto"
          >
            <Printer className="w-6 h-6 sm:w-8 sm:h-8 mr-2" />
            <Bi en="Print Guide" te="గైడ్ ప్రింట్ చేయండి" />
          </BigButton>
        </div>

        {/* iPhone / iPad Guide Card */}
        <section className="bg-zinc-900 border-4 sm:border-6 border-zinc-700 rounded-2xl sm:rounded-3xl p-5 sm:p-10 space-y-6 sm:space-y-8">
          <div className="flex items-center gap-3 sm:gap-4 border-b-4 border-zinc-800 pb-4 sm:pb-6">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-600/30 border-2 border-blue-400 text-blue-300 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0">
              <Smartphone className="w-7 h-7 sm:w-10 sm:h-10" />
            </div>
            <div>
              <h3 className="text-2xl sm:text-4xl font-extrabold text-white">
                <Bi en="Apple iPhone & iPad (Safari)" te="ఆపిల్ ఐఫోన్ & ఐప్యాడ్ (Safari)" />
              </h3>
              <p className="text-base sm:text-xl text-zinc-400 font-medium">
                <Bi en="3 easy steps to add Kutumbam app icon to home screen" te="హోమ్ స్క్రీన్‌పై కుటుంబం యాప్ చిహ్నాన్ని జోడించడానికి 3 సులభ దశలు" />
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            <div className="bg-zinc-800/80 border-4 border-zinc-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 flex flex-col items-center text-center space-y-3 sm:space-y-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-yellow-400 text-black rounded-full flex items-center justify-center text-2xl sm:text-3xl font-black">
                1
              </div>
              <Share className="w-10 h-10 sm:w-12 sm:h-12 text-blue-400" />
              <h4 className="text-xl sm:text-2xl font-bold text-white">
                <Bi en="Tap Share Button" te="షేర్ బటన్ నొక్కండి" />
              </h4>
              <p className="text-base sm:text-lg text-zinc-300">
                <Bi
                  en="At the bottom of Safari, tap the Share box icon (square with up arrow)."
                  te="సఫారి కింద ఉన్న షేర్ ఐకాన్ (పైకి బాణం గుర్తు) నొక్కండి."
                />
              </p>
            </div>

            <div className="bg-zinc-800/80 border-4 border-zinc-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 flex flex-col items-center text-center space-y-3 sm:space-y-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-yellow-400 text-black rounded-full flex items-center justify-center text-2xl sm:text-3xl font-black">
                2
              </div>
              <PlusSquare className="w-10 h-10 sm:w-12 sm:h-12 text-yellow-400" />
              <h4 className="text-xl sm:text-2xl font-bold text-white">
                <Bi en="'Add to Home Screen'" te="'హోమ్ స్క్రీన్‌కు జోడించు'" />
              </h4>
              <p className="text-base sm:text-lg text-zinc-300">
                <Bi
                  en="Scroll down the list and tap 'Add to Home Screen' with the plus icon."
                  te="క్రిందికి స్క్రోల్ చేసి '+' గుర్తుతో ఉన్న 'హోమ్ స్క్రీన్‌కు జోడించు' నొక్కండి."
                />
              </p>
            </div>

            <div className="bg-zinc-800/80 border-4 border-zinc-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 flex flex-col items-center text-center space-y-3 sm:space-y-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-yellow-400 text-black rounded-full flex items-center justify-center text-2xl sm:text-3xl font-black">
                3
              </div>
              <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12 text-green-400" />
              <h4 className="text-xl sm:text-2xl font-bold text-white">
                <Bi en="Tap 'Add' on Top Right" te="పైనున్న 'Add' నొక్కండి" />
              </h4>
              <p className="text-base sm:text-lg text-zinc-300">
                <Bi
                  en="Tap 'Add'. Kutumbam will appear right on Mom's phone home screen!"
                  te="'Add' నొక్కండి. కుటుంబం యాప్ నేరుగా హోమ్ స్క్రీన్‌పై కనిపిస్తుంది!"
                />
              </p>
            </div>
          </div>
        </section>

        {/* Android Guide Card */}
        <section className="bg-zinc-900 border-4 sm:border-6 border-zinc-700 rounded-2xl sm:rounded-3xl p-5 sm:p-10 space-y-6 sm:space-y-8">
          <div className="flex items-center gap-3 sm:gap-4 border-b-4 border-zinc-800 pb-4 sm:pb-6">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-600/30 border-2 border-green-400 text-green-300 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0">
              <Smartphone className="w-7 h-7 sm:w-10 sm:h-10" />
            </div>
            <div>
              <h3 className="text-2xl sm:text-4xl font-extrabold text-white">
                <Bi en="Android Phone (Google Chrome)" te="ఆండ్రాయిడ్ ఫోన్ (Google Chrome)" />
              </h3>
              <p className="text-base sm:text-xl text-zinc-400 font-medium">
                <Bi en="Simple steps for Samsung, Xiaomi, OnePlus & Vivo phones" te="శామ్‌సంగ్, వన్‌ప్లస్ తదితర ఫోన్‌లలో ఇన్‌స్టాల్ చేయడం" />
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            <div className="bg-zinc-800/80 border-4 border-zinc-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 flex flex-col items-center text-center space-y-3 sm:space-y-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-yellow-400 text-black rounded-full flex items-center justify-center text-2xl sm:text-3xl font-black">
                1
              </div>
              <MoreVertical className="w-10 h-10 sm:w-12 sm:h-12 text-green-400" />
              <h4 className="text-xl sm:text-2xl font-bold text-white">
                <Bi en="Tap 3 Dots Menu" te="మూడు చుక్కల మెనూ నొక్కండి" />
              </h4>
              <p className="text-base sm:text-lg text-zinc-300">
                <Bi
                  en="Tap the three vertical dots (⋮) in the top-right corner of Chrome."
                  te="క్రోమ్ బ్రౌజర్ పై కుడి మూలలో ఉన్న మూడు చుక్కల (⋮) గుర్తును నొక్కండి."
                />
              </p>
            </div>

            <div className="bg-zinc-800/80 border-4 border-zinc-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 flex flex-col items-center text-center space-y-3 sm:space-y-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-yellow-400 text-black rounded-full flex items-center justify-center text-2xl sm:text-3xl font-black">
                2
              </div>
              <Download className="w-10 h-10 sm:w-12 sm:h-12 text-yellow-400" />
              <h4 className="text-xl sm:text-2xl font-bold text-white">
                <Bi en="'Install App' / 'Add'" te="'యాప్‌ను ఇన్‌స్టాల్ చేయండి'" />
              </h4>
              <p className="text-base sm:text-lg text-zinc-300">
                <Bi
                  en="Select 'Install app' or 'Add to Home screen' from the menu."
                  te="మెనూలో 'యాప్‌ను ఇన్‌స్టాల్ చేయండి' లేదా 'హోమ్ స్క్రీన్‌కు జోడించు' ఎంచుకోండి."
                />
              </p>
            </div>

            <div className="bg-zinc-800/80 border-4 border-zinc-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 flex flex-col items-center text-center space-y-3 sm:space-y-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-yellow-400 text-black rounded-full flex items-center justify-center text-2xl sm:text-3xl font-black">
                3
              </div>
              <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12 text-green-400" />
              <h4 className="text-xl sm:text-2xl font-bold text-white">
                <Bi en="Done & Ready!" te="పూర్తయింది!" />
              </h4>
              <p className="text-base sm:text-lg text-zinc-300">
                <Bi
                  en="Tap Install. Mom can now open Kutumbam with one single tap on her phone!"
                  te="ఇన్‌స్టాల్ నొక్కండి. అమ్మ తన ఫోన్‌లో ఒకే ఒక్క ట్యాప్‌తో కుటుంబం తెరవగలరు!"
                />
              </p>
            </div>
          </div>
        </section>
      </div>
    </PageShell>
  );
}
