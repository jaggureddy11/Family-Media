"use client";

import React, { useState, useEffect } from "react";
import { Phone, MessageCircle, X, HelpCircle } from "lucide-react";
import { Bi } from "./Bi";
import { BigButton } from "./BigButton";

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  const [contactName, setContactName] = useState("Kiran (Son)");
  const [phoneNumber, setPhoneNumber] = useState("+919876543210");
  const [whatsappNumber, setWhatsappNumber] = useState("+919876543210");

  useEffect(() => {
    if (isOpen) {
      fetch("/api/settings")
        .then((r) => r.json())
        .then((data) => {
          if (data.helpContactName) setContactName(data.helpContactName);
          if (data.helpPhoneNumber) setPhoneNumber(data.helpPhoneNumber);
          if (data.helpWhatsappNumber) setWhatsappNumber(data.helpWhatsappNumber);
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const cleanWhatsapp = whatsappNumber.replace(/[^0-9]/g, "");

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="Help · సహాయం"
    >
      <div className="bg-zinc-900 border-8 border-yellow-400 rounded-3xl p-6 sm:p-10 max-w-2xl w-full text-center space-y-8 shadow-2xl">
        <div className="flex justify-center mb-2">
          <div className="w-24 h-24 bg-yellow-400 text-black rounded-full flex items-center justify-center shadow-lg">
            <HelpCircle className="w-16 h-16 stroke-[2.5]" />
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-4xl sm:text-5xl font-extrabold text-white">
            <Bi en="Need Help?" te="సహాయం కావాలా?" />
          </h2>
          <p className="text-2xl sm:text-3xl text-zinc-300 font-medium">
            <Bi
              en="Tap below to call or message anytime."
              te="ఎప్పుడైనా కాల్ లేదా మెసేజ్ చేయడానికి క్రింద నొక్కండి."
            />
          </p>
        </div>

        <div className="space-y-5 pt-4">
          {/* Direct Phone Call Button */}
          <a
            href={`tel:${phoneNumber}`}
            className="w-full flex items-center justify-center gap-4 bg-green-600 hover:bg-green-500 text-white font-bold text-3xl sm:text-4xl py-6 sm:py-8 px-6 rounded-3xl border-4 border-green-300 shadow-xl active:scale-95 transition-transform"
          >
            <Phone className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0" />
            <span className="truncate">
              <Bi en={`Call ${contactName}`} te={`${contactName}కి కాల్ చేయండి`} />
            </span>
          </a>

          {/* WhatsApp Message Button */}
          <a
            href={`https://wa.me/${cleanWhatsapp}?text=Namaste,%20I%20need%20help%20with%20Kutumbam`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-4 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-3xl sm:text-4xl py-6 sm:py-8 px-6 rounded-3xl border-4 border-emerald-400 shadow-xl active:scale-95 transition-transform"
          >
            <MessageCircle className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0" />
            <span className="truncate">
              <Bi en={`WhatsApp ${contactName}`} te={`${contactName}కి వాట్సాప్`} />
            </span>
          </a>
        </div>

        <div className="pt-4 border-t-2 border-zinc-800">
          <BigButton
            variant="secondary"
            size="large"
            className="w-full text-3xl py-6 border-4"
            onClick={onClose}
          >
            <X className="w-8 h-8 mr-2" />
            <Bi en="Close · Go Back" te="మూసివేయి · వెనుకకు" />
          </BigButton>
        </div>
      </div>
    </div>
  );
}
