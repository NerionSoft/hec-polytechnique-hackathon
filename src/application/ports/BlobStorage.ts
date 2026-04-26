export interface UploadedBlob {
  url: string;
  pathname: string;
  contentType: string;
}

export interface DownloadedBlob {
  /** Raw byte stream of the blob's content. */
  stream: ReadableStream<Uint8Array>;
  /** Content-Type as reported by the storage backend. */
  contentType: string;
  /** Size in bytes. May be 0 for chunked transfers, never negative. */
  size: number;
  /** ETag as returned by storage; useful for conditional GETs and dedup. */
  etag: string;
}

/**
 * Hexagonal port for blob storage. Both upload and download stay behind this
 * boundary so the application layer never imports the @vercel/blob SDK.
 *
 * `download` requires an `AbortSignal` so callers can enforce a wall-clock
 * timeout that ACTUALLY cancels the underlying HTTP request — vanilla
 * `fetch` + `Promise.race` only resolves the JS promise but leaves the
 * socket open, leading to zombie connections under load.
 */
export interface BlobStorage {
  put(path: string, body: Buffer, opts: { contentType: string }): Promise<UploadedBlob>;
  download(urlOrPathname: string, opts?: { signal?: AbortSignal }): Promise<DownloadedBlob>;
}
