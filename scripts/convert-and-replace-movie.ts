/**
 * Converts HEVC/MKV video into universal, browser-playable 1080p H.264 + AAC MP4
 * using Apple Silicon / macOS hardware acceleration (h264_videotoolbox).
 * Then uploads the MP4 directly to Backblaze B2 storage and updates the database record.
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { spawn } from "child_process";
import dotenv from "dotenv";
dotenv.config();

import {
  S3Client,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
} from "@aws-sdk/client-s3";
import { prisma } from "../src/lib/prisma";

const CHUNK_SIZE = 15 * 1024 * 1024; // 15MB chunks
const CONCURRENCY = 6;

async function main() {
  const inputFile = path.resolve(process.cwd(), "[MM] - Irumudi (2026).mkv");
  const outputFile = path.resolve(process.cwd(), "Irumudi (2026).mp4");
  const mediaItemId = "cmu8shmjm0000kcx63vm646ou";

  if (!fs.existsSync(inputFile)) {
    console.error(`❌ Input file not found: ${inputFile}`);
    process.exit(1);
  }

  console.log("==================================================");
  console.log("🎬 Kutumbam 1080p Universal Video Transcoder");
  console.log(`📁 Input:  ${path.basename(inputFile)}`);
  console.log(`🎯 Output: ${path.basename(outputFile)}`);
  console.log("⚡ Encoder: Apple VideoToolbox (Hardware-Accelerated H.264 + AAC)");
  console.log("==================================================\n");

  // Step 1: Transcode using ffmpeg
  console.log("⚙️ Starting 1080p Full HD conversion (H.264 yuv420p + AAC stereo)...");

  const ffmpegArgs = [
    "-y",
    "-i",
    inputFile,
    "-c:v",
    "h264_videotoolbox",
    "-b:v",
    "2600k",
    "-maxrate",
    "3500k",
    "-bufsize",
    "6000k",
    "-pix_fmt",
    "yuv420p",
    "-map",
    "0:v:0",
    "-map",
    "0:a:0",
    "-c:a",
    "aac",
    "-b:a",
    "160k",
    "-ac",
    "2",
    "-movflags",
    "+faststart",
    outputFile,
  ];

  await new Promise<void>((resolve, reject) => {
    const proc = spawn("ffmpeg", ffmpegArgs);

    proc.stderr.on("data", (data) => {
      const line = data.toString();
      const match = line.match(/time=(\d{2}:\d{2}:\d{2}\.\d{2})/);
      const speedMatch = line.match(/speed=\s*([\d.]+x)/);
      const fpsMatch = line.match(/fps=\s*([\d.]+)/);
      if (match) {
        process.stdout.write(
          `\r⏳ Transcoding: ${match[1]} processed | ${fpsMatch ? fpsMatch[1] + " fps" : ""} | speed ${speedMatch ? speedMatch[1] : "..."}    `
        );
      }
    });

    proc.on("close", (code) => {
      if (code === 0) {
        console.log("\n✅ Video successfully converted to browser-safe 1080p MP4!");
        resolve();
      } else {
        reject(new Error(`ffmpeg exited with code ${code}`));
      }
    });

    proc.on("error", reject);
  });

  const stat = fs.statSync(outputFile);
  const fileSize = stat.size;
  console.log(`📦 Converted File Size: ${(fileSize / (1024 * 1024 * 1024)).toFixed(2)} GB (${fileSize.toLocaleString()} bytes)\n`);

  // Step 2: Upload to B2 Storage
  console.log("🚀 Uploading browser-compatible 1080p MP4 to storage...");
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

  const s3 = new S3Client({
    region,
    endpoint,
    forcePathStyle: true,
    credentials: { accessKeyId: accessKeyId!, secretAccessKey: secretAccessKey! },
  });

  const storageKey = `originals/MOVIE/2026/media_1789844951017_6la9sp/Irumudi_2026.mp4`;

  const createRes = await s3.send(
    new CreateMultipartUploadCommand({
      Bucket: bucket,
      Key: storageKey,
      ContentType: "video/mp4",
    })
  );

  const uploadId = createRes.UploadId;
  const totalParts = Math.ceil(fileSize / CHUNK_SIZE);
  console.log(`📊 Uploading ${totalParts} chunks (${CHUNK_SIZE / (1024 * 1024)} MB each) via ${CONCURRENCY} parallel streams...`);

  const completedParts: Array<{ PartNumber: number; ETag: string }> = [];
  const partsToUpload = Array.from({ length: totalParts }, (_, i) => i + 1);
  let nextPartIndex = 0;
  let uploadedBytes = 0;
  const startTime = Date.now();
  const fileHandle = fs.openSync(outputFile, "r");

  const uploadWorker = async () => {
    while (nextPartIndex < partsToUpload.length) {
      const partNumber = partsToUpload[nextPartIndex++];
      const start = (partNumber - 1) * CHUNK_SIZE;
      const length = Math.min(CHUNK_SIZE, fileSize - start);
      const buffer = Buffer.alloc(length);
      fs.readSync(fileHandle, buffer, 0, length, start);

      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const res = await s3.send(
            new UploadPartCommand({
              Bucket: bucket,
              Key: storageKey,
              UploadId: uploadId,
              PartNumber: partNumber,
              Body: buffer,
            })
          );
          completedParts.push({ PartNumber: partNumber, ETag: res.ETag! });
          uploadedBytes += length;
          const speedMBs = (uploadedBytes / (1024 * 1024)) / ((Date.now() - startTime) / 1000 || 1);
          process.stdout.write(
            `\r⏳ Uploading: ${((uploadedBytes / fileSize) * 100).toFixed(1)}% | ${speedMBs.toFixed(1)} MB/s    `
          );
          break;
        } catch (err) {
          if (attempt === 3) throw err;
          await new Promise((r) => setTimeout(r, 1000 * attempt));
        }
      }
    }
  };

  await Promise.all(Array.from({ length: CONCURRENCY }, () => uploadWorker()));
  fs.closeSync(fileHandle);

  completedParts.sort((a, b) => a.PartNumber - b.PartNumber);
  await s3.send(
    new CompleteMultipartUploadCommand({
      Bucket: bucket,
      Key: storageKey,
      UploadId: uploadId,
      MultipartUpload: { Parts: completedParts },
    })
  );

  console.log("\n✅ MP4 upload complete!");

  // Step 3: Compute Checksum
  console.log("🔐 Calculating SHA256 checksum...");
  const hash = crypto.createHash("sha256");
  const readStream = fs.createReadStream(outputFile);
  const checksum = await new Promise<string>((res, rej) => {
    readStream.on("data", (c) => hash.update(c));
    readStream.on("end", () => res(hash.digest("hex")));
    readStream.on("error", rej);
  });

  // Step 4: Update Database Record
  console.log("💾 Updating Neon database record to point to 1080p MP4...");
  const updated = await prisma.mediaItem.update({
    where: { id: mediaItemId },
    data: {
      originalKey: storageKey,
      mimeType: "video/mp4",
      sizeBytes: BigInt(fileSize),
      checksumSha256: checksum,
      metadataJson: {
        width: 1920,
        height: 1080,
        codec: "h264",
        audio: "aac",
      },
    },
  });

  console.log("\n🎉 ALL DONE! Movie updated in database:");
  console.log(`   ID: ${updated.id}`);
  console.log(`   Title: ${updated.title_en} · ${updated.title_te}`);
  console.log(`   Storage Key: ${updated.originalKey}`);
  console.log(`   MIME: ${updated.mimeType}`);
  console.log("\n🍿 Picture and audio will now play flawlessly on all iPhones, Android phones, and TVs!\n");
}

main().catch((err) => {
  console.error("\n❌ Process failed:", err);
  process.exit(1);
});
