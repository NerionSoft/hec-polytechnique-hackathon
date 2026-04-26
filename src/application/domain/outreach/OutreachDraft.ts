import type { LeadId } from "../lead/Lead";

export const OUTREACH_STATUS = {
  DRAFT: "DRAFT",
  APPROVED: "APPROVED",
  SENT: "SENT",
} as const;
export type OutreachStatus = (typeof OUTREACH_STATUS)[keyof typeof OUTREACH_STATUS];

export interface OutreachDraftProps {
  id: string;
  leadId: LeadId;
  thesisId: string | null;
  recipient: string | null;
  subject: string;
  body: string;
  status: OutreachStatus;
  model: string;
  promptHash: string;
  promptTokens: number | null;
  completionTokens: number | null;
  generatedAt: Date;
  approvedAt: Date | null;
  sentAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewOutreachDraftInput {
  id: string;
  leadId: LeadId;
  thesisId: string | null;
  recipient: string | null;
  subject: string;
  body: string;
  model: string;
  promptHash: string;
  promptTokens: number | null;
  completionTokens: number | null;
  now: Date;
}

export class OutreachDraft {
  private constructor(private readonly props: OutreachDraftProps) {}

  static create(input: NewOutreachDraftInput): OutreachDraft {
    if (!input.subject.trim()) throw new Error("OutreachDraft.subject must not be empty");
    if (!input.body.trim()) throw new Error("OutreachDraft.body must not be empty");
    return new OutreachDraft({
      id: input.id,
      leadId: input.leadId,
      thesisId: input.thesisId,
      recipient: input.recipient,
      subject: input.subject.trim(),
      body: input.body.trim(),
      status: OUTREACH_STATUS.DRAFT,
      model: input.model,
      promptHash: input.promptHash,
      promptTokens: input.promptTokens,
      completionTokens: input.completionTokens,
      generatedAt: input.now,
      approvedAt: null,
      sentAt: null,
      createdAt: input.now,
      updatedAt: input.now,
    });
  }

  static fromPersistence(props: OutreachDraftProps): OutreachDraft {
    return new OutreachDraft(props);
  }

  toJSON(): OutreachDraftProps {
    return { ...this.props };
  }

  get id(): string {
    return this.props.id;
  }
  get leadId(): LeadId {
    return this.props.leadId;
  }
  get status(): OutreachStatus {
    return this.props.status;
  }

  withEdits(
    patch: { subject?: string; body?: string; recipient?: string | null },
    now: Date,
  ): OutreachDraft {
    if (this.props.status === OUTREACH_STATUS.SENT) {
      throw new Error("OutreachDraft is SENT and cannot be edited");
    }
    const next: OutreachDraftProps = {
      ...this.props,
      ...(patch.subject !== undefined && { subject: patch.subject.trim() }),
      ...(patch.body !== undefined && { body: patch.body.trim() }),
      ...(patch.recipient !== undefined && { recipient: patch.recipient }),
      // Editing a SENT or APPROVED draft is forbidden by status guard above; for
      // APPROVED edits we drop back to DRAFT to force a re-approval.
      status:
        this.props.status === OUTREACH_STATUS.APPROVED ? OUTREACH_STATUS.DRAFT : this.props.status,
      approvedAt: this.props.status === OUTREACH_STATUS.APPROVED ? null : this.props.approvedAt,
      updatedAt: now,
    };
    if (!next.subject) throw new Error("OutreachDraft.subject must not be empty");
    if (!next.body) throw new Error("OutreachDraft.body must not be empty");
    return new OutreachDraft(next);
  }

  withApproval(now: Date): OutreachDraft {
    if (this.props.status === OUTREACH_STATUS.SENT) {
      throw new Error("OutreachDraft is already SENT");
    }
    return new OutreachDraft({
      ...this.props,
      status: OUTREACH_STATUS.APPROVED,
      approvedAt: now,
      updatedAt: now,
    });
  }

  withSent(now: Date): OutreachDraft {
    if (this.props.status === OUTREACH_STATUS.SENT) return this;
    return new OutreachDraft({
      ...this.props,
      status: OUTREACH_STATUS.SENT,
      // Auto-approve at send time if user skipped the explicit approval.
      approvedAt: this.props.approvedAt ?? now,
      sentAt: now,
      updatedAt: now,
    });
  }
}
