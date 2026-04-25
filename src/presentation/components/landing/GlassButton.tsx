import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";
import { cn } from "@/src/presentation/lib/cn";

type GlassButtonVariant = "glass" | "solid" | "ghost";
type GlassButtonSize = "sm" | "md";

interface GlassButtonProps extends ComponentPropsWithoutRef<"button"> {
  variant?: GlassButtonVariant;
  size?: GlassButtonSize;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
}

const base = cn(
  "inline-flex items-center justify-center gap-2",
  "rounded-[50px] font-medium tracking-tight",
  "transition-all duration-200 ease-out",
  "focus-visible:outline-none focus-visible:ring-2",
  "focus-visible:ring-foreground/40",
);

const variants: Record<GlassButtonVariant, string> = {
  glass: cn(
    "bg-foreground/10 text-foreground",
    "border border-foreground/10",
    "backdrop-blur-[34px]",
    "hover:bg-foreground/15",
  ),
  solid: cn(
    "bg-foreground text-background",
    "hover:bg-foreground/90",
  ),
  ghost: cn(
    "text-foreground/70",
    "hover:text-foreground",
  ),
};

const sizes: Record<GlassButtonSize, string> = {
  sm: "h-9 px-4 text-[13px]",
  md: "h-11 px-6 text-sm",
};

const GlassButton = forwardRef<HTMLButtonElement, GlassButtonProps>(
  (
    {
      className,
      variant = "glass",
      size = "md",
      leadingIcon,
      trailingIcon,
      children,
      type = "button",
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      >
        {leadingIcon ? (
          <span className="grid place-items-center">{leadingIcon}</span>
        ) : null}
        <span>{children}</span>
        {trailingIcon ? (
          <span className="grid place-items-center">{trailingIcon}</span>
        ) : null}
      </button>
    );
  },
);

GlassButton.displayName = "GlassButton";

export { GlassButton, type GlassButtonProps };
