import { Lead, type LeadId, type NewLeadInput } from "../../domain/lead/Lead";
import { LEAD_SOURCE, type LeadSource } from "../../domain/lead/enums";

export class LeadBuilder {
  private input: NewLeadInput;

  private constructor(input: NewLeadInput) {
    this.input = input;
  }

  static acme(): LeadBuilder {
    return new LeadBuilder({
      id: "lead-acme" as LeadId,
      source: LEAD_SOURCE.MANUAL,
      companyName: "Acme SAS",
      country: "FR",
      website: "https://acme.example",
      sector: "Software",
      employeeCount: 25,
      estimatedRevenueEur: 5_000_000,
      founderName: "Alice Dupont",
      now: new Date(0),
    });
  }

  withId(id: string): LeadBuilder {
    return new LeadBuilder({ ...this.input, id: id as LeadId });
  }
  withSource(source: LeadSource): LeadBuilder {
    return new LeadBuilder({ ...this.input, source });
  }
  withCompanyName(name: string): LeadBuilder {
    return new LeadBuilder({ ...this.input, companyName: name });
  }
  withCountry(country: string): LeadBuilder {
    return new LeadBuilder({ ...this.input, country });
  }
  withWebsite(website: string | null): LeadBuilder {
    return new LeadBuilder({ ...this.input, website });
  }
  withSector(sector: string | null): LeadBuilder {
    return new LeadBuilder({ ...this.input, sector });
  }
  withEmployeeCount(n: number | null): LeadBuilder {
    return new LeadBuilder({ ...this.input, employeeCount: n });
  }
  withRevenue(eur: number | null): LeadBuilder {
    return new LeadBuilder({ ...this.input, estimatedRevenueEur: eur });
  }
  withFounderName(name: string | null): LeadBuilder {
    return new LeadBuilder({ ...this.input, founderName: name });
  }
  withThesisId(id: string | null): LeadBuilder {
    return new LeadBuilder({ ...this.input, thesisId: id });
  }
  withImportBatchId(id: string | null): LeadBuilder {
    return new LeadBuilder({ ...this.input, importBatchId: id });
  }
  withNow(now: Date): LeadBuilder {
    return new LeadBuilder({ ...this.input, now });
  }

  build(): Lead {
    return Lead.create(this.input);
  }
}
