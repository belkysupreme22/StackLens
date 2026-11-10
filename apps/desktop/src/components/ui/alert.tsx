import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const alertVariants = cva(
  "relative w-full rounded-[16px] border p-4 text-xs [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-2px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4",
  {
    variants: {
      variant: {
        default: "bg-[#131315] border-[#26262a] text-[#ffffff]",
        destructive: "border-rose-900/50 bg-rose-950/20 text-rose-300 [&>svg]:text-rose-400",
        warning: "border-amber-900/50 bg-amber-950/20 text-amber-300 [&>svg]:text-amber-400",
        info: "border-[#47ab61]/30 bg-[#47ab61]/10 text-[#47ab61] [&>svg]:text-[#47ab61]",
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
