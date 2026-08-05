"use client";

import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 active:scale-[0.98]",
  {
    variants: {
      variant: {
        primary:
          "bg-accent text-accent-foreground shadow-soft hover:bg-accent-hover",
        secondary:
          "bg-surface-raised text-foreground border border-border hover:border-border-strong hover:bg-surface-muted",
        ghost:
          "text-muted-foreground hover:bg-surface-muted hover:text-foreground",
        danger: "bg-danger text-white hover:opacity-90",
        subtle: "bg-surface-muted text-foreground hover:bg-border/60",
      },
      size: {
        sm: "h-8 px-3 text-xs [&_svg]:size-3.5",
        md: "h-10 px-4 [&_svg]:size-4",
        lg: "h-11 px-6 [&_svg]:size-4",
        icon: "size-9 [&_svg]:size-4",
        "icon-sm": "size-7 [&_svg]:size-3.5",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

type ButtonProps = ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    /** Render as the child element (e.g. a Next `<Link>`) instead of `<button>`. */
    asChild?: boolean;
    loading?: boolean;
  };

export function Button({
  className,
  variant,
  size,
  asChild = false,
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const classes = cn(buttonVariants({ variant, size }), className);

  // `Slot` requires exactly one React element child — it merges props onto that
  // element rather than rendering a wrapper. Passing `children` through
  // untouched is therefore mandatory: even a `null` sibling from a conditional
  // counts as a second child and throws "Slot failed to slot onto its
  // children". The caller's own element supplies any icon it needs.
  if (asChild) {
    return (
      <Slot className={classes} {...props}>
        {children}
      </Slot>
    );
  }

  return (
    <button className={classes} disabled={disabled || loading} {...props}>
      {loading ? <Loader2 className="animate-spin" /> : null}
      {children}
    </button>
  );
}

export { buttonVariants };
