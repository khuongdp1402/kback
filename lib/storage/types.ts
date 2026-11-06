export interface PutObjectInput {
  /** Relative path/filename to store the object under, e.g. "products/abc123.png". */
  key: string;
  data: Buffer;
  contentType: string;
}

export interface PutObjectResult {
  /** Publicly reachable URL for the stored object. */
  url: string;
}

export interface StorageProvider {
  readonly name: string;
  putObject(input: PutObjectInput): Promise<PutObjectResult>;
  deleteObject(key: string): Promise<void>;
}
