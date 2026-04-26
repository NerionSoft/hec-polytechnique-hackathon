import {
  BlobAccessError,
  BlobNotFoundError,
  BlobRequestAbortedError,
  get,
  put,
} from "@vercel/blob";
import type {
  BlobStorage,
  DownloadedBlob,
  UploadedBlob,
} from "@/src/application/ports/BlobStorage";

/**
 * Vercel Blob adapter.
 *
 * Uploads use `put()` with `access: 'public'` so generated URLs are CDN-cached
 * and world-readable (the architectural choice for the MVP).
 *
 * Downloads MUST go through `get()` from the SDK rather than vanilla
 * `fetch(url)`. The two reasons that motivated this:
 *
 * 1. **Cancellation**: `get()` accepts an `AbortSignal` that propagates all
 *    the way to the underlying HTTP socket. Wrapping a vanilla `fetch` in a
 *    `Promise.race` only resolves the JS promise — the socket stays open,
 *    accumulating zombie connections that eventually exhaust the Node http
 *    agent's pool. We saw this manifest as the dev server hanging for 30+s.
 *
 * 2. **No Next.js fetch wrapper**: Next.js (App Router + Turbopack) wraps
 *    the global `fetch` with a caching/dedup layer that sometimes gets
 *    confused on opaque external URLs and waits for revalidation. The
 *    SDK's HTTP client bypasses this entirely.
 *
 * SDK errors are caught and re-thrown as plain `Error`s with a stable
 * machine-readable prefix so the consumer logs (and DealAuditEvent rows) are
 * actionable.
 */
export class VercelBlobStorage implements BlobStorage {
  async put(path: string, body: Buffer, opts: { contentType: string }): Promise<UploadedBlob> {
    const blob = await put(path, body, {
      access: "public",
      contentType: opts.contentType,
    });
    return {
      url: blob.url,
      pathname: blob.pathname,
      contentType: opts.contentType,
    };
  }

  async download(
    urlOrPathname: string,
    opts: { signal?: AbortSignal } = {},
  ): Promise<DownloadedBlob> {
    try {
      const result = await get(urlOrPathname, {
        access: "public",
        abortSignal: opts.signal,
      });

      if (!result) {
        throw new Error(`blob_not_found: ${urlOrPathname}`);
      }
      if (result.statusCode !== 200 || !result.stream) {
        throw new Error(`blob_unexpected_status: HTTP ${result.statusCode} for ${urlOrPathname}`);
      }

      return {
        stream: result.stream,
        contentType: result.blob.contentType ?? "application/octet-stream",
        size: result.blob.size ?? 0,
        etag: result.blob.etag,
      };
    } catch (err) {
      if (err instanceof BlobNotFoundError) {
        throw new Error(`blob_not_found: ${urlOrPathname}`);
      }
      if (err instanceof BlobAccessError) {
        throw new Error(
          `blob_access_denied: check BLOB_READ_WRITE_TOKEN and that the store is set to 'public' (${urlOrPathname})`,
        );
      }
      if (err instanceof BlobRequestAbortedError) {
        throw new Error(`blob_aborted: timeout fetching ${urlOrPathname}`);
      }
      throw err;
    }
  }
}
