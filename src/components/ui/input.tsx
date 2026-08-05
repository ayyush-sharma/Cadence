import type { ComponentProps } from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cn } from "@/lib/utils";

const fieldStyles =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground shadow-sm transition-colors placeholder:text-subtle-foreground focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(fieldStyles, "h-10", className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        fieldStyles,
        "min-h-20 resize-y leading-relaxed",
        className,
      )}
      {...props}
    />
  );
}

export function Label({
  className,
  ...props
}: ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      className={cn(
        "text-xs font-medium text-muted-foreground select-none",
        className,
      )}
      {...props}
    />
  );
}

export function Field({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-1.5", className)} {...props} />;
}
