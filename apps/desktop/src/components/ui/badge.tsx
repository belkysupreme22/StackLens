import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const badgeVariants = cva(
  "inline-flex items-center rounded-[3px] border px-2 py-0.5 text-[10px] font-mono font-medium transition-colors select-none",
  {
    variants: {
      variant: {
        default:
          "border-[#4ade80]/40 bg-[#4ade80]/10 text-[#4ade80]",
        secondary:
          "border-[#1f1f1f] bg-[#0e0e0e] text-[#7a7a7a]",
        success:
          "border-[#4ade80]/40 bg-[#4ade80]/10 text-[#4ade80]",
        warning:
          "border-amber-400/30 bg-amber-400/10 text-amber-300",
        destructive:
          "border-rose-900/50 bg-rose-950/20 text-rose-400",
        outline:
          "border-[#1f1f1f] text-[#7a7a7a] bg-transparent",
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
