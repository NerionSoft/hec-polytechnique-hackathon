import type { PrismaClient, Prisma } from "@prisma/client";
import {
  FundThesis,
  type FundThesisProps,
  type FundThesisPreferences,
} from "@/src/application/domain/thesis/FundThesis";
import type { FundThesisRepository } from "@/src/application/ports/FundThesisRepository";

type PrismaThesisRow = Prisma.FundThesisGetPayload<Record<string, never>>;

function toDomain(row: PrismaThesisRow): FundThesis {
  const props: FundThesisProps = {
    id: row.id,
    ownerId: row.ownerId,
    name: row.name,
    sectors: row.sectors,
    countries: row.countries,
    minRevenueEur: row.minRevenueEur ? Number(row.minRevenueEur) : null,
    maxRevenueEur: row.maxRevenueEur ? Number(row.maxRevenueEur) : null,
    preferences: (row.preferences ?? {}) as FundThesisPreferences,
    active: row.active,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
  return FundThesis.fromPersistence(props);
}

function toPersistence(thesis: FundThesis): Prisma.FundThesisUncheckedCreateInput {
  const p = thesis.toJSON();
  return {
    id: p.id,
    ownerId: p.ownerId,
    name: p.name,
    sectors: p.sectors,
    countries: p.countries,
    minRevenueEur: p.minRevenueEur,
    maxRevenueEur: p.maxRevenueEur,
    preferences: p.preferences as Prisma.InputJsonValue,
    active: p.active,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

export class PrismaFundThesisRepository implements FundThesisRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(thesis: FundThesis): Promise<void> {
    const data = toPersistence(thesis);
    await this.prisma.fundThesis.upsert({
      where: { id: data.id! },
      create: data,
      update: data,
    });
  }

  async findById(id: string): Promise<FundThesis | null> {
    const row = await this.prisma.fundThesis.findUnique({ where: { id } });
    return row ? toDomain(row) : null;
  }

  async listByOwner(ownerId: string): Promise<FundThesis[]> {
    const rows = await this.prisma.fundThesis.findMany({
      where: { ownerId },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(toDomain);
  }
}
