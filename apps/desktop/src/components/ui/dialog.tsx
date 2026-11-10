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
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={() => onOpenChange(false)}
      />

      {/* Modal Dialog Content */}
      <div className="relative z-50 w-full max-w-lg rounded-xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3">
          {title && <h2 className="text-lg font-semibold text-neutral-100">{title}</h2>}
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-md p-1 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {description && (
          <p className="text-xs text-neutral-400 pb-4">{description}</p>
        )}

        <div>{children}</div>
      </div>
    </div>
  );
}
