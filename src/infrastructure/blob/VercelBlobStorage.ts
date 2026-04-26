import { put } from "@vercel/blob";
import type { BlobStorage, UploadedBlob } from "@/src/application/ports/BlobStorage";

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
}
