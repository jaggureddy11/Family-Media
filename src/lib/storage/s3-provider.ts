import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { StorageObject, StoragePart, StorageProvider } from "./types";

export interface S3ProviderConfig {
  accountId?: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  endpoint?: string;
  publicDomain?: string;
}

export class S3StorageProvider implements StorageProvider {
  private client: S3Client;
  private bucket: string;
  private publicDomain?: string;

  constructor(config: S3ProviderConfig) {
    this.bucket = config.bucketName;
    this.publicDomain = config.publicDomain;

    const endpoint =
      config.endpoint ||
      (config.accountId
        ? `https://${config.accountId}.r2.cloudflarestorage.com`
        : undefined);

    this.client = new S3Client({
      region: "auto",
      endpoint,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  async put(
    key: string,
    body: Buffer | Uint8Array | string,
    contentType?: string
  ): Promise<{ key: string }> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: typeof body === "string" ? Buffer.from(body) : body,
        ContentType: contentType || "application/octet-stream",
      })
    );
    return { key };
  }

  async getSignedReadUrl(key: string, expiresInSec = 7200): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    return getSignedUrl(this.client, command, { expiresIn: expiresInSec });
  }

  async getSignedUploadUrl(
    key: string,
    contentType: string,
    expiresInSec = 900
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });
    return getSignedUrl(this.client, command, { expiresIn: expiresInSec });
  }

  async createMultipartUpload(
    key: string,
    contentType: string
  ): Promise<{ uploadId: string; key: string }> {
    const response = await this.client.send(
      new CreateMultipartUploadCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: contentType,
      })
    );

    if (!response.UploadId) {
      throw new Error(`Failed to initialize multipart upload for key: ${key}`);
    }

    return {
      uploadId: response.UploadId,
      key,
    };
  }

  async signPart(
    key: string,
    uploadId: string,
    partNumber: number,
    expiresInSec = 3600
  ): Promise<string> {
    const command = new UploadPartCommand({
      Bucket: this.bucket,
      Key: key,
      UploadId: uploadId,
      PartNumber: partNumber,
    });
    return getSignedUrl(this.client, command, { expiresIn: expiresInSec });
  }

  async completeMultipart(
    key: string,
    uploadId: string,
    parts: StoragePart[]
  ): Promise<{ key: string; location?: string }> {
    const sortedParts = [...parts]
      .sort((a, b) => a.partNumber - b.partNumber)
      .map((p) => ({
        PartNumber: p.partNumber,
        ETag: p.etag,
      }));

    const response = await this.client.send(
      new CompleteMultipartUploadCommand({
        Bucket: this.bucket,
        Key: key,
        UploadId: uploadId,
        MultipartUpload: {
          Parts: sortedParts,
        },
      })
    );

    return {
      key,
      location: response.Location,
    };
  }

  async exists(key: string): Promise<boolean> {
    try {
      await this.client.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: key,
        })
      );
      return true;
    } catch (err: any) {
      if (err.name === "NotFound" || err.$metadata?.httpStatusCode === 404) {
        return false;
      }
      throw err;
    }
  }

  async delete(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      })
    );
  }

  async list(prefix?: string): Promise<StorageObject[]> {
    const response = await this.client.send(
      new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: prefix,
      })
    );

    if (!response.Contents) {
      return [];
    }

    return response.Contents.map((item) => ({
      key: item.Key || "",
      size: item.Size || 0,
      lastModified: item.LastModified || new Date(),
    }));
  }
}
