import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-0.5 text-[11px] font-medium transition-colors select-none tracking-tight",
  {
    variants: {
      variant: {
        default:
          "border-[#47ab61]/40 bg-[#47ab61]/15 text-[#47ab61]",
        secondary:
          "border-[#26262a] bg-[#18181b] text-[#e7e6e7]",
        success:
          "border-[#47ab61]/40 bg-[#47ab61]/15 text-[#47ab61]",
        warning:
          "border-amber-400/30 bg-amber-400/10 text-amber-300",
        destructive:
          "border-rose-900/50 bg-rose-950/20 text-rose-400",
        outline:
          "border-[#26262a] text-[#8c8b8f] bg-transparent",
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
