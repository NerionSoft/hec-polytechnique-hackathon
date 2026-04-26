import type { Clock } from "@/src/application/ports/Clock";

export class FakeClock implements Clock {
  private current: number;

  constructor(initial: Date | number = 0) {
    this.current = typeof initial === "number" ? initial : initial.getTime();
  }

  now(): Date {
    return new Date(this.current);
  }

  advance(ms: number): void {
    this.current += ms;
  }

  set(date: Date | number): void {
    this.current = typeof date === "number" ? date : date.getTime();
  }
}
