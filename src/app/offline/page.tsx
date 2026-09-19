"use client";

import React from "react";
import { WifiOff, RotateCcw, Home } from "lucide-react";
import { Bi } from "@/components/Bi";
import { BigButton } from "@/components/BigButton";

export default function OfflinePage() {
  const handleRetry = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-xl w-full bg-zinc-900 border-8 border-yellow-400 rounded-3xl p-8 sm:p-12 space-y-8 shadow-2xl">
        <div className="flex justify-center">
          <div className="w-28 h-28 bg-red-950 border-4 border-red-500 text-red-400 rounded-full flex items-center justify-center">
            <WifiOff className="w-16 h-16 stroke-[2.5]" />
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white">
            <Bi en="No Internet Connection" te="ఇంటర్నెట్ లేదు" />
          </h1>
          <p className="text-2xl sm:text-3xl text-zinc-300 font-medium leading-relaxed">
            <Bi
              en="Please check your Wi-Fi or mobile network and try again."
              te="దయచేసి మీ వైఫై (Wi-Fi) లేదా మొబైల్ డేటాను తనిఖీ చేసి మళ్ళీ ప్రయత్నించండి."
            />
          </p>
        </div>

        <div className="space-y-4 pt-4">
          <BigButton
            variant="primary"
            size="large"
            className="w-full text-3xl py-7"
            onClick={handleRetry}
          >
            <RotateCcw className="w-8 h-8 mr-3 animate-spin" />
            <Bi en="Try Again" te="మళ్ళీ ప్రయత్నించండి" />
          </BigButton>

          <BigButton
            variant="secondary"
            size="large"
            className="w-full text-2xl py-6"
            href="/"
          >
            <Home className="w-7 h-7 mr-3" />
            <Bi en="Go to Home" te="హోమ్‌కి వెళ్లండి" />
          </BigButton>
        </div>
      </div>
    </div>
  );
}
