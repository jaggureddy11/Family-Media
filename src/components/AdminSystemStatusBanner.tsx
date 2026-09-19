"use client";

import React, { useEffect, useState } from "react";
import { Database, HardDrive, AlertTriangle, CheckCircle2 } from "lucide-react";

interface SystemStatus {
  storage: {
    isReal: boolean;
    label: string;
    providerName: string;
  };
  database: {
    isReal: boolean;
    label: string;
  };
  isProduction: boolean;
}

export function AdminSystemStatusBanner() {
  const [status, setStatus] = useState<SystemStatus | null>(null);

  useEffect(() => {
    fetch("/api/admin/system-status")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.storage && data.database) {
          setStatus(data);
        }
      })
      .catch(() => {
        // Fallback or ignore network error
      });
  }, []);

  if (!status) return null;

  const storageIsMock = !status.storage.isReal;
  const dbIsMock = !status.database.isReal;
  const anyMock = storageIsMock || dbIsMock;

  return (
    <div
      role="status"
      aria-label="Admin System Storage and Database Status"
      className={`w-full py-2.5 px-4 flex flex-wrap items-center justify-between gap-3 text-base md:text-lg font-bold transition-all shadow-md ${
        anyMock
          ? "bg-red-600 text-white border-b-4 border-red-900"
          : "bg-neutral-900 text-neutral-100 border-b-2 border-emerald-500/40"
      }`}
    >
      <div className="flex flex-wrap items-center gap-3 md:gap-6">
        {/* Storage Badge */}
        <div
          className={`flex items-center gap-2 px-3 py-1 rounded-md border text-sm md:text-base font-extrabold ${
            storageIsMock
              ? "bg-red-800 text-red-100 border-red-400 animate-pulse"
              : "bg-emerald-950/80 text-emerald-300 border-emerald-500/50"
          }`}
        >
          <HardDrive className="w-5 h-5 flex-shrink-0" />
          <span>{status.storage.label}</span>
          {storageIsMock ? (
            <AlertTriangle className="w-4 h-4 ml-1 text-yellow-300" />
          ) : (
            <CheckCircle2 className="w-4 h-4 ml-1 text-emerald-400" />
          )}
        </div>

        {/* Database Badge */}
        <div
          className={`flex items-center gap-2 px-3 py-1 rounded-md border text-sm md:text-base font-extrabold ${
            dbIsMock
              ? "bg-red-800 text-red-100 border-red-400 animate-pulse"
              : "bg-emerald-950/80 text-emerald-300 border-emerald-500/50"
          }`}
        >
          <Database className="w-5 h-5 flex-shrink-0" />
          <span>{status.database.label}</span>
          {dbIsMock ? (
            <AlertTriangle className="w-4 h-4 ml-1 text-yellow-300" />
          ) : (
            <CheckCircle2 className="w-4 h-4 ml-1 text-emerald-400" />
          )}
        </div>
      </div>

      {anyMock && (
        <div className="text-xs md:text-sm font-semibold tracking-wide uppercase bg-black/40 px-2.5 py-0.5 rounded text-yellow-200">
          ⚠️ Development Mode Only: Real S3/B2 &amp; Neon Required for Production
        </div>
      )}
    </div>
  );
}
