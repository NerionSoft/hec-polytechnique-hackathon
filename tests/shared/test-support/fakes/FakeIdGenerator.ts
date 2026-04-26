import type { IdGenerator } from "@/src/application/ports/IdGenerator";

export class FakeIdGenerator implements IdGenerator {
  private counter = 0;

  constructor(private readonly prefix: string = "id") {}

  newId(): string {
    const id = `${this.prefix}-${this.counter}`;
    this.counter += 1;
    return id;
  }

  reset(): void {
    this.counter = 0;
  }
}
