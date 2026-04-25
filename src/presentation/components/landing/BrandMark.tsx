import { Hexagon } from "lucide-react";
import { cn } from "@/src/presentation/lib/cn";

interface BrandMarkProps {
  className?: string;
  size?: number;
}

export function BrandMark({ className, size = 18 }: BrandMarkProps) {
  return (
    <Hexagon
      aria-hidden="true"
      strokeWidth={1.4}
      className={cn("shrink-0 text-foreground", className)}
      style={undefined}
      width={size}
      height={size}
    />
  );
}
