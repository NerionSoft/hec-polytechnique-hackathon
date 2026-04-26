import type { LeadId } from "../../domain/lead/Lead";
import { LEAD_STATUS } from "../../domain/lead/enums";
import type { Clock } from "../../ports/Clock";
import type { LeadRepository } from "../../ports/LeadRepository";
import type { LeadEnricher, EnrichmentCache } from "../../ports/LeadEnricher";
import type { WebsiteScraper } from "../../ports/WebsiteScraper";
import type { WebsiteSnapshotCache } from "../../ports/WebsiteSnapshotCache";
import type { LeadEnrichmentRepository } from "../../ports/LeadEnrichmentRepository";
import type { EnrichInput, EnrichmentResult, WebsiteSnapshot } from "../../ports/types";

export interface EnrichLeadCommand {
  ownerId: string;
  leadId: LeadId;
  forceRescrape?: boolean;
  forceReenrich?: boolean;
}

export interface EnrichLeadResult {
  leadId: LeadId;
  enrichmentFromCache: boolean;
  scrapeFromCache: boolean;
  enrichment: EnrichmentResult;
  websiteSnapshot: WebsiteSnapshot | null;
}

export interface EnrichLeadDeps {
  leadRepo: LeadRepository;
  enricher: LeadEnricher;
  enrichmentCache: EnrichmentCache;
  enrichmentRepo: LeadEnrichmentRepository;
  scraper: WebsiteScraper;
  snapshotCache: WebsiteSnapshotCache;
  clock: Clock;
}

export function makeEnrichLead(deps: EnrichLeadDeps) {
  return async (cmd: EnrichLeadCommand): Promise<EnrichLeadResult> => {
    const lead = await deps.leadRepo.findById(cmd.leadId);
    if (!lead) throw new Error(`Lead ${cmd.leadId} not found`);

    let snapshot: WebsiteSnapshot | null = null;
    let scrapeFromCache = false;

    if (lead.website) {
      if (!cmd.forceRescrape) {
        snapshot = await deps.snapshotCache.get(lead.website);
        if (snapshot) scrapeFromCache = true;
      }
      if (!snapshot) {
        try {
          snapshot = await deps.scraper.scrape(lead.website);
          await deps.snapshotCache.set(snapshot);
        } catch (err) {
          console.warn(`[EnrichLead] scrape failed for ${lead.website}:`, (err as Error).message);
        }
      }
    }

    const input: EnrichInput = {
      lead: {
        companyName: lead.companyName,
        website: lead.website,
        country: lead.country,
        sector: lead.sector,
        employeeCount: lead.employeeCount,
        estimatedRevenueEur: lead.estimatedRevenueEur,
        founderName: lead.founderName,
      },
      website: snapshot,
    };

    const promptHash = deps.enricher.computePromptHash(input);

    let enrichment: EnrichmentResult;
    let enrichmentFromCache = false;

    if (!cmd.forceReenrich) {
      const cached = await deps.enrichmentCache.get(promptHash);
      if (cached) {
        enrichment = cached;
        enrichmentFromCache = true;
      } else {
        enrichment = await deps.enricher.enrich(input);
        await deps.enrichmentCache.set(enrichment);
      }
    } else {
      enrichment = await deps.enricher.enrich(input);
      await deps.enrichmentCache.set(enrichment);
    }

    await deps.enrichmentRepo.upsertForLead(lead.id, enrichment);
    await deps.leadRepo.save(lead.withStatus(LEAD_STATUS.ENRICHED, deps.clock.now()));

    return {
      leadId: lead.id,
      enrichmentFromCache,
      scrapeFromCache,
      enrichment,
      websiteSnapshot: snapshot,
    };
  };
}
