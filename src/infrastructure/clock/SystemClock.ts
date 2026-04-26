import type { Clock } from "@/src/application/ports/Clock";

export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}
