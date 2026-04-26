export interface FundThesisPreferences {
  founderOwned?: boolean;
  recurringRevenue?: boolean;
  profitable?: boolean;
  fragmentedMarket?: boolean;
  successionRisk?: boolean;
  lowCompetition?: boolean;
}

export interface FundThesisProps {
  id: string;
  ownerId: string;
  name: string;
  sectors: string[];
  countries: string[];
  minRevenueEur: number | null;
  maxRevenueEur: number | null;
  preferences: FundThesisPreferences;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewFundThesisInput {
  id: string;
  ownerId: string;
  name: string;
  sectors?: string[];
  countries?: string[];
  minRevenueEur?: number | null;
  maxRevenueEur?: number | null;
  preferences?: FundThesisPreferences;
  now: Date;
}

export class FundThesis {
  private constructor(private readonly props: FundThesisProps) {}

  static create(input: NewFundThesisInput): FundThesis {
    if (!input.name.trim()) {
      throw new Error("FundThesis.name must not be empty");
    }
    return new FundThesis({
      id: input.id,
      ownerId: input.ownerId,
      name: input.name.trim(),
      sectors: input.sectors ?? [],
      countries: input.countries ?? [],
      minRevenueEur: input.minRevenueEur ?? null,
      maxRevenueEur: input.maxRevenueEur ?? null,
      preferences: input.preferences ?? {},
      active: true,
      createdAt: input.now,
      updatedAt: input.now,
    });
  }

  static fromPersistence(props: FundThesisProps): FundThesis {
    return new FundThesis(props);
  }

  toJSON(): FundThesisProps {
    return { ...this.props };
  }

  get id(): string {
    return this.props.id;
  }
  get ownerId(): string {
    return this.props.ownerId;
  }
  get name(): string {
    return this.props.name;
  }
  get sectors(): string[] {
    return this.props.sectors;
  }
  get countries(): string[] {
    return this.props.countries;
  }
  get minRevenueEur(): number | null {
    return this.props.minRevenueEur;
  }
  get maxRevenueEur(): number | null {
    return this.props.maxRevenueEur;
  }
  get preferences(): FundThesisPreferences {
    return this.props.preferences;
  }
  get active(): boolean {
    return this.props.active;
  }
}
