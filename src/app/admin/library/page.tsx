"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { Bi } from "@/components/Bi";
import { BigButton } from "@/components/BigButton";
import {
  Search,
  Filter,
  Film,
  Image as ImageIcon,
  Video,
  FileText,
  Trash2,
  Save,
  AlertCircle,
  CheckCircle2,
  FolderPlus,
  RefreshCw,
  Plus,
  Play,
} from "lucide-react";

interface MediaItem {
  id: string;
  type: "MOVIE" | "PHOTO" | "FAMILY_VIDEO" | "FILE";
  status: "READY" | "PROCESSING" | "FAILED";
  titleEn: string;
  titleTe: string;
  originalName: string;
  year?: number;
  durationSec?: number;
  sizeBytes: string;
  posterUrl?: string;
  thumbUrl?: string;
  createdAt: string;
  failureReason?: string;
  albumItems?: Array<{ album: { id: string; titleEn: string; titleTe: string } }>;
}

export default function AdminLibraryPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ titleEn: string; titleTe: string; year?: number }>({
    titleEn: "",
    titleTe: "",
  });
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter !== "ALL") params.append("type", typeFilter);
      if (statusFilter !== "ALL") params.append("status", statusFilter);
      if (searchQuery.trim()) params.append("q", searchQuery.trim());

      const res = await fetch(`/api/admin/media?${params.toString()}`);
      const data = await res.json();
      setItems(data.items || []);
    } catch (err) {
      console.error("Failed to load library items:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [typeFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchItems();
  };

  const startEdit = (item: MediaItem) => {
    setEditingId(item.id);
    setEditForm({
      titleEn: item.titleEn,
      titleTe: item.titleTe,
      year: item.year,
    });
  };

  const saveEdit = async (id: string) => {
    try {
      const res = await fetch("/api/admin/media", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          titleEn: editForm.titleEn,
          titleTe: editForm.titleTe,
          year: editForm.year,
        }),
      });

      if (res.ok) {
        setEditingId(null);
        setActionMessage("Item updated successfully!");
        setTimeout(() => setActionMessage(null), 3000);
        fetchItems();
      }
    } catch (err) {
      console.error("Failed to save changes:", err);
    }
  };

  const deleteItem = async (id: string) => {
    if (!confirm("Are you sure you want to delete this media item?")) return;

    try {
      const res = await fetch(`/api/admin/media?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setItems((prev) => prev.filter((it) => it.id !== id));
        setActionMessage("Item deleted!");
        setTimeout(() => setActionMessage(null), 3000);
      }
    } catch (err) {
      console.error("Failed to delete item:", err);
    }
  };

  return (
    <PageShell
      titleKey="library"
      adminOnly
      navItems={[
        { key: "uploadMedia", href: "/admin/upload" },
        { key: "activeDevices", href: "/admin/devices" },
        { key: "familyMembers", href: "/admin/family" },
        { key: "installGuide", href: "/admin/install" },
      ]}
    >
      <div className="max-w-6xl mx-auto space-y-8 pb-16">
        {/* Top Controls Bar */}
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
          <form onSubmit={handleSearchSubmit} className="flex-1 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-6 h-6 sm:w-8 sm:h-8 absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search media / శోధించండి..."
                className="w-full min-h-[56px] sm:min-h-[64px] pl-12 sm:pl-16 pr-4 sm:pr-6 text-base sm:text-[var(--text-body)] bg-[var(--bg-surface-elevated)] text-white border-4 border-[var(--border-thick)] rounded-2xl"
              />
            </div>
            <BigButton
              en="Search"
              te="శోధించండి"
              variant="accent"
              type="submit"
              icon={<Search className="w-6 h-6" />}
              className="w-full sm:w-auto"
            />
          </form>

          <BigButton
            k="uploadMedia"
            href="/admin/upload"
            variant="primary"
            icon={<Plus className="w-7 h-7" />}
            className="w-full sm:w-auto"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-2.5 sm:gap-3 items-center">
          {[
            { id: "ALL", en: "All Media", te: "అన్నీ" },
            { id: "MOVIE", en: "Movies", te: "సినిమాలు" },
            { id: "PHOTO", en: "Photos", te: "ఫోటోలు" },
            { id: "FAMILY_VIDEO", en: "Family Videos", te: "కుటుంబ వీడియోలు" },
            { id: "FILE", en: "Files", te: "ఇతర ఫైళ్లు" },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setTypeFilter(f.id)}
              className={`min-h-[46px] sm:min-h-[56px] px-3.5 sm:px-6 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-[var(--text-body)] border-3 sm:border-4 transition-all ${
                typeFilter === f.id
                  ? "bg-[var(--color-primary-yellow)] text-black border-white"
                  : "bg-[var(--bg-surface-elevated)] text-white border-[var(--border-subtle)] hover:border-slate-400"
              }`}
            >
              {f.en} · {f.te}
            </button>
          ))}
        </div>

        {/* Feedback Message */}
        {actionMessage && (
          <div className="p-4 sm:p-5 bg-emerald-950/80 border-4 border-emerald-500 rounded-2xl text-emerald-200 font-bold text-base sm:text-[var(--text-body)]">
            {actionMessage}
          </div>
        )}

        {/* Media Items List / Table */}
        {loading ? (
          <div className="p-12 sm:p-16 text-center text-white text-[var(--text-body)] font-medium">
            Loading media library...
          </div>
        ) : items.length === 0 ? (
          <div className="p-10 sm:p-16 text-center bg-[var(--bg-surface-elevated)] border-4 border-[var(--border-subtle)] rounded-3xl space-y-6">
            <Film className="w-16 h-16 sm:w-20 sm:h-20 text-slate-500 mx-auto" />
            <h3 className="text-[var(--text-heading)] font-bold text-white">
              No media items found
            </h3>
            <BigButton
              k="uploadMedia"
              href="/admin/upload"
              variant="accent"
              className="mx-auto"
            />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-slate-300 font-bold text-base sm:text-[var(--text-body)]">
              Showing {items.length} items
            </div>

            <div className="grid grid-cols-1 gap-4 sm:gap-6">
              {items.map((item) => {
                const isEditing = editingId === item.id;

                return (
                  <div
                    key={item.id}
                    className="bg-[var(--bg-surface-elevated)] border-4 border-[var(--border-thick)] rounded-2xl sm:rounded-3xl p-4 sm:p-8 flex flex-col md:flex-row gap-4 sm:gap-6 items-start md:items-center justify-between"
                  >
                    {/* Media Thumbnail / Poster Preview */}
                    <div className="w-20 h-28 sm:w-28 sm:h-36 bg-slate-900 rounded-xl sm:rounded-2xl overflow-hidden shrink-0 border-2 border-slate-600 flex items-center justify-center">
                      {item.posterUrl || item.thumbUrl ? (
                        <img
                          src={item.posterUrl || item.thumbUrl}
                          alt={item.titleEn}
                          className="w-full h-full object-cover"
                        />
                      ) : item.type === "MOVIE" ? (
                        <Film className="w-10 h-10 sm:w-12 sm:h-12 text-slate-500" />
                      ) : item.type === "PHOTO" ? (
                        <ImageIcon className="w-10 h-10 sm:w-12 sm:h-12 text-slate-500" />
                      ) : item.type === "FAMILY_VIDEO" ? (
                        <Video className="w-10 h-10 sm:w-12 sm:h-12 text-slate-500" />
                      ) : (
                        <FileText className="w-10 h-10 sm:w-12 sm:h-12 text-slate-500" />
                      )}
                    </div>

                    {/* Metadata & Inline Edit */}
                    <div className="flex-1 space-y-2 sm:space-y-3 w-full min-w-0">
                      {isEditing ? (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                          <input
                            type="text"
                            value={editForm.titleEn}
                            onChange={(e) =>
                              setEditForm({ ...editForm, titleEn: e.target.value })
                            }
                            placeholder="English title"
                            className="min-h-[48px] sm:min-h-[56px] px-3 sm:px-4 bg-slate-900 text-white border-2 border-slate-500 rounded-xl text-base sm:text-[var(--text-body)]"
                          />
                          <input
                            type="text"
                            value={editForm.titleTe}
                            onChange={(e) =>
                              setEditForm({ ...editForm, titleTe: e.target.value })
                            }
                            placeholder="తెలుగు శీర్షిక"
                            className="min-h-[48px] sm:min-h-[56px] px-3 sm:px-4 bg-slate-900 text-white border-2 border-slate-500 rounded-xl text-base sm:text-[var(--text-body)] font-sans"
                          />
                          <input
                            type="number"
                            value={editForm.year || ""}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                year: e.target.value ? parseInt(e.target.value, 10) : undefined,
                              })
                            }
                            placeholder="Year"
                            className="min-h-[48px] sm:min-h-[56px] px-3 sm:px-4 bg-slate-900 text-white border-2 border-slate-500 rounded-xl text-base sm:text-[var(--text-body)]"
                          />
                        </div>
                      ) : (
                        <div>
                          <h3 className="text-xl sm:text-[var(--text-heading)] font-bold text-white break-words">
                            {item.titleEn}
                            {item.year && (
                              <span className="text-slate-400 ml-2 sm:ml-3 text-[0.8em]">
                                ({item.year})
                              </span>
                            )}
                          </h3>
                          <div className="text-base sm:text-[var(--text-body)] font-bold text-[var(--color-primary-yellow)] font-sans mt-0.5 sm:mt-1 break-words">
                            {item.titleTe}
                          </div>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-slate-400 text-xs sm:text-[var(--text-caption)] font-medium">
                        <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-slate-800 rounded-lg text-white font-bold border border-slate-600">
                          {item.type}
                        </span>
                        <span className="truncate max-w-[200px] sm:max-w-none">{item.originalName}</span>
                        {item.durationSec && (
                          <span>
                            {Math.floor(item.durationSec / 60)}m {item.durationSec % 60}s
                          </span>
                        )}
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                          Ready
                        </span>
                        {item.failureReason && (
                          <span className="px-2.5 sm:px-3 py-0.5 sm:py-1 bg-red-950/90 border-2 border-red-500 rounded-lg text-red-200 font-bold flex items-center gap-1.5 sm:gap-2">
                            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 shrink-0" />
                            <span>
                              <Bi k="playbackError" />: {item.failureReason}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 shrink-0 self-stretch md:self-center justify-end">
                      {isEditing ? (
                        <>
                          <button
                            type="button"
                            onClick={() => saveEdit(item.id)}
                            className="min-h-[48px] sm:min-h-[56px] px-4 sm:px-5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center gap-2 border-2 border-emerald-400 text-sm sm:text-base"
                          >
                            <Save className="w-5 h-5 sm:w-6 sm:h-6" />
                            <Bi k="save" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="min-h-[48px] sm:min-h-[56px] px-4 sm:px-5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl border border-slate-600 text-sm sm:text-base"
                          >
                            <Bi k="cancel" />
                          </button>
                        </>
                      ) : (
                        <>
                          {(item.type === "MOVIE" || item.type === "FAMILY_VIDEO") && (
                            <Link
                              href={`/watch/${item.id}`}
                              className="min-h-[48px] sm:min-h-[56px] px-4 sm:px-5 bg-[var(--color-primary-yellow)] hover:bg-yellow-400 text-black font-bold rounded-xl flex items-center gap-2 border-2 border-yellow-300 text-sm sm:text-base"
                            >
                              <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />
                              <Bi k="play" />
                            </Link>
                          )}
                          <button
                            type="button"
                            onClick={() => startEdit(item)}
                            className="min-h-[48px] sm:min-h-[56px] px-4 sm:px-5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl border-2 border-slate-500 text-sm sm:text-base"
                          >
                            <Bi k="edit" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteItem(item.id)}
                            className="p-2.5 sm:p-3 text-slate-400 hover:text-red-400 focus:ring-4 focus:ring-red-400 rounded-xl"
                            aria-label="Delete item · ఫైల్‌ను తొలగించండి"
                          >
                            <Trash2 className="w-6 h-6 sm:w-7 sm:h-7" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}
