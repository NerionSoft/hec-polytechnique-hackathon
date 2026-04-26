import { NextResponse } from "next/server";
import { UnauthorizedError } from "@/src/infrastructure/auth/server";

export function ok<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

export function badRequest(message: string, details?: unknown): NextResponse {
  return NextResponse.json({ error: "BadRequest", message, details }, { status: 400 });
}

export function unauthorized(message = "Unauthorized"): NextResponse {
  return NextResponse.json({ error: "Unauthorized", message }, { status: 401 });
}

export function notFound(message = "Not found"): NextResponse {
  return NextResponse.json({ error: "NotFound", message }, { status: 404 });
}

export function serverError(message = "Internal server error"): NextResponse {
  return NextResponse.json({ error: "ServerError", message }, { status: 500 });
}

export function handleError(error: unknown): NextResponse {
  if (error instanceof UnauthorizedError) {
    return unauthorized(error.message);
  }
  if (error instanceof Error) {
    console.error("[api]", error);
    return serverError(error.message);
  }
  console.error("[api] unknown error", error);
  return serverError();
}
