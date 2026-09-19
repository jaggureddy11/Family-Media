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

  const accessKeyId = process.env.STORAGE_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.STORAGE_SECRET_ACCESS_KEY || process.env.R2_SECRET_ACCESS_KEY;
  const endpoint = process.env.STORAGE_ENDPOINT || process.env.R2_ENDPOINT;
  const accountId = process.env.STORAGE_ACCOUNT_ID || process.env.R2_ACCOUNT_ID;
  const bucketName = process.env.STORAGE_BUCKET_NAME || process.env.R2_BUCKET_NAME || "kutumbam-private";
  const publicDomain = process.env.STORAGE_PUBLIC_DOMAIN || process.env.R2_PUBLIC_DOMAIN;

  // Ignore mock localhost endpoint when determining if real credentials are provided
  const hasRealEndpoint = endpoint && !endpoint.includes("localhost:9000");

  if (accessKeyId && secretAccessKey && (accountId || hasRealEndpoint)) {
    storageInstance = new S3StorageProvider({
      accountId,
      accessKeyId,
      secretAccessKey,
      bucketName,
      endpoint,
      publicDomain,
    });
  } else if (isProduction) {
    throw new Error(
      "Cloudflare R2 storage credentials are required in production (STORAGE_ENDPOINT / R2_ENDPOINT, STORAGE_ACCESS_KEY_ID, STORAGE_SECRET_ACCESS_KEY, STORAGE_BUCKET_NAME). MockStorageProvider is strictly disabled."
    );
  } else {
    storageInstance = new MockStorageProvider();
  }

  return storageInstance;
}
