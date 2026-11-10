import React, { useEffect, useState } from "react";
import {
  CheckCircle2,
  Loader2,
  X,
  AlertCircle,
  Smartphone,
  Layers,
  FileCode,
  ShieldCheck,
  Binary,
} from "lucide-react";
import { useAppStore } from "@/stores/app-store";
import { Button } from "@/components/ui/button";
import { AppLogo } from "@/components/ui/app-logo";

const PIPELINE_STEPS = [
  { label: "Connect ADB bridge", desc: "Establishing secure shell transport to target device" },
  { label: "Resolve package path", desc: "Querying Android Package Manager for base.apk and splits" },
  { label: "Stream APK binary", desc: "Transferring APK payload over USB into local memory sandbox" },
  { label: "Parse manifest & bytecode", desc: "Decoding binary AXML tables and indexing classes.dex" },
  { label: "Analyze framework runtimes", desc: "Evaluating binary signatures, native symbols, and bytecode structures" },
  { label: "Synthesize intelligence", desc: "Weighing confidence scores and building evidence graph" },
];

export function FullscreenPullLoader() {
  const { pullProgress, setPullProgress } = useAppStore();
  const [elapsedSecs, setElapsedSecs] = useState(0);

  useEffect(() => {
    if (!pullProgress?.active) {
      setElapsedSecs(0);
      return;
    }
    const timer = setInterval(() => {
      setElapsedSecs((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [pullProgress?.active]);

  if (!pullProgress || !pullProgress.active) {
    return null;
  }

  const { appName, packageName, stage, stageLabel, details, error } = pullProgress;
  const currentStage = Math.min(Math.max(stage, 0), PIPELINE_STEPS.length - 1);
  const progressPercent = Math.min(Math.round(((currentStage + 0.5) / PIPELINE_STEPS.length) * 100), 98);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0a0b]/85 backdrop-blur-xl p-6 select-none animate-pop-in">
      {/* Background Ambient Radial Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#47ab61]/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Main Container */}
      <div className="relative w-full max-w-xl rounded-[24px] border border-[#26262a] bg-[#131315] p-8 shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_25px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden">
        {/* Subtle Top Accent Hairline */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#47ab61] to-transparent opacity-80" />

        {/* Close button on error */}
        {error && (
          <button
            onClick={() => setPullProgress(null)}
            className="absolute top-5 right-5 p-2 rounded-full text-[#8c8b8f] hover:text-[#ffffff] hover:bg-[#18181b] transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" strokeWidth={1.5} />
          </button>
        )}

        {/* Hero Header */}
        <div className="flex items-center gap-4 pb-6 border-b border-[#26262a]">
          <div className="relative shrink-0">
            <AppLogo
              packageName={packageName}
              appName={appName}
              initials={appName.slice(0, 2).toUpperCase()}
              size="lg"
            />
            {!error && (
              <span className="absolute -inset-1 rounded-[18px] border border-[#47ab61]/40 animate-ping opacity-30 pointer-events-none" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[#ffffff] tracking-tight truncate">
                {appName}
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-[#47ab61]/10 text-[10px] font-medium text-[#47ab61] border border-[#47ab61]/30">
                ADB Pull
              </span>
            </div>
            <p className="text-xs font-mono text-[#8c8b8f] truncate mt-0.5">
              {packageName}
            </p>
          </div>
          <div className="text-right text-xs font-mono text-[#8c8b8f] tabular-nums">
            {elapsedSecs}s elapsed
          </div>
        </div>

        {/* Dynamic Progress Bar */}
        <div className="py-6 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-[#ffffff] flex items-center gap-2">
              {!error ? (
                <Loader2 className="h-3.5 w-3.5 text-[#47ab61] animate-spin" strokeWidth={2} />
              ) : (
                <AlertCircle className="h-3.5 w-3.5 text-rose-400" strokeWidth={2} />
              )}
              {error ? "Analysis interrupted" : stageLabel}
            </span>
            <span className="font-mono text-[#8c8b8f] tabular-nums">
              {error ? "Failed" : `${progressPercent}%`}
            </span>
          </div>

          <div className="relative h-2 w-full overflow-hidden rounded-full bg-[#18181b] border border-[#26262a]/60">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                error ? "bg-rose-500" : "bg-[#47ab61] ios-shimmer"
              }`}
              style={{ width: `${error ? 100 : progressPercent}%` }}
            />
          </div>
          <p className="text-[11px] text-[#8c8b8f] truncate pt-0.5">
            {error || details}
          </p>
        </div>

        {/* Multi-Step Pipeline Visualizer */}
        <div className="space-y-2 pt-2 border-t border-[#26262a]">
          {PIPELINE_STEPS.map((step, idx) => {
            const isCompleted = idx < currentStage && !error;
            const isCurrent = idx === currentStage && !error;
            const isPending = idx > currentStage || !!error;

            return (
              <div
                key={step.label}
                className={`flex items-center gap-3 p-2.5 rounded-[14px] transition-all ${
                  isCurrent
                    ? "bg-[#18181b] border border-[#26262a] text-[#ffffff]"
                    : "text-[#8c8b8f] opacity-80"
                }`}
              >
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                  {isCompleted ? (
                    <CheckCircle2 className="h-4 w-4 text-[#47ab61]" strokeWidth={2} />
                  ) : isCurrent ? (
                    <Loader2 className="h-4 w-4 text-[#47ab61] animate-spin" strokeWidth={2} />
                  ) : (
                    <span className="h-2 w-2 rounded-full bg-[#26262a]" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate">
                    {step.label}
                  </div>
                  {isCurrent && (
                    <div className="text-[11px] text-[#8c8b8f] truncate mt-0.5">
                      {step.desc}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Error Action */}
        {error && (
          <div className="mt-5 pt-4 border-t border-rose-900/30 flex justify-end">
            <Button
              variant="outline"
              onClick={() => setPullProgress(null)}
              className="rounded-full px-5 text-xs text-[#ffffff]"
            >
              Dismiss
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
