import type { BlobStorage, UploadedBlob } from "../../ports/BlobStorage";

interface StoredBlob {
  body: Buffer;
  contentType: string;
}

export class InMemoryBlobStorage implements BlobStorage {
  private readonly store = new Map<string, StoredBlob>();
  readonly putCalls: Array<{ path: string; size: number; contentType: string }> = [];

  async put(path: string, body: Buffer, opts: { contentType: string }): Promise<UploadedBlob> {
    this.store.set(path, { body, contentType: opts.contentType });
    this.putCalls.push({ path, size: body.length, contentType: opts.contentType });
    return {
      url: `memory://blob/${path}`,
      pathname: path,
      contentType: opts.contentType,
    };
  }

  // ── test helpers ──
  count(): number {
    return this.store.size;
  }
  clear(): void {
    this.store.clear();
    this.putCalls.length = 0;
  }
  read(path: string): StoredBlob | null {
    return this.store.get(path) ?? null;
  }
}
