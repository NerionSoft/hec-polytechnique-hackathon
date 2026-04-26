import { serve } from "inngest/next";
import { inngest } from "@/src/infrastructure/inngest/client";
import { pipelineFn } from "@/src/infrastructure/inngest/pipelineFn";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [pipelineFn],
});
