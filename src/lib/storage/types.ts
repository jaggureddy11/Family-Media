/**
 * StorageProvider Interface
 *
 * Abstract storage interface allowing seamless switching between Cloudflare R2,
 * AWS S3, MinIO, or an in-memory mock for local testing.
 * UI code must NEVER reference storage vendors directly.
 */

export interface StoragePart {
  partNumber: number;
  etag: string;
}

export interface StorageObject {
  key: string;
  size: number;
  lastModified: Date;
}

export interface StorageProvider {
  /** Upload a small file or buffer directly */
  put(
    key: string,
    body: Buffer | Uint8Array | string,
    contentType?: string
  ): Promise<{ key: string }>;

  /** Generate a short-lived signed URL for reading/streaming (default: 2 hours) */
  getSignedReadUrl(key: string, expiresInSec?: number): Promise<string>;

  /** Generate a short-lived signed URL for single-part direct upload (default: 15 min) */
  getSignedUploadUrl(
    key: string,
    contentType: string,
    expiresInSec?: number
  ): Promise<string>;

  /** Initialize a direct multipart upload for large media files */
  createMultipartUpload(
    key: string,
    contentType: string
  ): Promise<{ uploadId: string; key: string }>;

  /** Sign an individual chunk/part for direct parallel browser upload */
  signPart(
    key: string,
    uploadId: string,
    partNumber: number,
    expiresInSec?: number
  ): Promise<string>;

  /** Complete multipart upload after all parts are transmitted */
  completeMultipart(
    key: string,
    uploadId: string,
    parts: StoragePart[]
  ): Promise<{ key: string; location?: string }>;

  /** Check if an object exists */
  exists(key: string): Promise<boolean>;

  /** Delete a stored object */
  delete(key: string): Promise<void>;

  /** List objects with a given key prefix */
  list(prefix?: string): Promise<StorageObject[]>;
}
