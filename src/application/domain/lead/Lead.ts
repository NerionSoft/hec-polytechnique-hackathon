import type { LeadSource, LeadStatus } from "./enums";
import { LEAD_STATUS } from "./enums";

export type LeadId = string & { readonly __brand: "LeadId" };

export interface LeadProps {
  id: LeadId;
  source: LeadSource;
  sourceRef: string | null;
  importBatchId: string | null;
  companyName: string;
  legalName: string | null;
  website: string | null;
  country: string;
  sector: string | null;
  napCode: string | null;
  employeeCount: number | null;
  estimatedRevenueEur: number | null;
  founderName: string | null;
  status: LeadStatus;
  thesisId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewLeadInput {
  id: LeadId;
  source: LeadSource;
  companyName: string;
  country?: string;
  sourceRef?: string | null;
  importBatchId?: string | null;
  legalName?: string | null;
  website?: string | null;
  sector?: string | null;
  napCode?: string | null;
  employeeCount?: number | null;
  estimatedRevenueEur?: number | null;
  founderName?: string | null;
  thesisId?: string | null;
  now: Date;
}

export class Lead {
  private constructor(private readonly props: LeadProps) {}

  static create(input: NewLeadInput): Lead {
    const name = input.companyName.trim();
    if (!name) {
      throw new Error("Lead.companyName must not be empty");
    }
    return new Lead({
      id: input.id,
      source: input.source,
      sourceRef: input.sourceRef ?? null,
      importBatchId: input.importBatchId ?? null,
      companyName: name,
      legalName: input.legalName ?? null,
      website: input.website ?? null,
      country: input.country ?? "FR",
      sector: input.sector ?? null,
      napCode: input.napCode ?? null,
      employeeCount: input.employeeCount ?? null,
      estimatedRevenueEur: input.estimatedRevenueEur ?? null,
      founderName: input.founderName ?? null,
      status: LEAD_STATUS.NEW,
      thesisId: input.thesisId ?? null,
      createdAt: input.now,
      updatedAt: input.now,
    });
  }

  static fromPersistence(props: LeadProps): Lead {
    return new Lead(props);
  }

  toJSON(): LeadProps {
    return { ...this.props };
  }

  get id(): LeadId {
    return this.props.id;
  }
  get source(): LeadSource {
    return this.props.source;
  }
  get companyName(): string {
    return this.props.companyName;
  }
  get website(): string | null {
    return this.props.website;
  }
  get country(): string {
    return this.props.country;
  }
  get sector(): string | null {
    return this.props.sector;
  }
  get employeeCount(): number | null {
    return this.props.employeeCount;
  }
  get estimatedRevenueEur(): number | null {
    return this.props.estimatedRevenueEur;
  }
  get founderName(): string | null {
    return this.props.founderName;
  }
  get status(): LeadStatus {
    return this.props.status;
  }
  get thesisId(): string | null {
    return this.props.thesisId;
  }

  withStatus(status: LeadStatus, now: Date): Lead {
    return new Lead({ ...this.props, status, updatedAt: now });
  }
}
