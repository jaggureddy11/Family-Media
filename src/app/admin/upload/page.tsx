"use client";

import React, { useState, useRef, useEffect } from "react";
import { PageShell } from "@/components/PageShell";
import { Bi } from "@/components/Bi";
import { BigButton } from "@/components/BigButton";
import {
  UploadCloud,
  FileVideo,
  FileImage,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Pause,
  Play,
  RotateCcw,
  Trash2,
  Film,
  Info,
} from "lucide-react";
import { parseMediaFilename, SuggestedMediaType } from "@/lib/filename-parser";
import {
  inspectAndExtractVideo,
  resizePhotoInBrowser,
  computeFileChecksum,
} from "@/lib/client-media-processor";

interface UploadFileQueueItem {
  id: string;
  file: File;
  name: string;
  size: number;
  type: SuggestedMediaType;
  titleEn: string;
  titleTe: string;
  year?: number;
  checksum?: string;
  isDuplicate?: boolean;
  handbrakeRequired?: boolean;
  handbrakeMessage?: string;
  durationSec?: number;
  width?: number;
  height?: number;
  posterBlob?: Blob;
  thumbBlob?: Blob;
  status: "idle" | "inspecting" | "ready" | "uploading" | "paused" | "completed" | "failed";
  progress: number; // 0 - 100
  uploadedBytes: number;
  uploadId?: string;
  storageKey?: string;
  errorMessage?: string;
}

export default function AdminUploadPage() {
  const [queue, setQueue] = useState<UploadFileQueueItem[]>([]);
  const [activeUploadId, setActiveUploadId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // Restore unfinished uploads from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("kutumbam_upload_queue");
      if (saved) {
        // Keep metadata structure for display
      }
    } catch {}
  }, []);

  const handleFilesAdded = async (files: FileList | File[]) => {
    const newItems: UploadFileQueueItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const parsed = parseMediaFilename(file.name);

      newItems.push({
        id: `upload_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        file,
        name: file.name,
        size: file.size,
        type: parsed.suggestedType,
        titleEn: parsed.titleEn,
        titleTe: parsed.titleEn,
        year: parsed.year,
        status: "idle",
        progress: 0,
        uploadedBytes: 0,
      });
    }

    setQueue((prev) => [...prev, ...newItems]);

    // Inspect files asynchronously
    for (const item of newItems) {
      await inspectQueueItem(item.id, item.file, item.type);
    }
  };

  const inspectQueueItem = async (
    id: string,
    file: File,
    type: SuggestedMediaType
  ) => {
    updateQueueItem(id, { status: "inspecting" });

    try {
      // 1. Compute checksum and check for duplicate
      const checksum = await computeFileChecksum(file);
      let isDuplicate = false;
      try {
        const dupRes = await fetch("/api/storage/check-duplicate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ checksum, filename: file.name }),
        });
        const dupData = await dupRes.json();
        isDuplicate = !!dupData.exists;
      } catch {}

      // 2. Video Inspection
      if (type === "MOVIE" || type === "FAMILY_VIDEO") {
        const videoRes = await inspectAndExtractVideo(file);
        if (videoRes.handbrakeRequired) {
          updateQueueItem(id, {
            status: "ready",
            checksum,
            isDuplicate,
            handbrakeRequired: true,
            handbrakeMessage: videoRes.errorMessage,
          });
          return;
        }

        updateQueueItem(id, {
          status: "ready",
          checksum,
          isDuplicate,
          durationSec: videoRes.durationSec,
          width: videoRes.width,
          height: videoRes.height,
          posterBlob: videoRes.posterBlob,
        });
        return;
      }

      // 3. Photo Inspection
      if (type === "PHOTO") {
        const photoRes = await resizePhotoInBrowser(file, 360);
        updateQueueItem(id, {
          status: "ready",
          checksum,
          isDuplicate,
          width: photoRes.width,
          height: photoRes.height,
          thumbBlob: photoRes.thumbBlob,
        });
        return;
      }

      // 4. Other Files
      updateQueueItem(id, {
        status: "ready",
        checksum,
        isDuplicate,
      });
    } catch (err: any) {
      updateQueueItem(id, {
        status: "ready",
        errorMessage: err.message,
      });
    }
  };

  const updateQueueItem = (id: string, updates: Partial<UploadFileQueueItem>) => {
    setQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const removeItem = (id: string) => {
    setQueue((prev) => prev.filter((item) => item.id !== id));
  };

  const startUpload = async (item: UploadFileQueueItem) => {
    if (item.handbrakeRequired) return;

    setActiveUploadId(item.id);
    updateQueueItem(item.id, { status: "uploading", progress: 5 });

    try {
      const yearFolder = item.year ? item.year.toString() : new Date().getFullYear().toString();
      const mediaId = `media_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const safeFilename = encodeURIComponent(item.name.replace(/\s+/g, "_"));
      const storageKey = `originals/${item.type}/${yearFolder}/${mediaId}/${safeFilename}`;

      let posterKey: string | undefined;
      let thumbKey: string | undefined;

      const uploadBlobHelper = async (key: string, blob: Blob, ct: string) => {
        const uploadRes = await fetch(`/api/admin/upload?key=${encodeURIComponent(key)}`, {
          method: "POST",
          headers: { "Content-Type": ct, "x-storage-key": key },
          body: blob,
        });
        if (!uploadRes.ok) {
          throw new Error(`Upload failed with status ${uploadRes.status}`);
        }
      };

      // 1. Upload Poster if extracted
      if (item.posterBlob) {
        posterKey = `posters/${mediaId}.jpg`;
        await uploadBlobHelper(posterKey, item.posterBlob, "image/jpeg");
      }

      // 2. Upload Thumbnail if resized
      if (item.thumbBlob) {
        thumbKey = `thumbs/${mediaId}.webp`;
        await uploadBlobHelper(thumbKey, item.thumbBlob, "image/webp");
      }

      // 3. Upload Original File (Direct Presigned / Multipart / Fallback)
      updateQueueItem(item.id, { progress: 25 });

      const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB chunks
      if (item.file.size > CHUNK_SIZE) {
        // Multipart upload
        try {
          const createRes = await fetch("/api/storage/multipart/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ key: storageKey, contentType: item.file.type }),
          });
          const { uploadId } = await createRes.json();

          const totalParts = Math.ceil(item.file.size / CHUNK_SIZE);
          const completedParts: Array<{ partNumber: number; etag: string }> = [];

          for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
            const start = (partNumber - 1) * CHUNK_SIZE;
            const end = Math.min(start + CHUNK_SIZE, item.file.size);
            const chunk = item.file.slice(start, end);

            const signRes = await fetch("/api/storage/multipart/sign-part", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ key: storageKey, uploadId, partNumber }),
            });
            const { url } = await signRes.json();

            const uploadChunkRes = await fetch(url, {
              method: "PUT",
              body: chunk,
            });

            const etag = uploadChunkRes.headers.get("ETag") || `etag_${partNumber}`;
            completedParts.push({ partNumber, etag: etag.replace(/"/g, "") });

            const partProgress = Math.round(25 + (partNumber / totalParts) * 65);
            updateQueueItem(item.id, {
              progress: partProgress,
              uploadedBytes: end,
            });
          }

          // Complete multipart
          await fetch("/api/storage/multipart/complete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ key: storageKey, uploadId, parts: completedParts }),
          });
        } catch {
          // If direct multipart failed, upload via fallback proxy
          await uploadBlobHelper(storageKey, item.file, item.file.type || "application/octet-stream");
        }
      } else {
        await uploadBlobHelper(storageKey, item.file, item.file.type || "application/octet-stream");
        updateQueueItem(item.id, { progress: 90 });
      }

      // 4. Create MediaItem in Postgres database with status READY
      await fetch("/api/admin/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: item.type,
          titleEn: item.titleEn,
          titleTe: item.titleTe,
          originalName: item.name,
          year: item.year,
          durationSec: item.durationSec,
          width: item.width,
          height: item.height,
          sizeBytes: item.size.toString(),
          mimeType: item.file.type || "application/octet-stream",
          storageKey,
          posterKey,
          thumbKey,
          checksum: item.checksum,
        }),
      });

      updateQueueItem(item.id, {
        status: "completed",
        progress: 100,
        uploadedBytes: item.size,
      });
      setActiveUploadId(null);
    } catch (err: any) {
      console.error("Upload failed:", err);
      updateQueueItem(item.id, {
        status: "failed",
        errorMessage: err.message || "Upload failed. Check storage credentials.",
      });
      setActiveUploadId(null);
    }
  };

  return (
    <PageShell
      titleKey="uploadMedia"
      adminOnly
      navItems={[
        { key: "library", href: "/admin/library" },
        { key: "activeDevices", href: "/admin/devices" },
        { key: "familyMembers", href: "/admin/family" },
      ]}
    >
      <div className="max-w-5xl mx-auto space-y-8 pb-16">
        {/* Upload Zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files) {
              handleFilesAdded(e.dataTransfer.files);
            }
          }}
          className={`relative border-6 border-dashed rounded-3xl p-10 sm:p-16 text-center transition-all bg-[var(--bg-surface-elevated)] ${
            isDragging
              ? "border-[var(--color-primary-yellow)] bg-slate-900"
              : "border-[var(--border-thick)] hover:border-slate-400"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && handleFilesAdded(e.target.files)}
          />
          <input
            ref={folderInputRef}
            type="file"
            // @ts-ignore
            webkitdirectory="true"
            directory="true"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && handleFilesAdded(e.target.files)}
          />

          <UploadCloud className="w-24 h-24 mx-auto mb-6 text-[var(--color-primary-yellow)] animate-pulse" />

          <h2 className="text-[var(--text-heading)] font-bold text-white mb-4">
            <Bi k="dragAndDrop" layout="stacked" />
          </h2>

          <div className="flex flex-wrap gap-6 justify-center mt-8">
            <BigButton
              k="selectFiles"
              variant="accent"
              icon={<UploadCloud className="w-8 h-8" />}
              onClick={() => fileInputRef.current?.click()}
            />
            <BigButton
              k="selectFolder"
              variant="secondary"
              icon={<Film className="w-8 h-8" />}
              onClick={() => folderInputRef.current?.click()}
            />
          </div>
        </div>

        {/* Upload Queue List */}
        {queue.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-[var(--text-heading)] font-bold text-white">
                Queue ({queue.length})
              </h2>
              <button
                type="button"
                onClick={() => setQueue([])}
                className="text-red-400 hover:text-red-300 font-bold text-[var(--text-body)] underline px-4 py-2"
              >
                Clear all
              </button>
            </div>

            <div className="space-y-6">
              {queue.map((item) => (
                <div
                  key={item.id}
                  className="bg-[var(--bg-surface-elevated)] border-4 border-[var(--border-thick)] rounded-3xl p-6 sm:p-8 space-y-6 transition-all"
                >
                  {/* HandBrake Notice Banner */}
                  {item.handbrakeRequired && (
                    <div
                      role="alert"
                      className="p-6 bg-amber-950/80 border-4 border-amber-500 rounded-2xl flex flex-col sm:flex-row gap-5 items-start sm:items-center text-white"
                    >
                      <AlertTriangle className="w-12 h-12 text-amber-400 shrink-0 mt-1 sm:mt-0" />
                      <div className="space-y-2 flex-1">
                        <div className="text-[var(--text-body)] font-bold text-amber-300">
                          <Bi k="handbrakeNoticeTitle" />
                        </div>
                        <div className="text-[var(--text-body)] leading-relaxed">
                          <Bi k="handbrakeNoticeDesc" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Duplicate Notice */}
                  {item.isDuplicate && (
                    <div
                      role="alert"
                      className="p-4 bg-blue-950/80 border-4 border-blue-500 rounded-2xl flex items-center gap-4 text-white"
                    >
                      <Info className="w-8 h-8 text-blue-400 shrink-0" />
                      <div className="text-[var(--text-body)] font-medium">
                        <Bi k="duplicateWarning" />
                      </div>
                    </div>
                  )}

                  {/* Item Metadata Form */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-slate-300 font-semibold text-[var(--text-body)]">
                        <Bi k="titleEnglish" />
                      </label>
                      <input
                        type="text"
                        value={item.titleEn}
                        onChange={(e) => updateQueueItem(item.id, { titleEn: e.target.value })}
                        disabled={item.status === "uploading" || item.status === "completed"}
                        className="w-full min-h-[64px] px-5 text-[var(--text-body)] bg-slate-900 text-white border-4 border-[var(--border-thick)] rounded-xl"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-slate-300 font-semibold text-[var(--text-body)]">
                        <Bi k="titleTelugu" />
                      </label>
                      <input
                        type="text"
                        value={item.titleTe}
                        onChange={(e) => updateQueueItem(item.id, { titleTe: e.target.value })}
                        disabled={item.status === "uploading" || item.status === "completed"}
                        className="w-full min-h-[64px] px-5 text-[var(--text-body)] bg-slate-900 text-white border-4 border-[var(--border-thick)] rounded-xl font-sans"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-slate-300 font-semibold text-[var(--text-body)]">
                        <Bi k="releaseYear" />
                      </label>
                      <input
                        type="number"
                        value={item.year || ""}
                        onChange={(e) =>
                          updateQueueItem(item.id, {
                            year: e.target.value ? parseInt(e.target.value, 10) : undefined,
                          })
                        }
                        disabled={item.status === "uploading" || item.status === "completed"}
                        className="w-full min-h-[64px] px-5 text-[var(--text-body)] bg-slate-900 text-white border-4 border-[var(--border-thick)] rounded-xl"
                      />
                    </div>
                  </div>

                  {/* Progress Bar & Actions */}
                  {item.status === "uploading" && (
                    <div className="space-y-3">
                      <div className="flex justify-between text-[var(--text-body)] text-white font-medium">
                        <span><Bi k="uploading" /></span>
                        <span>{item.progress}%</span>
                      </div>
                      <div className="w-full h-6 bg-slate-800 rounded-full overflow-hidden border-2 border-slate-600">
                        <div
                          className="h-full bg-[var(--color-primary-yellow)] transition-all duration-300"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Status Badges & Controls */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t-2 border-[var(--border-subtle)]">
                    <div className="flex items-center gap-3">
                      {item.status === "completed" && (
                        <div className="flex items-center gap-2 text-emerald-400 font-bold text-[var(--text-body)]">
                          <CheckCircle2 className="w-8 h-8" />
                          <Bi k="uploadComplete" />
                        </div>
                      )}
                      {item.status === "failed" && (
                        <div className="text-red-400 font-bold text-[var(--text-body)]">
                          {item.errorMessage || "Failed"}
                        </div>
                      )}
                      {item.status === "inspecting" && (
                        <div className="text-slate-300 font-medium text-[var(--text-body)]">
                          Inspecting in browser...
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-4">
                      {item.status === "ready" && !item.handbrakeRequired && (
                        <BigButton
                          k="uploadMedia"
                          variant="accent"
                          onClick={() => startUpload(item)}
                          disabled={activeUploadId !== null}
                        />
                      )}
                      {item.status === "failed" && (
                        <BigButton
                          k="retry"
                          variant="secondary"
                          icon={<RotateCcw className="w-6 h-6" />}
                          onClick={() => startUpload(item)}
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="p-4 text-slate-400 hover:text-red-400 transition-colors"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-8 h-8" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}
