import * as React from "react";
import { cn } from "@/lib/utils";

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
}

export function Progress({ value = 0, max = 100, className, ...props }: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div
      className={cn(
        "relative h-1.5 w-full overflow-hidden rounded-[2px] bg-[#1f1f1f]",
        className
      )}
      {...props}
    >
      <div
        className="h-full bg-[#4ade80] transition-all duration-150 ease-out"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
