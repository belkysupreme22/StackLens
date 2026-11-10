import * as React from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
}

export function Dialog({ open, onOpenChange, title, description, children }: DialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#000000]/85 backdrop-blur-[2px] transition-opacity"
        onClick={() => onOpenChange(false)}
      />

      {/* Modal Dialog Content */}
      <div className="relative z-50 w-full max-w-lg rounded-[3px] border border-[#1f1f1f] bg-[#070707] p-5 shadow-[0px_18px_50px_0px_rgba(0,0,0,0.8)]">
        <div className="flex items-center justify-between pb-2 border-b border-[#1f1f1f]">
          {title && <h2 className="text-xs font-mono font-medium text-[#ffffff] uppercase tracking-wider">{title}</h2>}
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-[2px] p-1 text-[#7a7a7a] hover:bg-[#141414] hover:text-[#ffffff] transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {description && (
          <p className="text-[11px] text-[#7a7a7a] pt-3 pb-2">{description}</p>
        )}

        <div className="pt-2">{children}</div>
      </div>
    </div>
  );
}
