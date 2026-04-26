import type { FundThesis } from "../domain/thesis/FundThesis";

export interface FundThesisRepository {
  save(thesis: FundThesis): Promise<void>;
  findById(id: string): Promise<FundThesis | null>;
  listByOwner(ownerId: string): Promise<FundThesis[]>;
}
