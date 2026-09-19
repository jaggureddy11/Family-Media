"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { FolderPlus, Image as ImageIcon, Check, Trash2, Edit2, ArrowUpDown, Plus, X } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { Bi } from "@/components/Bi";
import { BigButton } from "@/components/BigButton";

interface AlbumItem {
  id: string;
  title_en: string;
  title_te: string;
  year: number | null;
  coverKey: string | null;
  _count?: { items: number };
  items?: { id: string; mediaItemId: string; sortOrder: number; mediaItem: any }[];
}

interface MediaItemOption {
  id: string;
  title_en: string;
  title_te: string;
  type: string;
  thumbnailKey?: string;
  storageKey: string;
}

export default function AdminAlbumsPage() {
  const [albums, setAlbums] = useState<AlbumItem[]>([]);
  const [availableMedia, setAvailableMedia] = useState<MediaItemOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form states
  const [editingAlbum, setEditingAlbum] = useState<AlbumItem | null>(null);
  const [titleEn, setTitleEn] = useState("");
  const [titleTe, setTitleTe] = useState("");
  const [year, setYear] = useState("");
  const [coverKey, setCoverKey] = useState("");
  const [selectedMediaIds, setSelectedMediaIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  const fetchAlbums = async () => {
    try {
      const res = await fetch("/api/admin/albums");
      if (res.ok) {
        const data = await res.json();
        setAlbums(data.albums || []);
      }
    } catch (err) {
      console.error("Failed to load albums:", err);
    }
  };

  const fetchMedia = async () => {
    try {
      const res = await fetch("/api/media/photos?tab=timeline");
      if (res.ok) {
        const data = await res.json();
        setAvailableMedia(data.photos || []);
      }
    } catch (err) {
      console.error("Failed to load media items:", err);
    }
  };

  useEffect(() => {
    Promise.all([fetchAlbums(), fetchMedia()]).then(() => setIsLoading(false));
  }, []);

  const resetForm = () => {
    setEditingAlbum(null);
    setTitleEn("");
    setTitleTe("");
    setYear("");
    setCoverKey("");
    setSelectedMediaIds([]);
    setShowPicker(false);
  };

  const handleStartEdit = (album: AlbumItem) => {
    setEditingAlbum(album);
    setTitleEn(album.title_en);
    setTitleTe(album.title_te);
    setYear(album.year ? String(album.year) : "");
    setCoverKey(album.coverKey || "");
    const itemIds = album.items?.map((i) => i.mediaItemId) || [];
    setSelectedMediaIds(itemIds);
  };

  const handleSaveAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleEn.trim() || !titleTe.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (editingAlbum) {
        // Update
        const initialIds = editingAlbum.items?.map((i) => i.mediaItemId) || [];
        const addMediaItemIds = selectedMediaIds.filter((id) => !initialIds.includes(id));
        const removeMediaItemIds = initialIds.filter((id) => !selectedMediaIds.includes(id));

        const res = await fetch("/api/admin/albums", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            albumId: editingAlbum.id,
            title_en: titleEn.trim(),
            title_te: titleTe.trim(),
            coverKey: coverKey || null,
            addMediaItemIds,
            removeMediaItemIds,
          }),
        });
        if (res.ok) {
          resetForm();
          await fetchAlbums();
        }
      } else {
        // Create
        const res = await fetch("/api/admin/albums", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title_en: titleEn.trim(),
            title_te: titleTe.trim(),
            year: year ? parseInt(year, 10) : null,
            coverKey: coverKey || null,
            mediaItemIds: selectedMediaIds,
          }),
        });
        if (res.ok) {
          resetForm();
          await fetchAlbums();
        }
      }
    } catch (err) {
      console.error("Failed to save album:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAlbum = async (id: string) => {
    if (!confirm("Are you sure you want to delete this album? (Media items will not be deleted)")) return;
    try {
      const res = await fetch(`/api/admin/albums?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchAlbums();
      }
    } catch (err) {
      console.error("Failed to delete album:", err);
    }
  };

  const toggleMediaSelection = (id: string) => {
    setSelectedMediaIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <PageShell
      titleEn="Albums Management"
      titleTe="ఆల్బమ్‌ల నిర్వహణ"
      backHref="/admin/library"
    >
      <div className="max-w-5xl mx-auto space-y-12">
        {/* Create / Edit Album Form */}
        <section className="bg-zinc-900 border-4 border-zinc-700 rounded-3xl p-6 md:p-8">
          <h2 className="text-3xl font-bold text-yellow-400 mb-6 flex items-center gap-3">
            <FolderPlus className="w-9 h-9" />
            <Bi
              en={editingAlbum ? "Edit Album" : "Create New Album"}
              te={editingAlbum ? "ఆల్బమ్ మార్చండి" : "కొత్త ఆల్బమ్ సృష్టించండి"}
            />
          </h2>

          <form onSubmit={handleSaveAlbum} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xl text-zinc-300 font-bold mb-2">
                  <Bi en="Album Name (English)" te="ఆల్బమ్ పేరు (ఇంగ్లీష్)" />
                </label>
                <input
                  type="text"
                  value={titleEn}
                  onChange={(e) => setTitleEn(e.target.value)}
                  placeholder="e.g. Tirupati Trip 2023"
                  className="w-full bg-zinc-800 border-4 border-zinc-600 rounded-2xl px-5 py-4 text-2xl text-white focus:border-yellow-400 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xl text-zinc-300 font-bold mb-2">
                  <Bi en="Album Name (Telugu)" te="ఆల్బమ్ పేరు (తెలుగు)" />
                </label>
                <input
                  type="text"
                  value={titleTe}
                  onChange={(e) => setTitleTe(e.target.value)}
                  placeholder="ఉదా: తిరుపతి యాత్ర 2023"
                  className="w-full bg-zinc-800 border-4 border-zinc-600 rounded-2xl px-5 py-4 text-2xl text-white focus:border-yellow-400 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xl text-zinc-300 font-bold mb-2">
                  <Bi en="Year (Optional Date)" te="సంవత్సరం (తేదీ)" />
                </label>
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder="e.g. 2023"
                  className="w-full bg-zinc-800 border-4 border-zinc-600 rounded-2xl px-5 py-4 text-2xl text-white focus:border-yellow-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xl text-zinc-300 font-bold mb-2">
                  <Bi en="Cover Photo Storage Key" te="ముఖచిత్రం కీ" />
                </label>
                <input
                  type="text"
                  value={coverKey}
                  onChange={(e) => setCoverKey(e.target.value)}
                  placeholder="e.g. photos/2023/trip_cover.jpg"
                  className="w-full bg-zinc-800 border-4 border-zinc-600 rounded-2xl px-5 py-4 text-2xl text-white focus:border-yellow-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Media Items Multi-Select Picker */}
            <div className="border-t-2 border-zinc-800 pt-6">
              <div className="flex justify-between items-center mb-4">
                <span className="text-2xl font-bold text-zinc-200">
                  <Bi en={`Selected Photos: ${selectedMediaIds.length}`} te={`ఎంచుకున్న ఫోటోలు: ${selectedMediaIds.length}`} />
                </span>
                <BigButton
                  type="button"
                  variant="secondary"
                  size="small"
                  onClick={() => setShowPicker(!showPicker)}
                >
                  <Bi en={showPicker ? "Close Picker" : "Select Photos"} te={showPicker ? "మూసివేయి" : "ఫోటోలు ఎంచుకోండి"} />
                </BigButton>
              </div>

              {showPicker && (
                <div className="bg-black/60 border-2 border-zinc-700 rounded-2xl p-4 max-h-96 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {availableMedia.map((item) => {
                    const isSelected = selectedMediaIds.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleMediaSelection(item.id)}
                        className={`p-3 rounded-xl border-4 text-left transition-all ${
                          isSelected
                            ? "border-yellow-400 bg-yellow-950/40 text-yellow-200"
                            : "border-zinc-700 bg-zinc-800/80 text-zinc-300 hover:border-zinc-500"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-bold truncate">{item.type}</span>
                          {isSelected && <Check className="w-5 h-5 text-yellow-400" />}
                        </div>
                        <p className="font-bold text-lg truncate">{item.title_en}</p>
                        <p className="text-sm text-zinc-400 truncate">{item.title_te}</p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex gap-4 pt-4">
              <BigButton type="submit" variant="primary" size="large" disabled={isSubmitting}>
                <Bi
                  en={isSubmitting ? "Saving..." : editingAlbum ? "Update Album" : "Create Album"}
                  te={isSubmitting ? "భద్రపరుస్తోంది..." : editingAlbum ? "ఆల్బమ్ నవీకరించు" : "ఆల్బమ్ సృష్టించు"}
                />
              </BigButton>
              {editingAlbum && (
                <BigButton type="button" variant="secondary" size="large" onClick={resetForm}>
                  <Bi en="Cancel" te="రద్దు చేయండి" />
                </BigButton>
              )}
            </div>
          </form>
        </section>

        {/* Existing Albums List */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-white">
            <Bi en="Existing Custom Albums" te="ఉన్న ఆల్బమ్‌లు" />
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {albums.map((album) => (
              <div
                key={album.id}
                className="bg-zinc-900 border-4 border-zinc-700 rounded-3xl p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg font-bold text-yellow-400">
                      {album.year ? `${album.year}` : "Album"}
                    </span>
                    <span className="bg-zinc-800 text-zinc-300 px-3 py-1 rounded-full text-base font-bold">
                      {album._count?.items ?? album.items?.length ?? 0} items
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-1">{album.title_en}</h3>
                  <p className="text-xl font-medium text-zinc-400">{album.title_te}</p>
                </div>

                <div className="flex gap-3 mt-6 pt-4 border-t border-zinc-800">
                  <BigButton
                    variant="secondary"
                    size="small"
                    className="flex-1"
                    onClick={() => handleStartEdit(album)}
                  >
                    <Edit2 className="w-5 h-5 mr-2" />
                    <Bi en="Edit" te="సవరించు" />
                  </BigButton>
                  <BigButton
                    variant="danger"
                    size="small"
                    className="flex-1"
                    onClick={() => handleDeleteAlbum(album.id)}
                  >
                    <Trash2 className="w-5 h-5 mr-2" />
                    <Bi en="Delete" te="తొలగించు" />
                  </BigButton>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </PageShell>
  );
}
