import type { PrismaClient, Prisma } from "@prisma/client";
import { Lead, type LeadId, type LeadProps } from "@/src/application/domain/lead/Lead";
import type { LeadStatus, LeadSource } from "@/src/application/domain/lead/enums";
import type { LeadRepository } from "@/src/application/ports/LeadRepository";
import type { ListLeadsQuery } from "@/src/application/ports/types";

type PrismaLeadRow = Prisma.LeadGetPayload<Record<string, never>>;

function toDomain(row: PrismaLeadRow): Lead {
  const props: LeadProps = {
    id: row.id as LeadId,
    source: row.source as LeadSource,
    sourceRef: row.sourceRef,
    importBatchId: row.importBatchId,
    companyName: row.companyName,
    legalName: row.legalName,
    website: row.website,
    websiteDiscoveredAt: row.websiteDiscoveredAt,
    websiteDiscoverySource: row.websiteDiscoverySource,
    country: row.country,
    sector: row.sector,
    napCode: row.napCode,
    employeeCount: row.employeeCount,
    estimatedRevenueEur: row.estimatedRevenue ? Number(row.estimatedRevenue) : null,
    founderName: row.founderName,
    status: row.status as LeadStatus,
    thesisId: row.thesisId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
  return Lead.fromPersistence(props);
}

function toPersistence(lead: Lead): Prisma.LeadUncheckedCreateInput {
  const p = lead.toJSON();
  return {
    id: p.id,
    source: p.source,
    sourceRef: p.sourceRef,
    importBatchId: p.importBatchId,
    companyName: p.companyName,
    legalName: p.legalName,
    website: p.website,
    websiteDiscoveredAt: p.websiteDiscoveredAt,
    websiteDiscoverySource: p.websiteDiscoverySource,
    country: p.country,
    sector: p.sector,
    napCode: p.napCode,
    employeeCount: p.employeeCount,
    estimatedRevenue: p.estimatedRevenueEur,
    founderName: p.founderName,
    status: p.status,
    thesisId: p.thesisId,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

export class PrismaLeadRepository implements LeadRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(lead: Lead): Promise<void> {
    const data = toPersistence(lead);
    await this.upsertOne(data);
  }

  async saveMany(leads: Lead[]): Promise<void> {
    if (leads.length === 0) return;
    // Upsert one-by-one. When sourceRef is present, dedupe via the composite
    // (source, sourceRef) unique key so re-sourcing the same SIREN updates the
    // existing row instead of failing with P2002. Falls back to id-based upsert
    // for leads without a natural key (e.g. MANUAL).
    await this.prisma.$transaction(leads.map((lead) => this.upsertOne(toPersistence(lead))));
  }

  private upsertOne(data: Prisma.LeadUncheckedCreateInput) {
    // `id` must never be in the update payload — it's immutable, and updating
    // through the composite key must keep the existing row's id.
    const { id: _ignored, ...updateData } = data;
    void _ignored;

    if (data.sourceRef) {
      return this.prisma.lead.upsert({
        where: {
          source_dedupe: { source: data.source, sourceRef: data.sourceRef },
        },
        create: data,
        update: updateData,
      });
    }
    return this.prisma.lead.upsert({
      where: { id: data.id! },
      create: data,
      update: updateData,
    });
  }

  async findById(id: LeadId): Promise<Lead | null> {
    const row = await this.prisma.lead.findUnique({ where: { id } });
    return row ? toDomain(row) : null;
  }

  async list(query: ListLeadsQuery): Promise<Lead[]> {
    const rows = await this.prisma.lead.findMany({
      where: {
        thesis: { ownerId: query.ownerId },
        ...(query.status ? { status: query.status } : {}),
        ...(query.thesisId ? { thesisId: query.thesisId } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: query.limit ?? 100,
      skip: query.offset ?? 0,
    });
    return rows.map(toDomain);
  }

  async countByThesis(thesisId: string): Promise<number> {
    return this.prisma.lead.count({ where: { thesisId } });
  }
}
