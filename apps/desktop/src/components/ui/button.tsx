import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-[3px] text-xs font-mono font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#4ade80] disabled:pointer-events-none disabled:opacity-40 cursor-pointer select-none",
  {
    variants: {
      variant: {
        default:
          "bg-[#4ade80] text-[#000000] hover:bg-[#22c55e] active:bg-[#16a34a] font-semibold",
        destructive:
          "border border-rose-900/60 bg-[#070707] text-rose-400 hover:bg-rose-950/40 hover:border-rose-700",
        outline:
          "border border-[#1f1f1f] bg-[#070707] text-[#ffffff] hover:bg-[#141414] hover:border-[#2e2e2e]",
        secondary:
          "border border-[#1f1f1f] bg-[#0e0e0e] text-[#ffffff] hover:bg-[#161616]",
        ghost:
          "text-[#7a7a7a] hover:bg-[#141414] hover:text-[#ffffff]",
        link: "text-[#4ade80] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-8 px-3 py-1",
        sm: "h-7 px-2.5 text-[11px]",
        lg: "h-9 px-4 text-xs",
        icon: "h-8 w-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
