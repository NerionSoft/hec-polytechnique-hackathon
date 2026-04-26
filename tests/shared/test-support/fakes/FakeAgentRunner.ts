import type { AgentRunner } from "@/src/application/ports/AgentRunner";
import type { AgentDefinition } from "@/src/application/agents/shared/agentDefinition";
import type { AgentId, AgentRunResult } from "@/src/application/agents/shared/agentTypes";

type Provider<Input, Output> = Output | ((input: Input) => Output);

interface RecordedCall<Input, Output> {
  agentId: AgentId;
  model: string;
  input: Input;
  output: Output;
}

export class FakeAgentRunner implements AgentRunner {
  private readonly outputs = new Map<AgentId, Provider<unknown, unknown>>();
  readonly calls: RecordedCall<unknown, unknown>[] = [];
  shouldThrow: Error | null = null;

  setOutput<Input, Output>(agentId: AgentId, provider: Provider<Input, Output>): void {
    this.outputs.set(agentId, provider as Provider<unknown, unknown>);
  }

  async run<Input, Output>(
    def: AgentDefinition<Input, Output>,
    input: Input,
  ): Promise<AgentRunResult<Output>> {
    if (this.shouldThrow) throw this.shouldThrow;

    const provider = this.outputs.get(def.agentId);
    if (provider === undefined) {
      throw new Error(
        `FakeAgentRunner: no output configured for ${def.agentId} (call setOutput first)`,
      );
    }

    const output =
      typeof provider === "function"
        ? (provider as (i: Input) => Output)(input)
        : (provider as Output);

    // Validate against the schema so tests fail loudly if they configure
    // an output that the real runner would reject.
    const parsed = def.outputSchema.parse(output);

    this.calls.push({
      agentId: def.agentId,
      model: def.model,
      input,
      output: parsed,
    });

    return {
      agentId: def.agentId,
      output: parsed,
      usage: { promptTokens: 100, completionTokens: 50, costCents: 1 },
      durationMs: 42,
      promptHash: `fake-${def.agentId}-hash`,
      model: def.model,
    };
  }

  clear(): void {
    this.outputs.clear();
    this.calls.length = 0;
    this.shouldThrow = null;
  }
}
