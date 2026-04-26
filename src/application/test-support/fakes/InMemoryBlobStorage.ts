import type { BlobStorage, DownloadedBlob, UploadedBlob } from "../../ports/BlobStorage";

interface StoredBlob {
  body: Buffer;
  contentType: string;
  etag: string;
}

const URL_PREFIX = "memory://blob/";

export class InMemoryBlobStorage implements BlobStorage {
  private readonly store = new Map<string, StoredBlob>();
  readonly putCalls: Array<{ path: string; size: number; contentType: string }> = [];
  readonly downloadCalls: string[] = [];

  async put(path: string, body: Buffer, opts: { contentType: string }): Promise<UploadedBlob> {
    const etag = `"${path}-${body.length}"`;
    this.store.set(path, { body, contentType: opts.contentType, etag });
    this.putCalls.push({ path, size: body.length, contentType: opts.contentType });
    return {
      url: `${URL_PREFIX}${path}`,
      pathname: path,
      contentType: opts.contentType,
    };
  }

  async download(
    urlOrPathname: string,
    opts: { signal?: AbortSignal } = {},
  ): Promise<DownloadedBlob> {
    if (opts.signal?.aborted) throw new Error("blob_aborted");
    this.downloadCalls.push(urlOrPathname);
    const path = urlOrPathname.startsWith(URL_PREFIX)
      ? urlOrPathname.slice(URL_PREFIX.length)
      : urlOrPathname;
    const blob = this.store.get(path);
    if (!blob) throw new Error(`blob_not_found: ${urlOrPathname}`);
    return {
      stream: bufferToStream(blob.body),
      contentType: blob.contentType,
      size: blob.body.length,
      etag: blob.etag,
    };
  }

  // ── test helpers ──
  count(): number {
    return this.store.size;
  }
  clear(): void {
    this.store.clear();
    this.putCalls.length = 0;
    this.downloadCalls.length = 0;
  }
  read(path: string): StoredBlob | null {
    return this.store.get(path) ?? null;
  }
}

function bufferToStream(buf: Buffer): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new Uint8Array(buf));
      controller.close();
    },
  });
}
