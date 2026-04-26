import { auth, type Session } from "./auth";

export class UnauthorizedError extends Error {
  readonly statusCode = 401;
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export async function getSession(headers: Headers): Promise<Session | null> {
  return auth.api.getSession({ headers });
}

export async function requireSession(headers: Headers): Promise<Session> {
  const session = await getSession(headers);
  if (!session) {
    throw new UnauthorizedError();
  }
  return session;
}

export type { Session };
