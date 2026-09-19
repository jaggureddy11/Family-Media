"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Folder, FileText, FolderPlus, Trash2, Edit, Move, ArrowLeft, Check, AlertTriangle } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { Bi } from "@/components/Bi";
import { BigButton } from "@/components/BigButton";

interface FileItem {
  id: string;
  type: string;
  title_en: string;
  title_te: string;
  folderPath?: string;
  mimeType: string;
  sizeBytes?: string | number;
}

export default function AdminFilesPage() {
  const [currentFolder, setCurrentFolder] = useState("/");
  const [items, setItems] = useState<FileItem[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal actions
  const [newFolderName, setNewFolderName] = useState("");
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [editingItem, setEditingItem] = useState<FileItem | null>(null);
  const [renameEn, setRenameEn] = useState("");
  const [renameTe, setRenameTe] = useState("");
  const [movingItem, setMovingItem] = useState<FileItem | null>(null);
  const [targetMoveFolder, setTargetMoveFolder] = useState("/");
  const [deletingItem, setDeletingItem] = useState<{ id?: string; folderPath?: string; title: string } | null>(null);

  const fetchFiles = async () => {
    try {
      const res = await fetch(`/api/media/files?folder=${encodeURIComponent(currentFolder)}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.files || []);
        setFolders(data.folders || []);
      }
    } catch (err) {
      console.error("Failed to fetch files:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [currentFolder]);

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    try {
      const res = await fetch("/api/admin/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          folderName: newFolderName.trim(),
          parentPath: currentFolder,
        }),
      });

      if (res.ok) {
        setNewFolderName("");
        setShowCreateFolder(false);
        await fetchFiles();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to create folder");
      }
    } catch (err) {
      console.error("Folder creation error:", err);
    }
  };

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !renameEn.trim()) return;

    try {
      const res = await fetch("/api/admin/files", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingItem.id,
          title_en: renameEn.trim(),
          title_te: renameTe.trim() || renameEn.trim(),
        }),
      });

      if (res.ok) {
        setEditingItem(null);
        await fetchFiles();
      }
    } catch (err) {
      console.error("Rename error:", err);
    }
  };

  const handleMove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!movingItem) return;

    try {
      const res = await fetch("/api/admin/files", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: movingItem.id,
          targetFolderPath: targetMoveFolder,
        }),
      });

      if (res.ok) {
        setMovingItem(null);
        await fetchFiles();
      }
    } catch (err) {
      console.error("Move error:", err);
    }
  };

  const confirmDelete = async () => {
    if (!deletingItem) return;

    try {
      const url = deletingItem.id
        ? `/api/admin/files?id=${encodeURIComponent(deletingItem.id)}`
        : `/api/admin/files?folderPath=${encodeURIComponent(deletingItem.folderPath!)}`;

      const res = await fetch(url, { method: "DELETE" });
      if (res.ok) {
        setDeletingItem(null);
        await fetchFiles();
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const navigateUp = () => {
    if (currentFolder === "/") return;
    const parts = currentFolder.split("/").filter(Boolean);
    parts.pop();
    setCurrentFolder(parts.length === 0 ? "/" : `/${parts.join("/")}/`);
  };

  const folderDepth = currentFolder.split("/").filter(Boolean).length;

  return (
    <PageShell
      titleEn="File Management"
      titleTe="ఫైళ్ల నిర్వహణ"
      backHref="/admin/library"
    >
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Navigation & Action Bar */}
        <div className="bg-zinc-900 border-4 border-zinc-700 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 w-full md:w-auto">
            {currentFolder !== "/" && (
              <BigButton variant="secondary" size="small" onClick={navigateUp}>
                <ArrowLeft className="w-6 h-6 mr-2" />
                <Bi en="Up" te="పైకి" />
              </BigButton>
            )}
            <div className="text-2xl font-bold text-yellow-400 truncate">
              📁 {currentFolder}
            </div>
          </div>

          <div className="flex gap-4 w-full md:w-auto justify-end">
            {folderDepth < 3 && (
              <BigButton
                variant="primary"
                size="small"
                onClick={() => setShowCreateFolder(true)}
              >
                <FolderPlus className="w-6 h-6 mr-2" />
                <Bi en="New Folder" te="కొత్త ఫోల్డర్" />
              </BigButton>
            )}
          </div>
        </div>

        {/* Create Folder Modal */}
        {showCreateFolder && (
          <div className="bg-zinc-900 border-4 border-yellow-500 rounded-3xl p-6 md:p-8">
            <h3 className="text-2xl font-bold text-white mb-4">
              <Bi en="Create New Folder (Max 3 levels)" te="కొత్త ఫోల్డర్ సృష్టించండి" />
            </h3>
            <form onSubmit={handleCreateFolder} className="space-y-4">
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Folder name (e.g. Legal Documents)"
                className="w-full bg-zinc-800 border-4 border-zinc-600 rounded-2xl px-5 py-4 text-2xl text-white focus:border-yellow-400 focus:outline-none"
                autoFocus
                required
              />
              <div className="flex gap-4">
                <BigButton type="submit" variant="primary" size="small">
                  <Bi en="Create" te="సృష్టించు" />
                </BigButton>
                <BigButton
                  type="button"
                  variant="secondary"
                  size="small"
                  onClick={() => setShowCreateFolder(false)}
                >
                  <Bi en="Cancel" te="రద్దు" />
                </BigButton>
              </div>
            </form>
          </div>
        )}

        {/* Rename Modal */}
        {editingItem && (
          <div className="bg-zinc-900 border-4 border-yellow-500 rounded-3xl p-6 md:p-8">
            <h3 className="text-2xl font-bold text-white mb-4">
              <Bi en="Rename File" te="ఫైల్ పేరు మార్చండి" />
            </h3>
            <form onSubmit={handleRename} className="space-y-4">
              <input
                type="text"
                value={renameEn}
                onChange={(e) => setRenameEn(e.target.value)}
                placeholder="English Title"
                className="w-full bg-zinc-800 border-4 border-zinc-600 rounded-2xl px-5 py-4 text-2xl text-white focus:border-yellow-400 focus:outline-none"
                required
              />
              <input
                type="text"
                value={renameTe}
                onChange={(e) => setRenameTe(e.target.value)}
                placeholder="Telugu Title (తెలుగు పేరు)"
                className="w-full bg-zinc-800 border-4 border-zinc-600 rounded-2xl px-5 py-4 text-2xl text-white focus:border-yellow-400 focus:outline-none"
              />
              <div className="flex gap-4">
                <BigButton type="submit" variant="primary" size="small">
                  <Bi en="Save" te="భద్రపరచు" />
                </BigButton>
                <BigButton
                  type="button"
                  variant="secondary"
                  size="small"
                  onClick={() => setEditingItem(null)}
                >
                  <Bi en="Cancel" te="రద్దు" />
                </BigButton>
              </div>
            </form>
          </div>
        )}

        {/* Move Modal */}
        {movingItem && (
          <div className="bg-zinc-900 border-4 border-yellow-500 rounded-3xl p-6 md:p-8">
            <h3 className="text-2xl font-bold text-white mb-4">
              <Bi en={`Move "${movingItem.title_en}" to Folder`} te="మరొక ఫోల్డర్‌కు మార్చండి" />
            </h3>
            <form onSubmit={handleMove} className="space-y-4">
              <input
                type="text"
                value={targetMoveFolder}
                onChange={(e) => setTargetMoveFolder(e.target.value)}
                placeholder="Target folder path (e.g. /Documents/)"
                className="w-full bg-zinc-800 border-4 border-zinc-600 rounded-2xl px-5 py-4 text-2xl text-white focus:border-yellow-400 focus:outline-none"
                required
              />
              <div className="flex gap-4">
                <BigButton type="submit" variant="primary" size="small">
                  <Bi en="Move" te="తరలించు" />
                </BigButton>
                <BigButton
                  type="button"
                  variant="secondary"
                  size="small"
                  onClick={() => setMovingItem(null)}
                >
                  <Bi en="Cancel" te="రద్దు" />
                </BigButton>
              </div>
            </form>
          </div>
        )}

        {/* Big Reassurance Delete Modal */}
        {deletingItem && (
          <div className="bg-red-950/90 border-4 border-red-500 rounded-3xl p-6 md:p-8">
            <div className="flex items-center gap-4 text-red-300 mb-4">
              <AlertTriangle className="w-10 h-10 text-red-400" />
              <h3 className="text-3xl font-bold text-white">
                <Bi en="Confirm Deletion" te="తొలగింపును నిర్ధారించండి" />
              </h3>
            </div>
            <p className="text-2xl text-zinc-200 mb-6">
              <Bi
                en={`Are you sure you want to delete "${deletingItem.title}"?`}
                te={`మీరు నిజంగా "${deletingItem.title}"ని తొలగించాలనుకుంటున్నారా?`}
              />
            </p>
            <div className="flex gap-4">
              <BigButton variant="danger" size="large" onClick={confirmDelete}>
                <Trash2 className="w-6 h-6 mr-2" />
                <Bi en="Yes, Delete" te="అవును, తొలగించు" />
              </BigButton>
              <BigButton
                variant="secondary"
                size="large"
                onClick={() => setDeletingItem(null)}
              >
                <Bi en="No, Keep It" te="వద్దు, ఉంచండి" />
              </BigButton>
            </div>
          </div>
        )}

        {/* Directory Listing */}
        <div className="space-y-4">
          {/* Subfolders */}
          {folders.map((fName) => (
            <div
              key={fName}
              className="bg-zinc-900 border-4 border-zinc-700 hover:border-yellow-400 rounded-3xl p-5 flex items-center justify-between"
            >
              <button
                onClick={() => setCurrentFolder(`${currentFolder}${fName}/`)}
                className="flex items-center gap-4 text-left flex-1"
              >
                <Folder className="w-10 h-10 text-yellow-400 flex-shrink-0" />
                <span className="text-2xl font-bold text-white">{fName}</span>
              </button>
              <BigButton
                variant="danger"
                size="small"
                onClick={() =>
                  setDeletingItem({
                    folderPath: `${currentFolder}${fName}/`,
                    title: `Folder: ${fName}`,
                  })
                }
              >
                <Trash2 className="w-5 h-5" />
              </BigButton>
            </div>
          ))}

          {/* Files */}
          {items.map((file) => (
            <div
              key={file.id}
              className="bg-zinc-900 border-4 border-zinc-700 rounded-3xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                <FileText className="w-10 h-10 text-blue-400 flex-shrink-0" />
                <div>
                  <h4 className="text-2xl font-bold text-white">{file.title_en}</h4>
                  <p className="text-xl text-zinc-400">{file.title_te}</p>
                </div>
              </div>

              <div className="flex gap-3 w-full md:w-auto justify-end">
                <BigButton
                  variant="secondary"
                  size="small"
                  onClick={() => {
                    setEditingItem(file);
                    setRenameEn(file.title_en);
                    setRenameTe(file.title_te);
                  }}
                >
                  <Edit className="w-5 h-5 mr-1" />
                  <Bi en="Rename" te="పేరు మార్చు" />
                </BigButton>

                <BigButton
                  variant="secondary"
                  size="small"
                  onClick={() => {
                    setMovingItem(file);
                    setTargetMoveFolder(currentFolder);
                  }}
                >
                  <Move className="w-5 h-5 mr-1" />
                  <Bi en="Move" te="తరలించు" />
                </BigButton>

                <BigButton
                  variant="danger"
                  size="small"
                  onClick={() =>
                    setDeletingItem({
                      id: file.id,
                      title: file.title_en,
                    })
                  }
                >
                  <Trash2 className="w-5 h-5 mr-1" />
                  <Bi en="Delete" te="తొలగించు" />
                </BigButton>
              </div>
            </div>
          ))}

          {folders.length === 0 && items.length === 0 && !isLoading && (
            <div className="text-center py-16 text-zinc-500 text-2xl font-bold">
              <Bi en="This folder is empty" te="ఈ ఫోల్డర్ ఖాళీగా ఉంది" />
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
