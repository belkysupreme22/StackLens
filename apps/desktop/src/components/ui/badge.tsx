import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
        secondary:
          "border-transparent bg-neutral-800 text-neutral-300 border-neutral-700",
        success:
          "border-emerald-500/30 bg-emerald-500/15 text-emerald-400",
        warning:
          "border-amber-500/30 bg-amber-500/15 text-amber-400",
        destructive:
          "border-rose-500/30 bg-rose-500/15 text-rose-400",
        outline:
          "border-neutral-700 text-neutral-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
