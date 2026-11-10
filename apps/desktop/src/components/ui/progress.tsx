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
        "relative h-2 w-full overflow-hidden rounded-full bg-[#18181b] border border-[#26262a]/50",
        className
      )}
      {...props}
    >
      <div
        className="h-full bg-[#47ab61] rounded-full transition-all duration-150 ease-out"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
