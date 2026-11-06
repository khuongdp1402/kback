import { put, del } from "@vercel/blob";
import type { StorageProvider, PutObjectInput, PutObjectResult } from "./types";

/**
 * Stores objects in Vercel Blob — required on serverless hosts like Vercel, where the deployed
 * function's filesystem is read-only outside /tmp (public/ can't be written to at runtime, only
 * at build time), unlike LocalDiskStorageProvider which assumes a writable public/ directory.
 */
export class VercelBlobStorageProvider implements StorageProvider {
  readonly name = "vercel_blob";

  async putObject({ key, data, contentType }: PutObjectInput): Promise<PutObjectResult> {
    const blob = await put(key, data, {
      access: "public",
      contentType,
      addRandomSuffix: false,
    });
    return { url: blob.url };
  }

  async deleteObject(key: string): Promise<void> {
    await del(key).catch(() => {
      // Best-effort — ignore if already missing.
    });
  }
}
