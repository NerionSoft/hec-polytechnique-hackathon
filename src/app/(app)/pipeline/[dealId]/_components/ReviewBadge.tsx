import { Bot, Check, Clock4, X } from "lucide-react";
import { cn } from "@/src/presentation/lib/cn";
import type { ReviewStatus } from "@/src/lib/mock/red-flags";

export function ReviewBadge({
  status,
  raisedBy = "ai",
}: {
  status: ReviewStatus;
  raisedBy?: "ai" | "human";
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {raisedBy === "ai" && (
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5",
            "border-state-ai/25 bg-state-ai/10 text-state-ai text-[10.5px] font-medium",
          )}
        >
          <Bot strokeWidth={1.8} className="size-2.5" />
          AI
        </span>
      )}
      <Status status={status} />
    </span>
  );
}

function Status({ status }: { status: ReviewStatus }) {
  if (status === "approved") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full border px-2 py-0.5",
          "border-state-approved/25 bg-state-approved/10",
          "text-state-approved text-[10.5px] font-medium",
        )}
      >
        <Check strokeWidth={2} className="size-2.5" />
        Approved
      </span>
    );
  }
  if (status === "dismissed") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full border px-2 py-0.5",
          "border-foreground/15 bg-foreground/[0.04]",
          "text-foreground/55 text-[10.5px] font-medium",
        )}
      >
        <X strokeWidth={2} className="size-2.5" />
        Dismissed
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5",
        "border-state-pending/25 bg-state-pending/10",
        "text-state-pending text-[10.5px] font-medium",
      )}
    >
      <Clock4 strokeWidth={1.8} className="size-2.5" />
      Pending review
    </span>
  );
}
