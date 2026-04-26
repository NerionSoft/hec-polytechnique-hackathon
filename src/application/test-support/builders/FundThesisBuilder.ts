import {
  FundThesis,
  type FundThesisPreferences,
  type NewFundThesisInput,
} from "../../domain/thesis/FundThesis";

export class FundThesisBuilder {
  private input: NewFundThesisInput;

  private constructor(input: NewFundThesisInput) {
    this.input = input;
  }

  static demo(): FundThesisBuilder {
    return new FundThesisBuilder({
      id: "thesis-demo",
      ownerId: "owner-demo",
      name: "Demo Thesis",
      sectors: ["Software"],
      countries: ["FR"],
      minRevenueEur: 1_000_000,
      maxRevenueEur: 50_000_000,
      preferences: { founderOwned: true, recurringRevenue: true },
      now: new Date(0),
    });
  }

  withId(id: string): FundThesisBuilder {
    return new FundThesisBuilder({ ...this.input, id });
  }
  withOwnerId(ownerId: string): FundThesisBuilder {
    return new FundThesisBuilder({ ...this.input, ownerId });
  }
  withName(name: string): FundThesisBuilder {
    return new FundThesisBuilder({ ...this.input, name });
  }
  withSectors(sectors: string[]): FundThesisBuilder {
    return new FundThesisBuilder({ ...this.input, sectors });
  }
  withCountries(countries: string[]): FundThesisBuilder {
    return new FundThesisBuilder({ ...this.input, countries });
  }
  withRevenueRange(min: number | null, max: number | null): FundThesisBuilder {
    return new FundThesisBuilder({
      ...this.input,
      minRevenueEur: min,
      maxRevenueEur: max,
    });
  }
  withPreferences(prefs: FundThesisPreferences): FundThesisBuilder {
    return new FundThesisBuilder({ ...this.input, preferences: prefs });
  }
  withNow(now: Date): FundThesisBuilder {
    return new FundThesisBuilder({ ...this.input, now });
  }

  build(): FundThesis {
    return FundThesis.create(this.input);
  }
}
