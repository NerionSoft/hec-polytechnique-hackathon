import type { Finding } from "@prisma/client";
import { prisma } from "@/src/infrastructure/persistence/prisma/client";

export type LoadedFinding = Finding & { deal: { id: string; ownerId: string } };

export async function loadFindingForOwner(
  findingId: string,
  ownerId: string,
): Promise<LoadedFinding | null> {
  const finding = await prisma.finding.findUnique({
    where: { id: findingId },
    include: { deal: { select: { id: true, ownerId: true } } },
  });
  if (!finding) return null;
  if (finding.deal.ownerId !== ownerId) return null;
  return finding;
}
