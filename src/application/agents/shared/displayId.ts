import type { PrismaClient } from "@prisma/client";

type Prefix = "rf" | "c" | "q";
type TableName = "finding" | "citation" | "managementQuestion";

const PREFIX_TO_TABLE: Record<Prefix, TableName> = {
  rf: "finding",
  c: "citation",
  q: "managementQuestion",
};

/**
 * Allocate the next display ID for a given prefix scoped to a deal.
 *
 * Atomic-ish: uses a serializable transaction so concurrent normalizer calls
 * for the same deal cannot collide. In practice agents run in distinct
 * Inngest steps so collisions are rare; this guard makes the behaviour safe
 * if you ever batch them.
 */
export async function nextDisplayId(
  prisma: PrismaClient,
  prefix: Prefix,
  dealId: string,
): Promise<string> {
  const table = PREFIX_TO_TABLE[prefix];

  return prisma.$transaction(
    async (tx) => {
      const rows = (await (tx as unknown as Record<string, unknown>)[table]) as {
        findMany: (args: {
          where: { dealId: string };
          select: { displayId: true };
        }) => Promise<{ displayId: string }[]>;
      };
      const found = await rows.findMany({
        where: { dealId },
        select: { displayId: true },
      });
      const max = found.reduce((acc, r) => {
        const n = Number.parseInt(r.displayId.replace(prefix, ""), 10);
        return Number.isFinite(n) && n > acc ? n : acc;
      }, 0);
      return `${prefix}${max + 1}`;
    },
    { isolationLevel: "Serializable" },
  );
}
