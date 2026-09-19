"use client";

import React, { useState, useEffect, useTransition } from "react";
import { PageShell } from "@/components/PageShell";
import { Bi } from "@/components/Bi";
import { PdfViewer } from "@/components/PdfViewer";
import { AudioPlayer } from "@/components/AudioPlayer";
import { MediaViewer } from "@/components/MediaViewer";

interface FileItem {
  id: string;
  title_en: string;
  title_te: string;
  category: "PDF" | "AUDIO" | "IMAGE" | "OTHER";
  mimeType: string;
  sizeBytes: number;
  folderPath: string;
  downloadUrl: string;
  viewUrl: string;
}

interface Folder {
  name: string;
  path: string;
}

export default function FilesPage() {
  const [currentFolder, setCurrentFolder] = useState("/");
  const [folders, setFolders] = useState<Folder[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [, startTransition] = useTransition();

  // Modals
  const [activePdf, setActivePdf] = useState<FileItem | null>(null);
  const [activeAudio, setActiveAudio] = useState<FileItem | null>(null);
  const [activeImage, setActiveImage] = useState<FileItem | null>(null);

  // New Folder Modal (Admin)
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  const fetchFolderContent = async (folderPath: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/media/files?folder=${encodeURIComponent(folderPath)}`);
      if (res.ok) {
        const data = await res.json();
        setFolders(data.folders || []);
        setFiles(data.files || []);
      }
    } catch (err) {
      console.error("Failed to load files:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFolderContent(currentFolder);
  }, [currentFolder]);

  const handleOpenFolder = (path: string) => {
    startTransition(() => {
      setCurrentFolder(path);
    });
  };

  const handleGoUp = () => {
    if (currentFolder === "/") return;
    const parts = currentFolder.split("/").filter(Boolean);
    parts.pop();
    const parent = parts.length === 0 ? "/" : `/${parts.join("/")}/`;
    handleOpenFolder(parent);
  };

  const handleOpenFile = (file: FileItem) => {
    if (file.category === "PDF") {
      setActivePdf(file);
    } else if (file.category === "AUDIO") {
      setActiveAudio(file);
    } else if (file.category === "IMAGE") {
      setActiveImage(file);
    } else {
      // Direct Download for other types
      window.open(file.downloadUrl, "_blank");
    }
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    setIsCreatingFolder(true);
    try {
      const res = await fetch("/api/media/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          folderName: newFolderName,
          parentPath: currentFolder,
        }),
      });

      if (res.ok) {
        setNewFolderName("");
        setShowNewFolderModal(false);
        fetchFolderContent(currentFolder);
      }
    } catch (err) {
      console.error("Failed to create folder:", err);
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return "0 KB";
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case "PDF":
        return "📄";
      case "AUDIO":
        return "🎵";
      case "IMAGE":
        return "🖼";
      default:
        return "📁";
    }
  };

  const getCategoryStringKey = (cat: string) => {
    switch (cat) {
      case "PDF":
        return "pdfDocument";
      case "AUDIO":
        return "audioFile";
      case "IMAGE":
        return "imageFile";
      default:
        return "unknownFile";
    }
  };

  // Breadcrumbs
  const breadcrumbSegments = currentFolder.split("/").filter(Boolean);

  return (
    <PageShell titleStringKey="otherFiles">
      {/* Folder Navigation & Actions Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 p-4 bg-slate-900 border-4 border-slate-800 rounded-3xl">
        {/* Breadcrumb Path */}
        <div className="flex items-center gap-2 text-2xl font-extrabold text-amber-400 overflow-x-auto py-1">
          <button
            type="button"
            onClick={() => handleOpenFolder("/")}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-white flex items-center gap-2 focus:ring-2 focus:ring-amber-400"
          >
            <span>🏠</span>
            <Bi stringKey="rootFolder" />
          </button>

          {breadcrumbSegments.map((segment, idx) => {
            const path = `/${breadcrumbSegments.slice(0, idx + 1).join("/")}/`;
            return (
              <React.Fragment key={path}>
                <span className="text-slate-600">/</span>
                <button
                  type="button"
                  onClick={() => handleOpenFolder(path)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-amber-300 focus:ring-2 focus:ring-amber-400 font-bold"
                >
                  {segment}
                </button>
              </React.Fragment>
            );
          })}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {currentFolder !== "/" && (
            <button
              type="button"
              onClick={handleGoUp}
              className="min-h-[56px] px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xl rounded-2xl border-2 border-slate-600 flex items-center gap-2"
            >
              <span>↑</span>
              <Bi stringKey="back" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowNewFolderModal(true)}
            className="min-h-[56px] px-6 py-2.5 bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-xl rounded-2xl border-2 border-amber-200 flex items-center gap-2 shadow-md focus:ring-4 focus:ring-amber-300"
          >
            <span>+</span>
            <Bi stringKey="newFolder" />
          </button>
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mb-4" />
          <div className="text-2xl font-bold text-slate-400">
            <Bi stringKey="gettingReady" />
          </div>
        </div>
      ) : folders.length === 0 && files.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/60 rounded-3xl border-2 border-slate-800">
          <p className="text-3xl text-slate-400 font-bold mb-4">
            <Bi stringKey="noFilesEmpty" />
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {/* Subfolders Grid */}
          {folders.length > 0 && (
            <div>
              <h2 className="text-3xl font-extrabold text-amber-400 mb-6 flex items-center gap-3">
                <span>📁</span>
                <Bi stringKey="folders" />
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {folders.map((folder) => (
                  <button
                    key={folder.path}
                    type="button"
                    onClick={() => handleOpenFolder(folder.path)}
                    className="group min-h-[110px] p-6 bg-slate-900 rounded-3xl border-4 border-slate-800 hover:border-amber-400 text-left transition-all shadow-lg active:scale-95 flex items-center gap-4 focus:ring-4 focus:ring-amber-400"
                  >
                    <span className="text-5xl group-hover:scale-110 transition-transform">
                      📁
                    </span>
                    <div>
                      <h3 className="text-2xl sm:text-3xl font-extrabold text-white group-hover:text-amber-400">
                        {folder.name}
                      </h3>
                      <span className="text-sm text-slate-400 font-bold">
                        <Bi stringKey="folder" />
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Files List */}
          {files.length > 0 && (
            <div>
              <h2 className="text-3xl font-extrabold text-amber-400 mb-6 flex items-center gap-3">
                <span>📄</span>
                <Bi stringKey="documents" />
              </h2>
              <div className="space-y-4">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="p-5 sm:p-6 bg-slate-900 rounded-3xl border-4 border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all hover:border-slate-600 shadow-md"
                  >
                    {/* File Info */}
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-16 h-16 rounded-2xl bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-4xl flex-shrink-0">
                        {getCategoryIcon(file.category)}
                      </div>
                      <div>
                        <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-1">
                          {file.title_en}
                        </h3>
                        <h4 className="text-xl sm:text-2xl font-bold text-amber-300 mb-1">
                          {file.title_te}
                        </h4>
                        <div className="flex items-center gap-3 text-sm font-bold text-slate-400">
                          <span className="px-2.5 py-0.5 bg-slate-800 rounded-lg text-slate-300">
                            <Bi stringKey={getCategoryStringKey(file.category) as any} />
                          </span>
                          <span>•</span>
                          <span>{formatFileSize(file.sizeBytes)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons: Open & Download */}
                    <div className="flex items-center gap-3 w-full md:w-auto">
                      <button
                        type="button"
                        onClick={() => handleOpenFile(file)}
                        className="flex-1 md:flex-initial min-h-[64px] px-8 bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-2xl rounded-2xl border-4 border-amber-200 flex items-center justify-center gap-2 shadow-lg active:scale-95 focus:ring-4 focus:ring-amber-300"
                      >
                        <span>👁</span>
                        <Bi stringKey="open" />
                      </button>

                      <a
                        href={file.downloadUrl}
                        download
                        className="flex-1 md:flex-initial min-h-[64px] px-6 bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xl rounded-2xl border-4 border-slate-600 flex items-center justify-center gap-2 active:scale-95 focus:ring-4 focus:ring-amber-400"
                        aria-label="Download file"
                      >
                        <span>⬇</span>
                        <Bi stringKey="download" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* In-Browser PDF Document Viewer Modal */}
      {activePdf && (
        <PdfViewer
          title_en={activePdf.title_en}
          title_te={activePdf.title_te}
          pdfUrl={activePdf.viewUrl}
          downloadUrl={activePdf.downloadUrl}
          isOpen={true}
          onClose={() => setActivePdf(null)}
        />
      )}

      {/* In-Browser Audio Player Modal */}
      {activeAudio && (
        <AudioPlayer
          title_en={activeAudio.title_en}
          title_te={activeAudio.title_te}
          audioUrl={activeAudio.viewUrl}
          downloadUrl={activeAudio.downloadUrl}
          isOpen={true}
          onClose={() => setActiveAudio(null)}
        />
      )}

      {/* In-Browser Fullscreen Image Viewer Modal */}
      {activeImage && (
        <MediaViewer
          isOpen={true}
          items={[
            {
              id: activeImage.id,
              type: "FILE",
              title_en: activeImage.title_en,
              title_te: activeImage.title_te,
              fullUrl: activeImage.viewUrl,
              thumbUrl: activeImage.viewUrl,
            },
          ]}
          initialIndex={0}
          onClose={() => setActiveImage(null)}
        />
      )}

      {/* Create Folder Modal */}
      {showNewFolderModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Create New Folder"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="w-full max-w-lg bg-slate-900 border-4 border-amber-400 rounded-3xl p-6 sm:p-8 shadow-2xl">
            <h3 className="text-3xl font-extrabold text-white mb-2">
              <Bi stringKey="createFolder" />
            </h3>
            <p className="text-slate-400 font-bold mb-6">
              In: {currentFolder}
            </p>

            <form onSubmit={handleCreateFolder} className="space-y-6">
              <div>
                <label className="block text-xl font-bold text-amber-300 mb-2">
                  <Bi stringKey="folderName" />
                </label>
                <input
                  type="text"
                  required
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="e.g. Medical Records / వైద్య రికార్డులు"
                  className="w-full min-h-[64px] px-6 bg-slate-800 border-4 border-slate-600 rounded-2xl text-2xl font-bold text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex gap-4 pt-2">
                <button
                  type="submit"
                  disabled={isCreatingFolder}
                  className="flex-1 min-h-[64px] bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-2xl rounded-2xl border-4 border-amber-200"
                >
                  {isCreatingFolder ? "..." : <Bi stringKey="save" />}
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewFolderModal(false)}
                  className="flex-1 min-h-[64px] bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-2xl rounded-2xl border-4 border-slate-600"
                >
                  <Bi stringKey="cancel" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageShell>
  );
}
