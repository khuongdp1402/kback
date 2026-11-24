import { LocalDiskStorageProvider } from "./local-disk";
import { VercelBlobStorageProvider } from "./vercel-blob";
import type { StorageProvider } from "./types";

export type { StorageProvider, PutObjectInput, PutObjectResult } from "./types";

let cached: StorageProvider | null = null;

export function getStorageProvider(): StorageProvider {
  if (cached) return cached;

  const kind = (process.env.STORAGE_PROVIDER ?? "local_disk").trim();
  const hasBlobCredentials = Boolean(
    process.env.BLOB_READ_WRITE_TOKEN?.trim() ||
      (process.env.BLOB_STORE_ID?.trim() && process.env.VERCEL),
  );

  if (kind === "vercel_blob" || (kind === "local_disk" && hasBlobCredentials && !!process.env.VERCEL)) {
    cached = new VercelBlobStorageProvider();
    return cached;
  }

  cached = new LocalDiskStorageProvider();
  return cached;
}
