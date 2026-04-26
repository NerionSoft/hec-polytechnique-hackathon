import type { PrismaClient, Prisma } from "@prisma/client";
import {
  OutreachDraft,
  type OutreachDraftProps,
  type OutreachStatus,
} from "@/src/application/domain/outreach/OutreachDraft";
import type { LeadId } from "@/src/application/domain/lead/Lead";
import type { OutreachDraftRepository } from "@/src/application/ports/OutreachDraftRepository";

type Row = Prisma.OutreachDraftGetPayload<Record<string, never>>;

function toDomain(row: Row): OutreachDraft {
  const props: OutreachDraftProps = {
    id: row.id,
    leadId: row.leadId as LeadId,
    thesisId: row.thesisId,
    recipient: row.recipient,
    subject: row.subject,
    body: row.body,
    status: row.status as OutreachStatus,
    model: row.model,
    promptHash: row.promptHash,
    promptTokens: row.promptTokens,
    completionTokens: row.completionTokens,
    generatedAt: row.generatedAt,
    approvedAt: row.approvedAt,
    sentAt: row.sentAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
  return OutreachDraft.fromPersistence(props);
}

function toPersistence(d: OutreachDraft): Prisma.OutreachDraftUncheckedCreateInput {
  const p = d.toJSON();
  return {
    id: p.id,
    leadId: p.leadId,
    thesisId: p.thesisId,
    recipient: p.recipient,
    subject: p.subject,
    body: p.body,
    status: p.status,
    model: p.model,
    promptHash: p.promptHash,
    promptTokens: p.promptTokens,
    completionTokens: p.completionTokens,
    generatedAt: p.generatedAt,
    approvedAt: p.approvedAt,
    sentAt: p.sentAt,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

export class PrismaOutreachDraftRepository implements OutreachDraftRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(draft: OutreachDraft): Promise<void> {
    const data = toPersistence(draft);
    const { id: _id, ...update } = data;
    void _id;
    await this.prisma.outreachDraft.upsert({
      where: { id: data.id! },
      create: data,
      update,
    });
  }

  async findById(id: string): Promise<OutreachDraft | null> {
    const row = await this.prisma.outreachDraft.findUnique({ where: { id } });
    return row ? toDomain(row) : null;
  }

  async listByLeadId(leadId: LeadId): Promise<OutreachDraft[]> {
    const rows = await this.prisma.outreachDraft.findMany({
      where: { leadId },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(toDomain);
  }
}
