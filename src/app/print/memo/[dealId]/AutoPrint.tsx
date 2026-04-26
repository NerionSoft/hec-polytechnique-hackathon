"use client";

import { useEffect } from "react";

export function AutoPrint({ title }: { title: string }) {
  useEffect(() => {
    const previous = document.title;
    document.title = title;
    const onAfterPrint = () => {
      document.title = previous;
    };
    window.addEventListener("afterprint", onAfterPrint);
    const t = window.setTimeout(() => window.print(), 350);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("afterprint", onAfterPrint);
      document.title = previous;
    };
  }, [title]);

  return null;
}
