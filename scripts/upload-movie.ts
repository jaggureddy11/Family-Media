/**
 * Kutumbam CLI High-Speed Movie Uploader
 *
 * Fast, resilient parallel multipart uploader for movies (4K, 1080p, MKV, MP4) directly into
 * Backblaze B2 / S3 storage and registers the media directly in the Neon PostgreSQL database.
 *
 * Usage:
 *   npx tsx scripts/upload-movie.ts "[MM] - Irumudi (2026).mkv"
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { execSync } from "child_process";
import dotenv from "dotenv";
dotenv.config();

import https from "https";
import { NodeHttpHandler } from "@smithy/node-http-handler";
import {
  S3Client,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { prisma } from "../src/lib/prisma";

const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB chunks
const CONCURRENCY = 2; // 2 parallel streams for maximum stability on B2 S3 API

interface MovieMetadata {
  titleEn: string;
  titleTe: string;
  year: number;
  durationSeconds: number;
  width: number;
  height: number;
}

async function extractVideoDetails(filePath: string): Promise<{
  durationSeconds: number;
  width: number;
  height: number;
  posterBuffer?: Buffer;
}> {
  let durationSeconds = 0;
  let width = 1920;
  let height = 1080;
  let posterBuffer: Buffer | undefined;

  try {
    const probeOutput = execSync(
      `ffprobe -v error -show_entries format=duration -show_entries stream=width,height -of json "${filePath}"`,
      { encoding: "utf8" }
    );
    const parsed = JSON.parse(probeOutput);
    if (parsed.format?.duration) {
      durationSeconds = parseFloat(parsed.format.duration);
    }
    const stream = parsed.streams?.find((s: any) => s.width && s.height);
    if (stream) {
      width = stream.width;
      height = stream.height;
    }
  } catch (err: any) {
    console.log("ℹ️ ffprobe not available or failed to probe metadata, using defaults.");
  }

  // Extract poster frame at 10% or 10 minutes into the movie
  try {
    const seekSec = durationSeconds > 600 ? Math.floor(durationSeconds * 0.1) : 30;
    const tempPoster = path.join("/tmp", `poster_${Date.now()}.jpg`);
    execSync(
      `ffmpeg -y -ss ${seekSec} -i "${filePath}" -frames:v 1 -update 1 -q:v 2 -vf "scale=min(1280\\,iw):-2" "${tempPoster}"`,
      { stdio: "ignore" }
    );
    if (fs.existsSync(tempPoster)) {
      posterBuffer = fs.readFileSync(tempPoster);
      fs.unlinkSync(tempPoster);
    }
  } catch (err: any) {
    console.log("ℹ️ Could not extract poster frame with ffmpeg, skipping poster.");
  }

  return { durationSeconds, width, height, posterBuffer };
}

async function main() {
  const args = process.argv.slice(2);
  let targetFileArg = "";
  let customTitleEn = "";
  let customTitleTe = "";
  let customYear = 0;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--title-en" && args[i + 1]) {
      customTitleEn = args[++i];
    } else if (args[i] === "--title-te" && args[i + 1]) {
      customTitleTe = args[++i];
    } else if (args[i] === "--year" && args[i + 1]) {
      customYear = parseInt(args[++i], 10);
    } else if (!args[i].startsWith("--") && !targetFileArg) {
      targetFileArg = args[i];
    }
  }

  if (!targetFileArg) {
    targetFileArg = "[MM] - Peddi (2026) Telugu HQ HDRip - 720p - HEVC - x265 - (.mkv";
  }

  const filePath = path.isAbsolute(targetFileArg)
    ? targetFileArg
    : path.resolve(process.cwd(), targetFileArg);

  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    process.exit(1);
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const fileName = path.basename(filePath);

  console.log("==================================================");
  console.log("🎬 Kutumbam High-Speed Movie Uploader");
  console.log(`📁 File: ${fileName}`);
  console.log(`📦 Size: ${(fileSize / (1024 * 1024 * 1024)).toFixed(2)} GB (${fileSize.toLocaleString()} bytes)`);
  console.log("==================================================\n");

  // Read storage configuration from runtime environment
  const accessKeyId =
    process.env.STORAGE_ACCESS_KEY_ID ||
    process.env.AWS_ACCESS_KEY_ID ||
    process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey =
    process.env.STORAGE_SECRET_ACCESS_KEY ||
    process.env.AWS_SECRET_ACCESS_KEY ||
    process.env.R2_SECRET_ACCESS_KEY;
  const endpoint =
    process.env.STORAGE_ENDPOINT ||
    process.env.AWS_ENDPOINT_URL_S3 ||
    process.env.R2_ENDPOINT;
  const bucket =
    process.env.STORAGE_BUCKET_NAME ||
    process.env.AWS_BUCKET_NAME ||
    process.env.R2_BUCKET_NAME ||
    "assets";
  const region =
    process.env.STORAGE_REGION ||
    process.env.AWS_REGION ||
    process.env.R2_REGION ||
    "auto";

  if (!accessKeyId || !secretAccessKey || !endpoint) {
    console.error("❌ Missing storage credentials in .env");
    process.exit(1);
  }

  const s3 = new S3Client({
    region,
    endpoint,
    forcePathStyle: true,
    credentials: { accessKeyId, secretAccessKey },
    maxAttempts: 5,
    requestHandler: new NodeHttpHandler({
      requestTimeout: 35000,
      connectionTimeout: 10000,
      httpsAgent: new https.Agent({
        keepAlive: true,
        maxSockets: 20,
        timeout: 35000,
      }),
    }),
  });

  // Extract metadata
  console.log("🔍 Extracting video duration, dimensions, and poster frame...");
  const { durationSeconds, width, height, posterBuffer } = await extractVideoDetails(filePath);
  console.log(`⏱️ Duration: ${Math.floor(durationSeconds / 60)}m ${Math.floor(durationSeconds % 60)}s`);
  console.log(`📐 Resolution: ${width}x${height}`);

  // Infer title & year
  let year = customYear;
  if (!year) {
    const yearMatch = fileName.match(/\b(19\d\d|20\d\d)\b/);
    year = yearMatch ? parseInt(yearMatch[1], 10) : new Date().getFullYear();
  }

  let titleEn = customTitleEn;
  let titleTe = customTitleTe;

  if (!titleEn) {
    if (fileName.toLowerCase().includes("peddi")) {
      titleEn = "Peddi";
      titleTe = titleTe || "పెద్ది";
    } else if (fileName.toLowerCase().includes("irumudi")) {
      titleEn = "Irumudi";
      titleTe = titleTe || "ఇరుముడి";
    } else {
      titleEn = fileName
        .replace(/^\[.*?\]\s*-?\s*/, "")
        .replace(/\(.*?\)/g, "")
        .replace(/Telugu.*$/i, "")
        .trim();
      titleTe = titleTe || titleEn;
    }
  }
  if (!titleTe) {
    titleTe = titleEn;
  }

  // Determine media ID and paths
  const mediaId = `media_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const cleanName = fileName.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_.-]/g, "");
  const storageKey = `originals/MOVIE/${year}/${mediaId}/${cleanName}`;
  const posterKey = posterBuffer ? `posters/${mediaId}.jpg` : undefined;

  console.log(`🏷️ Title: ${titleEn} · ${titleTe} (${year})`);

  // Upload Poster if extracted
  if (posterBuffer && posterKey) {
    console.log("🖼️ Uploading poster image...");
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: posterKey,
        Body: posterBuffer,
        ContentType: "image/jpeg",
      })
    );
    console.log("✅ Poster uploaded successfully.");
  }

  // Calculate Checksum & Multipart Upload
  console.log("\n🚀 Initializing high-speed parallel multipart upload to storage...");
  const createRes = await s3.send(
    new CreateMultipartUploadCommand({
      Bucket: bucket,
      Key: storageKey,
      ContentType: "video/x-matroska",
    })
  );

  const uploadId = createRes.UploadId;
  if (!uploadId) {
    throw new Error("Failed to initialize multipart upload: missing UploadId");
  }

  const totalParts = Math.ceil(fileSize / CHUNK_SIZE);
  console.log(`📊 Split into ${totalParts} chunks of ${(CHUNK_SIZE / (1024 * 1024)).toFixed(0)} MB each (${CONCURRENCY} parallel streams)...\n`);

  const pendingParts: number[] = [];
  for (let i = 1; i <= totalParts; i++) {
    pendingParts.push(i);
  }

  const completedParts: Array<{ PartNumber: number; ETag: string }> = [];
  let totalUploadedBytes = 0;
  const startTime = Date.now();
  const hash = crypto.createHash("sha256");

  // Worker for concurrent chunk upload
  const fileHandle = fs.openSync(filePath, "r");

  const worker = async (workerId: number) => {
    while (pendingParts.length > 0) {
      const partNumber = pendingParts.shift();
      if (!partNumber) break;

      const start = (partNumber - 1) * CHUNK_SIZE;
      const length = Math.min(CHUNK_SIZE, fileSize - start);
      const buffer = Buffer.alloc(length);

      fs.readSync(fileHandle, buffer, 0, length, start);

      let success = false;
      let lastErr: any = null;

      for (let attempt = 1; attempt <= 6; attempt++) {
        try {
          const uploadPartRes = await s3.send(
            new UploadPartCommand({
              Bucket: bucket,
              Key: storageKey,
              UploadId: uploadId,
              PartNumber: partNumber,
              Body: buffer,
            })
          );

          completedParts.push({
            PartNumber: partNumber,
            ETag: uploadPartRes.ETag!,
          });

          totalUploadedBytes += length;
          const elapsedSec = (Date.now() - startTime) / 1000;
          const speedMBs = (totalUploadedBytes / (1024 * 1024)) / (elapsedSec || 1);
          const percent = ((totalUploadedBytes / fileSize) * 100).toFixed(1);
          const remainingBytes = fileSize - totalUploadedBytes;
          const etaSec = speedMBs > 0 ? Math.round(remainingBytes / (speedMBs * 1024 * 1024)) : 0;

          console.log(
            `⏳ [${percent}%] Part ${completedParts.length}/${totalParts} (${(totalUploadedBytes / (1024 * 1024)).toFixed(0)}/${(fileSize / (1024 * 1024)).toFixed(0)} MB) - ${speedMBs.toFixed(1)} MB/s - ETA: ${etaSec}s`
          );

          success = true;
          break;
        } catch (err: any) {
          lastErr = err;
          const delayMs = Math.min(1000 * Math.pow(2, attempt) + Math.floor(Math.random() * 800), 20000);
          console.warn(`\n⚠️ Part ${partNumber} attempt ${attempt}/6 failed (${err.message}). Retrying in ${(delayMs / 1000).toFixed(1)}s...`);
          await new Promise((r) => setTimeout(r, delayMs));
        }
      }

      if (!success) {
        fs.closeSync(fileHandle);
        try {
          await s3.send(new AbortMultipartUploadCommand({ Bucket: bucket, Key: storageKey, UploadId: uploadId }));
        } catch (_) {}
        throw new Error(`Failed to upload part ${partNumber} after 6 attempts: ${lastErr?.message}`);
      }
    }
  };

  const workers = Array.from({ length: CONCURRENCY }, (_, i) => worker(i + 1));
  await Promise.all(workers);
  fs.closeSync(fileHandle);

  console.log("\n\n🏁 Finalizing multipart upload on storage...");
  // Sort completed parts in ascending order as required by S3 specification
  completedParts.sort((a, b) => a.PartNumber - b.PartNumber);

  await s3.send(
    new CompleteMultipartUploadCommand({
      Bucket: bucket,
      Key: storageKey,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: completedParts,
      },
    })
  );

  console.log("✅ File upload to storage complete!");

  // Compute file SHA256 checksum
  console.log("🔐 Generating file checksum...");
  const fileStream = fs.createReadStream(filePath);
  const checksum = await new Promise<string>((resolve, reject) => {
    fileStream.on("data", (chunk) => hash.update(chunk));
    fileStream.on("end", () => resolve(hash.digest("hex")));
    fileStream.on("error", reject);
  });

  // Record in PostgreSQL Database
  console.log("💾 Registering movie in database...");
  const item = await prisma.mediaItem.create({
    data: {
      type: "MOVIE",
      status: "READY",
      title_en: titleEn,
      title_te: titleTe,
      year: year,
      durationSeconds: durationSeconds,
      sizeBytes: BigInt(fileSize),
      mimeType: "video/x-matroska",
      originalKey: storageKey,
      checksumSha256: checksum,
      posterKey: posterKey,
    },
  });

  console.log("\n🎉 SUCCESS! Movie registered in Kutumbam:");
  console.log(`   ID: ${item.id}`);
  console.log(`   Title: ${item.title_en} · ${item.title_te}`);
  console.log(`   Year: ${item.year}`);
  console.log(`   Storage Key: ${item.originalKey}`);
  console.log(`   Status: ${item.status}`);
  console.log(`\nAmma can now see and watch '${item.title_en} · ${item.title_te}' directly from the Movies page! 🍿\n`);
}

main().catch((err) => {
  console.error("\n❌ Upload failed:", err);
  process.exit(1);
});
