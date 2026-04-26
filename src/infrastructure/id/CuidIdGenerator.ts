import { randomBytes } from "node:crypto";
import type { IdGenerator } from "@/src/application/ports/IdGenerator";

// Lightweight, URL-safe id (no extra dep). Sufficient for hackathon scale.
export class CuidIdGenerator implements IdGenerator {
  newId(): string {
    return randomBytes(12).toString("base64url");
  }
}
