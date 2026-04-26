import { FundThesis, type FundThesisPreferences } from "../../domain/thesis/FundThesis";
import type { FundThesisRepository } from "../../ports/FundThesisRepository";
import type { Clock } from "../../ports/Clock";
import type { IdGenerator } from "../../ports/IdGenerator";

export interface CreateThesisCommand {
  ownerId: string;
  name: string;
  sectors?: string[];
  countries?: string[];
  minRevenueEur?: number | null;
  maxRevenueEur?: number | null;
  preferences?: FundThesisPreferences;
}

export function makeCreateThesis(deps: {
  thesisRepo: FundThesisRepository;
  idGen: IdGenerator;
  clock: Clock;
}) {
  return async (cmd: CreateThesisCommand): Promise<FundThesis> => {
    const thesis = FundThesis.create({
      id: deps.idGen.newId(),
      ownerId: cmd.ownerId,
      name: cmd.name,
      sectors: cmd.sectors,
      countries: cmd.countries,
      minRevenueEur: cmd.minRevenueEur ?? null,
      maxRevenueEur: cmd.maxRevenueEur ?? null,
      preferences: cmd.preferences,
      now: deps.clock.now(),
    });
    await deps.thesisRepo.save(thesis);
    return thesis;
  };
}

export function makeListTheses(deps: { thesisRepo: FundThesisRepository }) {
  return async (ownerId: string): Promise<FundThesis[]> => deps.thesisRepo.listByOwner(ownerId);
}

export function makeGetThesisById(deps: { thesisRepo: FundThesisRepository }) {
  return async (input: { ownerId: string; id: string }): Promise<FundThesis | null> => {
    const thesis = await deps.thesisRepo.findById(input.id);
    if (!thesis || thesis.ownerId !== input.ownerId) return null;
    return thesis;
  };
}

export interface UpdateThesisCommand {
  ownerId: string;
  id: string;
  patch: Partial<{
    name: string;
    sectors: string[];
    countries: string[];
    minRevenueEur: number | null;
    maxRevenueEur: number | null;
    preferences: FundThesisPreferences;
    active: boolean;
  }>;
}

export function makeUpdateThesis(deps: { thesisRepo: FundThesisRepository; clock: Clock }) {
  return async (cmd: UpdateThesisCommand): Promise<FundThesis> => {
    const existing = await deps.thesisRepo.findById(cmd.id);
    if (!existing || existing.ownerId !== cmd.ownerId) {
      throw new Error(`Thesis ${cmd.id} not found for owner ${cmd.ownerId}`);
    }
    const props = existing.toJSON();
    const updated = FundThesis.fromPersistence({
      ...props,
      ...(cmd.patch.name !== undefined && { name: cmd.patch.name.trim() }),
      ...(cmd.patch.sectors !== undefined && { sectors: cmd.patch.sectors }),
      ...(cmd.patch.countries !== undefined && { countries: cmd.patch.countries }),
      ...(cmd.patch.minRevenueEur !== undefined && { minRevenueEur: cmd.patch.minRevenueEur }),
      ...(cmd.patch.maxRevenueEur !== undefined && { maxRevenueEur: cmd.patch.maxRevenueEur }),
      ...(cmd.patch.preferences !== undefined && { preferences: cmd.patch.preferences }),
      ...(cmd.patch.active !== undefined && { active: cmd.patch.active }),
      updatedAt: deps.clock.now(),
    });
    await deps.thesisRepo.save(updated);
    return updated;
  };
}

export function makeDeleteThesis(deps: { thesisRepo: FundThesisRepository }) {
  return async (input: { ownerId: string; id: string }): Promise<void> => {
    const existing = await deps.thesisRepo.findById(input.id);
    if (!existing || existing.ownerId !== input.ownerId) {
      throw new Error(`Thesis ${input.id} not found for owner ${input.ownerId}`);
    }
    // Soft delete: keep historic leads' thesis link, mark inactive.
    const props = existing.toJSON();
    const inactive = FundThesis.fromPersistence({ ...props, active: false });
    await deps.thesisRepo.save(inactive);
  };
}
