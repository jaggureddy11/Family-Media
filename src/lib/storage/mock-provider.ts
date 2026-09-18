import { StorageObject, StoragePart, StorageProvider } from "./types";

interface MockStoredFile {
  key: string;
  data: Buffer;
  contentType: string;
  lastModified: Date;
}

interface MockMultipartSession {
  key: string;
  contentType: string;
  parts: Map<number, { data: Buffer; etag: string }>;
}

/**
 * MockStorageProvider
 *
 * In-memory storage implementation for local test environments and local development
 * without active cloud credentials.
 */
export class MockStorageProvider implements StorageProvider {
  private files = new Map<string, MockStoredFile>();
  private multiparts = new Map<string, MockMultipartSession>();

  async put(
    key: string,
    body: Buffer | Uint8Array | string,
    contentType = "application/octet-stream"
  ): Promise<{ key: string }> {
    const buffer =
      typeof body === "string"
        ? Buffer.from(body)
        : Buffer.isBuffer(body)
        ? body
        : Buffer.from(body);

    this.files.set(key, {
      key,
      data: buffer,
      contentType,
      lastModified: new Date(),
    });

    return { key };
  }

  async getSignedReadUrl(key: string, expiresInSec = 7200): Promise<string> {
    const file = this.files.get(key);
    if (!file) {
      // Return a simulated mock signed URL
      return `http://localhost:3000/api/mock-media?key=${encodeURIComponent(key)}&exp=${Date.now() + expiresInSec * 1000}`;
    }
    // For images, we can return base64 data url directly in mock mode for instant browser rendering
    if (file.contentType.startsWith("image/")) {
      return `data:${file.contentType};base64,${file.data.toString("base64")}`;
    }
    return `http://localhost:3000/api/mock-media?key=${encodeURIComponent(key)}`;
  }

  async getSignedUploadUrl(
    key: string,
    contentType: string,
    _expiresInSec?: number
  ): Promise<string> {
    return `http://localhost:3000/api/storage/mock-upload?key=${encodeURIComponent(key)}&ct=${encodeURIComponent(contentType)}`;
  }

  async createMultipartUpload(
    key: string,
    contentType: string
  ): Promise<{ uploadId: string; key: string }> {
    const uploadId = `mock_upload_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    this.multiparts.set(uploadId, {
      key,
      contentType,
      parts: new Map(),
    });
    return { uploadId, key };
  }

  async signPart(
    key: string,
    uploadId: string,
    partNumber: number,
    _expiresInSec?: number
  ): Promise<string> {
    return `http://localhost:3000/api/storage/mock-upload-part?uploadId=${uploadId}&partNumber=${partNumber}&key=${encodeURIComponent(key)}`;
  }

  async completeMultipart(
    key: string,
    uploadId: string,
    parts: StoragePart[]
  ): Promise<{ key: string; location?: string }> {
    const session = this.multiparts.get(uploadId);
    if (!session) {
      throw new Error(`Mock multipart upload ${uploadId} not found`);
    }

    const sortedParts = [...parts].sort((a, b) => a.partNumber - b.partNumber);
    const totalBuffers: Buffer[] = [];
    for (const p of sortedParts) {
      const partData = session.parts.get(p.partNumber);
      if (partData) {
        totalBuffers.push(partData.data);
      }
    }

    const combined = Buffer.concat(totalBuffers);
    this.files.set(key, {
      key,
      data: combined,
      contentType: session.contentType,
      lastModified: new Date(),
    });

    this.multiparts.delete(uploadId);

    return {
      key,
      location: `mock://${key}`,
    };
  }

  async exists(key: string): Promise<boolean> {
    return this.files.has(key);
  }

  async delete(key: string): Promise<void> {
    this.files.delete(key);
  }

  async list(prefix?: string): Promise<StorageObject[]> {
    const results: StorageObject[] = [];
    for (const [key, file] of this.files.entries()) {
      if (!prefix || key.startsWith(prefix)) {
        results.push({
          key,
          size: file.data.length,
          lastModified: file.lastModified,
        });
      }
    }
    return results;
  }
}
