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
        className="fixed inset-0 bg-[#0a0a0b]/80 backdrop-blur-sm transition-opacity"
        onClick={() => onOpenChange(false)}
      />

      {/* Modal Dialog Content */}
      <div className="relative z-50 w-full max-w-lg rounded-[20px] border border-[#26262a] bg-[#131315] p-6 shadow-[0px_20px_50px_rgba(0,0,0,0.7)]">
        <div className="flex items-center justify-between pb-3 border-b border-[#26262a]">
          {title && <h2 className="text-sm font-semibold text-[#ffffff] tracking-tight">{title}</h2>}
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-full p-1.5 text-[#8c8b8f] hover:bg-[#18181b] hover:text-[#ffffff] transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>

        {description && (
          <p className="text-xs text-[#8c8b8f] pt-3 pb-2 leading-relaxed">{description}</p>
        )}

        <div className="pt-3">{children}</div>
      </div>
    </div>
  );
}
