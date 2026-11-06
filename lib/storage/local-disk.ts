import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";
import type { StorageProvider, PutObjectInput, PutObjectResult } from "./types";

/**
 * Writes objects under public/generated/ so Next.js serves them directly as static files.
 * Default provider while no external storage (MinIO) endpoint is configured yet — not durable
 * across redeploys on serverless hosts, but good enough for local dev and a single long-running
 * server.
 */
export class LocalDiskStorageProvider implements StorageProvider {
  readonly name = "local_disk";

  private readonly rootDir = path.join(process.cwd(), "public", "generated");
  private readonly publicPrefix = "/generated";

  async putObject({ key, data }: PutObjectInput): Promise<PutObjectResult> {
    const destPath = path.join(this.rootDir, key);
    await mkdir(path.dirname(destPath), { recursive: true });
    await writeFile(destPath, data);
    return { url: `${this.publicPrefix}/${key}` };
  }

  async deleteObject(key: string): Promise<void> {
    await unlink(path.join(this.rootDir, key)).catch(() => {
      // Best-effort — ignore if already missing.
    });
  }
}
