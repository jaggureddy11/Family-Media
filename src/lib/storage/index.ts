import { StorageProvider } from "./types";
import { S3StorageProvider } from "./s3-provider";
import { MockStorageProvider } from "./mock-provider";

export * from "./types";
export { S3StorageProvider } from "./s3-provider";
export { MockStorageProvider } from "./mock-provider";

let storageInstance: StorageProvider | null = null;

/**
 * Reset storage singleton (primarily for testing).
 */
export function resetStorageProvider(): void {
  storageInstance = null;
}

/**
 * Get or initialize the global StorageProvider singleton.
 * If Cloudflare R2 credentials are fully configured in the environment,
 * connects to R2. In development/test, falls back to MockStorageProvider.
 * In production (NODE_ENV=production or VERCEL=1), strictly fails fast if credentials are missing.
 */
export function getStorageProvider(): StorageProvider {
  if (storageInstance) {
    return storageInstance;
  }

  const isProduction = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
  const isBuildPhase =
    process.env.NEXT_PHASE === "phase-production-build" ||
    process.env.npm_lifecycle_event === "build";

  const accessKeyId = process.env.R2_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID || process.env.STORAGE_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY || process.env.STORAGE_SECRET_ACCESS_KEY;
  const endpoint = process.env.R2_ENDPOINT || process.env.AWS_ENDPOINT_URL_S3 || process.env.STORAGE_ENDPOINT;
  const accountId = process.env.R2_ACCOUNT_ID || process.env.STORAGE_ACCOUNT_ID;
  const region = process.env.R2_REGION || process.env.AWS_REGION || process.env.STORAGE_REGION;
  const bucketName = process.env.R2_BUCKET_NAME || process.env.AWS_BUCKET_NAME || process.env.STORAGE_BUCKET_NAME || "assets";

  // Security Check: Warn if any public domain / bucket URL is configured
  if (process.env.R2_PUBLIC_DOMAIN || process.env.STORAGE_PUBLIC_DOMAIN) {
    console.warn(
      "⚠️ SECURITY WARNING: R2_PUBLIC_DOMAIN is configured. Kutumbam is private-by-default; all media must use short-lived signed URLs. Ensure public access is turned OFF on the R2 bucket."
    );
  }

  // Ignore mock localhost endpoint when determining if real credentials are provided
  const hasRealEndpoint = endpoint && !endpoint.includes("localhost:9000");

  const forcePathStyleEnv =
    process.env.STORAGE_FORCE_PATH_STYLE ||
    process.env.R2_FORCE_PATH_STYLE ||
    process.env.AWS_S3_FORCE_PATH_STYLE;
  const forcePathStyle = forcePathStyleEnv !== undefined ? forcePathStyleEnv === "true" || forcePathStyleEnv === "1" : true;

  if (accessKeyId && secretAccessKey && (accountId || hasRealEndpoint)) {
    storageInstance = new S3StorageProvider({
      accountId,
      accessKeyId,
      secretAccessKey,
      bucketName,
      endpoint,
      region,
      forcePathStyle,
    });
  } else if (isProduction && !isBuildPhase) {
    throw new Error(
      "Storage credentials are required in production (R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ACCOUNT_ID, R2_BUCKET_NAME). MockStorageProvider is strictly disabled."
    );
  } else {
    storageInstance = new MockStorageProvider();
  }

  return storageInstance;
}
