import type { PrismaClient } from "@prisma/client";
import type { WebsiteSnapshotCache } from "@/src/application/ports/WebsiteSnapshotCache";
import type { WebsiteSnapshot } from "@/src/application/ports/types";

export class PrismaWebsiteSnapshotCache implements WebsiteSnapshotCache {
  constructor(private readonly prisma: PrismaClient) {}

  async get(url: string): Promise<WebsiteSnapshot | null> {
    const row = await this.prisma.websiteSnapshot.findUnique({ where: { url } });
    if (!row) return null;
    return {
      url: row.url,
      title: row.title,
      description: row.description,
      h1s: row.h1s,
      h2s: row.h2s,
      emails: row.emails,
      socialLinks: row.socialLinks,
      fetchedAt: row.fetchedAt,
    };
  }

  async set(snapshot: WebsiteSnapshot): Promise<void> {
    const data = {
      title: snapshot.title,
      description: snapshot.description,
      h1s: snapshot.h1s,
      h2s: snapshot.h2s,
      emails: snapshot.emails,
      socialLinks: snapshot.socialLinks,
      fetchedAt: snapshot.fetchedAt,
    };
    await this.prisma.websiteSnapshot.upsert({
      where: { url: snapshot.url },
      create: { url: snapshot.url, ...data },
      update: data,
    });
  }
}
