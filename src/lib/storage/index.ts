import { StorageProvider } from "./types";
import { S3StorageProvider } from "./s3-provider";
import { MockStorageProvider } from "./mock-provider";

export * from "./types";
export { S3StorageProvider } from "./s3-provider";
export { MockStorageProvider } from "./mock-provider";

let storageInstance: StorageProvider | null = null;

/**
 * Get or initialize the global StorageProvider singleton.
 * If Cloudflare R2 credentials are fully configured in the environment,
 * connects to R2. Otherwise, falls back to MockStorageProvider.
 */
export function getStorageProvider(): StorageProvider {
  if (storageInstance) {
    return storageInstance;
  }

  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME || "kutumbam-private";
  const publicDomain = process.env.R2_PUBLIC_DOMAIN;

  if (accessKeyId && secretAccessKey && (accountId || process.env.R2_ENDPOINT)) {
    storageInstance = new S3StorageProvider({
      accountId,
      accessKeyId,
      secretAccessKey,
      bucketName,
      endpoint: process.env.R2_ENDPOINT,
      publicDomain,
    });
  } else {
    storageInstance = new MockStorageProvider();
  }

  return storageInstance;
}
