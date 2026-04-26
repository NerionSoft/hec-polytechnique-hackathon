import type { AgentDefinition } from "../agents/shared/agentDefinition";
import type { AgentRunResult } from "../agents/shared/agentTypes";

/**
 * Port for invoking an LLM agent. The infrastructure adapter
 * (AiGatewayAgentRunner) handles the actual API call, prompt-cache hashing,
 * structured output parsing, and usage accounting.
 *
 * The runner does NOT persist anything. Persistence (AgentOutput row,
 * normalizer side-effects) is the orchestrator's job — keeps this port
 * IO-free and unit-testable.
 */
export interface AgentRunner {
  run<Input, Output>(
    definition: AgentDefinition<Input, Output>,
    input: Input,
  ): Promise<AgentRunResult<Output>>;
}
