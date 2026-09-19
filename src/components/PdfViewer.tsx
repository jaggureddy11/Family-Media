"use client";

import React, { useState } from "react";
import { Bi } from "./Bi";

interface PdfViewerProps {
  title_en: string;
  title_te: string;
  pdfUrl: string;
  downloadUrl?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const PdfViewer: React.FC<PdfViewerProps> = ({
  title_en,
  title_te,
  pdfUrl,
  downloadUrl,
  isOpen,
  onClose,
}) => {
  const [zoomLevel, setZoomLevel] = useState(100);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${title_en} · ${title_te} PDF Viewer`}
      className="fixed inset-0 z-50 bg-black/95 text-white flex flex-col justify-between"
    >
      {/* Top Header Bar */}
      <header className="flex items-center justify-between p-4 sm:p-6 bg-slate-900 border-b-4 border-slate-800 z-10">
        <button
          type="button"
          onClick={onClose}
          className="min-h-[64px] px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl border-4 border-slate-600 hover:border-amber-400 font-bold text-2xl flex items-center gap-3 transition-all focus:ring-4 focus:ring-amber-400"
          aria-label="Back, వెనుకకు"
        >
          <span>←</span>
          <Bi stringKey="back" />
        </button>

        <div className="text-center px-4">
          <div className="font-extrabold text-2xl text-amber-400">
            {title_en} · {title_te}
          </div>
          <div className="text-sm text-slate-400">
            <Bi stringKey="pdfDocument" />
          </div>
        </div>

        {/* Zoom Controls & Download */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.max(70, z - 15))}
            className="min-h-[64px] min-w-[64px] p-3 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl border-4 border-slate-600 font-bold text-2xl flex items-center justify-center transition-all focus:ring-4 focus:ring-amber-400"
            aria-label="Zoom out"
          >
            🔍 -
          </button>
          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.min(160, z + 15))}
            className="min-h-[64px] min-w-[64px] p-3 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl border-4 border-slate-600 font-bold text-2xl flex items-center justify-center transition-all focus:ring-4 focus:ring-amber-400"
            aria-label="Zoom in"
          >
            🔍 +
          </button>
          {downloadUrl && (
            <a
              href={downloadUrl}
              download
              className="min-h-[64px] px-6 py-3 bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-xl rounded-2xl border-4 border-amber-200 flex items-center gap-2 transition-all focus:ring-4 focus:ring-amber-300"
            >
              <span>⬇</span>
              <Bi stringKey="download" />
            </a>
          )}
        </div>
      </header>

      {/* Main PDF Frame */}
      <main className="flex-1 w-full bg-slate-950 p-2 sm:p-6 overflow-auto flex items-center justify-center">
        <div
          className="w-full h-full max-w-5xl bg-white rounded-2xl overflow-hidden shadow-2xl transition-transform duration-200"
          style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: "top center" }}
        >
          <iframe
            src={`${pdfUrl}#toolbar=1&navpanes=0`}
            title={`${title_en} · ${title_te}`}
            className="w-full h-full min-h-[600px] border-0"
          />
        </div>
      </main>

      {/* Bottom Footer Action */}
      <footer className="p-4 bg-slate-900 border-t-4 border-slate-800 flex items-center justify-center">
        <button
          type="button"
          onClick={onClose}
          className="min-h-[64px] px-10 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-2xl rounded-2xl border-4 border-slate-600 hover:border-amber-400"
        >
          <Bi stringKey="close" />
        </button>
      </footer>
    </div>
  );
};
export default PdfViewer;
