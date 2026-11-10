import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-full text-xs font-medium tracking-tight transition-all duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#47ab61] disabled:pointer-events-none disabled:opacity-40 cursor-pointer select-none",
  {
    variants: {
      variant: {
        default:
          "bg-[#47ab61] text-[#0a0a0b] hover:bg-[#3b9352] active:bg-[#327e46] font-semibold shadow-sm",
        filled:
          "bg-[#ffffff] text-[#2f7a44] hover:bg-[#f2f2f2] font-semibold shadow-sm",
        destructive:
          "border border-rose-900/60 bg-[#131315] text-rose-400 hover:bg-rose-950/40 hover:border-rose-700",
        outline:
          "border border-[#26262a] bg-transparent text-[#ffffff] hover:bg-[#18181b] hover:border-[#333338]",
        secondary:
          "border border-[#26262a] bg-[#18181b] text-[#ffffff] hover:bg-[#1f1f23] hover:border-[#333338]",
        ghost:
          "text-[#e7e6e7] hover:bg-[#18181b] hover:text-[#ffffff]",
        link: "text-[#47ab61] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-1.5",
        sm: "h-7 px-3 text-[11px]",
        lg: "h-11 px-6 text-sm font-semibold",
        icon: "h-8 w-8 rounded-full",
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
