/**
 * In-Browser Client Media Processor
 *
 * Runs strictly in the admin's browser at upload time:
 * - Tests video browser playability (flags MKV/HEVC for HandBrake conversion).
 * - Extracts video duration, dimensions, and captures poster frame at 10% duration.
 * - Generates 360x360 WebP photo thumbnails.
 * - Computes fast SHA-256 checksums for duplicate detection.
 */

export interface VideoInspectionResult {
  isPlayable: boolean;
  handbrakeRequired: boolean;
  durationSec?: number;
  width?: number;
  height?: number;
  posterBlob?: Blob;
  errorMessage?: string;
}

export interface PhotoInspectionResult {
  width: number;
  height: number;
  thumbBlob: Blob;
}

/**
 * Inspects a video file in the browser using HTML5 <video> and <canvas>.
 */
export async function inspectAndExtractVideo(
  file: File
): Promise<VideoInspectionResult> {
  const extension = file.name.split(".").pop()?.toLowerCase();

  // Known formats requiring HandBrake conversion
  if (extension === "mkv" || extension === "avi" || extension === "flv") {
    return {
      isPlayable: false,
      handbrakeRequired: true,
      errorMessage: "HandBrake conversion required: File is in an unsupported container (MKV/AVI).",
    };
  }

  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;

    const objectUrl = URL.createObjectURL(file);
    video.src = objectUrl;

    let resolved = false;

    const cleanup = () => {
      URL.revokeObjectURL(objectUrl);
      video.remove();
    };

    const failHandbrake = (reason: string) => {
      if (resolved) return;
      resolved = true;
      cleanup();
      resolve({
        isPlayable: false,
        handbrakeRequired: true,
        errorMessage: reason,
      });
    };

    // Timeout in case browser hangs on decoding
    const timer = setTimeout(() => {
      failHandbrake("Browser timed out decoding video stream.");
    }, 12000);

    video.onerror = () => {
      clearTimeout(timer);
      failHandbrake("Browser cannot decode this video codec (likely HEVC/H.265 or AC3).");
    };

    video.onloadedmetadata = () => {
      const durationSec = Math.round(video.duration) || 0;
      const width = video.videoWidth || 1280;
      const height = video.videoHeight || 720;

      // Seek to 10% into the video (or 5 seconds) for a representative poster frame
      const seekTime = Math.min(Math.max(durationSec * 0.1, 5), durationSec > 10 ? durationSec - 2 : 1);
      video.currentTime = seekTime;

      video.onseeked = () => {
        clearTimeout(timer);
        if (resolved) return;
        resolved = true;

        try {
          // Render frame to canvas for poster
          const canvas = document.createElement("canvas");
          canvas.width = 600;
          canvas.height = Math.round((600 * height) / width) || 900;

          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            canvas.toBlob(
              (blob) => {
                cleanup();
                resolve({
                  isPlayable: true,
                  handbrakeRequired: false,
                  durationSec,
                  width,
                  height,
                  posterBlob: blob || undefined,
                });
              },
              "image/jpeg",
              0.85
            );
          } else {
            cleanup();
            resolve({
              isPlayable: true,
              handbrakeRequired: false,
              durationSec,
              width,
              height,
            });
          }
        } catch {
          cleanup();
          resolve({
            isPlayable: true,
            handbrakeRequired: false,
            durationSec,
            width,
            height,
          });
        }
      };
    };
  });
}

/**
 * Resizes a photo in the browser and exports a lightweight WebP/JPEG thumbnail.
 */
export async function resizePhotoInBrowser(
  file: File,
  maxDimension = 360
): Promise<PhotoInspectionResult> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.src = objectUrl;

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const { width, height } = img;

      let targetWidth = width;
      let targetHeight = height;

      if (width > height) {
        if (width > maxDimension) {
          targetHeight = Math.round((height * maxDimension) / width);
          targetWidth = maxDimension;
        }
      } else {
        if (height > maxDimension) {
          targetWidth = Math.round((width * maxDimension) / height);
          targetHeight = maxDimension;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        return reject(new Error("Failed to get 2d context for canvas"));
      }

      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve({
              width,
              height,
              thumbBlob: blob,
            });
          } else {
            reject(new Error("Canvas toBlob failed"));
          }
        },
        "image/webp",
        0.85
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to load image file"));
    };
  });
}

/**
 * Computes a fast SHA-256 checksum for duplicate detection.
 * For huge files (> 20MB), hashes the header, footer, and size for instant calculation.
 */
export async function computeFileChecksum(file: File): Promise<string> {
  const CHUNK_SIZE = 20 * 1024 * 1024; // 20 MB

  if (file.size <= CHUNK_SIZE) {
    const buffer = await file.arrayBuffer();
    const hashBuf = await crypto.subtle.digest("SHA-256", buffer);
    return bufferToHex(hashBuf);
  }

  // Composite hash for large media files (first 10MB + last 10MB + file size)
  const headSlice = file.slice(0, 10 * 1024 * 1024);
  const tailSlice = file.slice(file.size - 10 * 1024 * 1024);

  const headBuf = await headSlice.arrayBuffer();
  const tailBuf = await tailSlice.arrayBuffer();
  const sizeBytes = new TextEncoder().encode(`size:${file.size}`);

  const combined = new Uint8Array(headBuf.byteLength + tailBuf.byteLength + sizeBytes.byteLength);
  combined.set(new Uint8Array(headBuf), 0);
  combined.set(new Uint8Array(tailBuf), headBuf.byteLength);
  combined.set(sizeBytes, headBuf.byteLength + tailBuf.byteLength);

  const hashBuf = await crypto.subtle.digest("SHA-256", combined);
  return bufferToHex(hashBuf);
}

function bufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
