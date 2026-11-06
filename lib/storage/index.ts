import { LocalDiskStorageProvider } from "./local-disk";
import { VercelBlobStorageProvider } from "./vercel-blob";
import type { StorageProvider } from "./types";

export type { StorageProvider, PutObjectInput, PutObjectResult } from "./types";

let cached: StorageProvider | null = null;

/**
 * Resolves the active StorageProvider from environment configuration.
 *
 * "local_disk" writes to public/ on the local filesystem — only works on a long-running server
 * with a writable public/ directory, NOT on serverless hosts like Vercel (function filesystem is
 * read-only outside /tmp at runtime). "vercel_blob" is required there instead, and activates
 * automatically once BLOB_READ_WRITE_TOKEN is present (added automatically when a Blob store is
 * connected to the Vercel project) — STORAGE_PROVIDER=local_disk with that token present still
 * falls back to Blob, since local_disk would silently fail on Vercel.
 *
 * Add a "minio" branch here (S3-compatible client pointed at a custom endpoint) once a MinIO
 * instance is available — callers only ever see a plain URL string back, so no calling code
 * needs to change.
 */
export function getStorageProvider(): StorageProvider {
  if (cached) return cached;

  const kind = process.env.STORAGE_PROVIDER ?? "local_disk";
  const hasBlobToken = !!process.env.BLOB_READ_WRITE_TOKEN;

  if (kind === "vercel_blob" || (kind === "local_disk" && hasBlobToken && !!process.env.VERCEL)) {
    cached = new VercelBlobStorageProvider();
    return cached;
  }

  cached = new LocalDiskStorageProvider();
  return cached;
}
