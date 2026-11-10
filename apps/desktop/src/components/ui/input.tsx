import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-8 w-full rounded-[3px] border border-[#1f1f1f] bg-[#070707] px-3 py-1 text-xs text-[#ffffff] font-mono placeholder:text-[#7a7a7a] focus-visible:outline-none focus-visible:border-[#4ade80] focus-visible:ring-1 focus-visible:ring-[#4ade80]/30 disabled:cursor-not-allowed disabled:opacity-40 transition-colors",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";
