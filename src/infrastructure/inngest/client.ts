import { Inngest } from "inngest";

/**
 * Inngest 4.x dropped the `EventSchemas` plumbing. We keep a hand-rolled
 * registry here for documentation; the pipeline function casts `event.data`
 * to `PipelineStartData` at the entry boundary.
 */
export const inngest = new Inngest({ id: "athena" });

export interface PipelineStartData {
  runId: string;
  dealId: string;
  asOfDate: string;
}
