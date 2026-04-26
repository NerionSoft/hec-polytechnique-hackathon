import { describe, expect, it } from "vitest";
import {
  EnrichmentResultBuilder,
  FundThesisBuilder,
  LeadBuilder,
} from "../../test-support/builders";
import {
  FakeClock,
  FakeIdGenerator,
  FakeOutreachDrafter,
  InMemoryFundThesisRepository,
  InMemoryLeadEnrichmentRepository,
  InMemoryLeadRepository,
  InMemoryOutreachDraftRepository,
} from "../../test-support/fakes";
import type { LeadId } from "../../domain/lead/Lead";
import { LEAD_STATUS } from "../../domain/lead/enums";
import {
  makeApproveOutreachDraft,
  makeGenerateOutreachDraft,
  makeListOutreachDrafts,
  makeMarkOutreachSent,
  makeUpdateOutreachDraft,
} from "./OutreachUseCases";

const NOW = new Date("2026-04-26T10:00:00.000Z");
const LATER = new Date("2026-04-26T11:00:00.000Z");

function setup() {
  const leadRepo = new InMemoryLeadRepository();
  const thesisRepo = new InMemoryFundThesisRepository();
  const enrichmentRepo = new InMemoryLeadEnrichmentRepository();
  const outreachRepo = new InMemoryOutreachDraftRepository();
  const drafter = new FakeOutreachDrafter();
  const clock = new FakeClock(NOW);
  const idGen = new FakeIdGenerator("draft");

  const thesis = FundThesisBuilder.demo().withId("thesis-1").withOwnerId("owner-1").build();
  thesisRepo.seed(thesis);

  const lead = LeadBuilder.acme().withId("lead-1").withThesisId("thesis-1").build();
  leadRepo.seed(lead);

  enrichmentRepo.seed(lead.id as LeadId, EnrichmentResultBuilder.default().build());

  return {
    leadRepo,
    thesisRepo,
    enrichmentRepo,
    outreachRepo,
    drafter,
    clock,
    idGen,
    leadId: lead.id as LeadId,
    thesisId: thesis.id,
  };
}

describe("GenerateOutreachDraft", () => {
  it("creates a DRAFT and persists it", async () => {
    const t = setup();
    const generate = makeGenerateOutreachDraft(t);
    const draft = await generate({
      ownerId: "owner-1",
      leadId: t.leadId,
      thesisId: t.thesisId,
    });

    expect(draft.status).toBe("DRAFT");
    expect(draft.toJSON().subject).toContain("Acme");
    expect(t.outreachRepo.count()).toBe(1);
    expect(t.drafter.draftCalls).toHaveLength(1);
  });

  it("rejects when enrichment is missing", async () => {
    const t = setup();
    t.enrichmentRepo.clear();
    const generate = makeGenerateOutreachDraft(t);
    await expect(
      generate({ ownerId: "owner-1", leadId: t.leadId, thesisId: t.thesisId }),
    ).rejects.toThrow(/no enrichment/);
  });

  it("rejects when thesis is owned by another user", async () => {
    const t = setup();
    const generate = makeGenerateOutreachDraft(t);
    await expect(
      generate({ ownerId: "intruder", leadId: t.leadId, thesisId: t.thesisId }),
    ).rejects.toThrow(/not found for owner/);
  });
});

describe("UpdateOutreachDraft", () => {
  it("edits subject + body and refreshes updatedAt; APPROVED draft drops back to DRAFT", async () => {
    const t = setup();
    const generate = makeGenerateOutreachDraft(t);
    const approve = makeApproveOutreachDraft(t);
    const update = makeUpdateOutreachDraft(t);

    const created = await generate({
      ownerId: "owner-1",
      leadId: t.leadId,
      thesisId: t.thesisId,
    });
    const approved = await approve({ ownerId: "owner-1", draftId: created.id });
    expect(approved.status).toBe("APPROVED");

    t.clock.advance(60_000);
    const edited = await update({
      ownerId: "owner-1",
      draftId: created.id,
      patch: { subject: "Updated subject", body: "Updated body content here." },
    });

    expect(edited.toJSON().subject).toBe("Updated subject");
    expect(edited.status).toBe("DRAFT");
    expect(edited.toJSON().approvedAt).toBeNull();
  });
});

describe("MarkOutreachSent", () => {
  it("flips draft to SENT and lead status to CONTACTED", async () => {
    const t = setup();
    const generate = makeGenerateOutreachDraft(t);
    const markSent = makeMarkOutreachSent(t);

    const created = await generate({
      ownerId: "owner-1",
      leadId: t.leadId,
      thesisId: t.thesisId,
    });

    t.clock.set(LATER);
    const sent = await markSent({ ownerId: "owner-1", draftId: created.id });
    expect(sent.status).toBe("SENT");
    expect(sent.toJSON().sentAt).toEqual(LATER);

    const lead = await t.leadRepo.findById(t.leadId);
    expect(lead?.status).toBe(LEAD_STATUS.CONTACTED);
  });

  it("editing a SENT draft is rejected", async () => {
    const t = setup();
    const generate = makeGenerateOutreachDraft(t);
    const markSent = makeMarkOutreachSent(t);
    const update = makeUpdateOutreachDraft(t);

    const created = await generate({
      ownerId: "owner-1",
      leadId: t.leadId,
      thesisId: t.thesisId,
    });
    await markSent({ ownerId: "owner-1", draftId: created.id });

    await expect(
      update({
        ownerId: "owner-1",
        draftId: created.id,
        patch: { subject: "Try to edit a sent" },
      }),
    ).rejects.toThrow(/SENT/);
  });
});

describe("ListOutreachDrafts", () => {
  it("returns drafts only for the requesting owner", async () => {
    const t = setup();
    const generate = makeGenerateOutreachDraft(t);
    const list = makeListOutreachDrafts(t);

    await generate({ ownerId: "owner-1", leadId: t.leadId, thesisId: t.thesisId });
    expect((await list({ ownerId: "owner-1", leadId: t.leadId })).length).toBe(1);
    expect((await list({ ownerId: "intruder", leadId: t.leadId })).length).toBe(0);
  });
});
