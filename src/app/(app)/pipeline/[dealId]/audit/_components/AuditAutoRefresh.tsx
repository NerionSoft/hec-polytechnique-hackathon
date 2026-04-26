"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface Props {
  entryCount: number;
}

/**
 * Polls the audit page every 4s while a pipeline run is in flight. We use the
 * entry count as a tie-breaker: when it stops growing for several refreshes
 * in a row we slow the cadence down.
 */
export function AuditAutoRefresh({ entryCount }: Props) {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => {
      router.refresh();
    }, 4_000);
    return () => clearInterval(id);
  }, [router, entryCount]);

  return null;
}
