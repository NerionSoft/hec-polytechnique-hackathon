import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSession } from "@/src/infrastructure/auth/server";
import { SignInForm } from "@/src/presentation/components/auth/SignInForm";

export const dynamic = "force-dynamic";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const session = await getSession(await headers());
  const sp = await searchParams;
  const next = sp.next && sp.next.startsWith("/") ? sp.next : "/sources";
  if (session) redirect(next);
  return <SignInForm next={next} />;
}
