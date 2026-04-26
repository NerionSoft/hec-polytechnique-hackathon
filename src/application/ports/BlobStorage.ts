export interface UploadedBlob {
  url: string;
  pathname: string;
  contentType: string;
}

export interface BlobStorage {
  put(path: string, body: Buffer, opts: { contentType: string }): Promise<UploadedBlob>;
}
