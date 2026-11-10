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
          "flex h-9 w-full rounded-full border border-[#26262a] bg-[#131315] px-4 py-1.5 text-xs text-[#ffffff] placeholder:text-[#8c8b8f] focus-visible:outline-none focus-visible:border-[#47ab61] focus-visible:ring-1 focus-visible:ring-[#47ab61]/30 disabled:cursor-not-allowed disabled:opacity-40 transition-all",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";
