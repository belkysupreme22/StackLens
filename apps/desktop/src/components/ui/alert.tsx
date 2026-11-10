import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const alertVariants = cva(
  "relative w-full rounded-[3px] border p-3 text-xs [&>svg~*]:pl-6 [&>svg+div]:translate-y-[-2px] [&>svg]:absolute [&>svg]:left-3 [&>svg]:top-3",
  {
    variants: {
      variant: {
        default: "bg-[#070707] border-[#1f1f1f] text-[#ffffff]",
        destructive: "border-rose-900/50 bg-rose-950/20 text-rose-300 [&>svg]:text-rose-400",
        warning: "border-amber-900/50 bg-amber-950/20 text-amber-300 [&>svg]:text-amber-400",
        info: "border-[#4ade80]/30 bg-[#4ade80]/5 text-[#4ade80] [&>svg]:text-[#4ade80]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {}

export function Alert({ className, variant, ...props }: AlertProps) {
  return (
    <div
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  );
}

export function AlertTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h5
      className={cn("mb-0.5 font-medium leading-none tracking-tight text-xs", className)}
      {...props}
    />
  );
}

export function AlertDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <div
      className={cn("text-[11px] text-[#7a7a7a] leading-relaxed", className)}
      {...props}
    />
  );
}
