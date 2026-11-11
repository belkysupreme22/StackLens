import React, { useState, useMemo } from "react";
import { formatBytes } from "@/lib/utils";

interface CompositionSegment {
  id: string;
  label: string;
  bytes: number;
  color: string;
  description: string;
}

interface ApkCompositionBarProps {
  nativeBytes: number;
  dexBytes: number;
  totalApkBytes: number;
  resourceCount?: number;
  assetCount?: number;
}

export function ApkCompositionBar({
  nativeBytes,
  dexBytes,
  totalApkBytes,
  resourceCount = 0,
  assetCount = 0,
}: ApkCompositionBarProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const { segments, accountedBytes } = useMemo(() => {
    const knownBytes = nativeBytes + dexBytes;
    const remainingBytes = Math.max(0, totalApkBytes - knownBytes);

    // Approximate breakdown of remaining package content: assets vs resources/metadata
    const estAssetBytes = Math.round(remainingBytes * 0.65);
    const estResourceBytes = Math.max(0, remainingBytes - estAssetBytes);

    const segs: CompositionSegment[] = [
      {
        id: "native",
        label: "Native Binaries (.so)",
        bytes: nativeBytes,
        color: "#47ab61",
        description: "Compiled C/C++, Rust, and JNI runtime shared objects",
      },
      {
        id: "dex",
        label: "DEX Bytecode",
        bytes: dexBytes,
        color: "#38bdf8",
        description: "Compiled Dalvik/ART classes and app bytecode",
      },
      {
        id: "assets",
        label: "Assets & Bundles",
        bytes: estAssetBytes,
        color: "#fbbf24",
        description: `${assetCount} embedded asset files and JS/Dart runtime bundles`,
      },
      {
        id: "resources",
        label: "Resources & Manifest",
        bytes: estResourceBytes,
        color: "#a78bfa",
        description: `${resourceCount} table entries, compiled AXML, and signatures`,
      },
    ].filter((s) => s.bytes > 0);

    return { segments: segs, accountedBytes: totalApkBytes };
  }, [nativeBytes, dexBytes, totalApkBytes, resourceCount, assetCount]);

  const activeSegment = segments.find((s) => s.id === hoveredId) || null;

  return (
    <div className="space-y-3">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-[#ffffff] tracking-tight">Package Storage Composition</span>
          <span className="text-[10px] text-[#8c8b8f] font-mono">
            {formatBytes(totalApkBytes)} total
          </span>
        </div>
        {activeSegment ? (
          <span className="font-mono text-[11px] font-semibold" style={{ color: activeSegment.color }}>
            {activeSegment.label}: {formatBytes(activeSegment.bytes)} (
            {Math.round((activeSegment.bytes / Math.max(accountedBytes, 1)) * 100)}%)
          </span>
        ) : (
          <span className="text-[11px] text-[#8c8b8f] font-mono">
            Hover segment to inspect layer size
          </span>
        )}
      </div>

      {/* Proportional Stacked Spectrum Bar */}
      <div className="h-3 w-full rounded-full bg-[#18181b] border border-[#26262a] p-0.5 flex overflow-hidden">
        {segments.map((seg) => {
          const pct = Math.max(Math.round((seg.bytes / Math.max(accountedBytes, 1)) * 100), 2);
          const isHovered = hoveredId === seg.id;

          return (
            <div
              key={seg.id}
              className="h-full first:rounded-l-full last:rounded-r-full transition-all duration-300 relative cursor-pointer"
              style={{
                width: `${pct}%`,
                backgroundColor: seg.color,
                opacity: hoveredId && !isHovered ? 0.35 : 1,
                boxShadow: isHovered ? `0 0 10px ${seg.color}` : undefined,
              }}
              onMouseEnter={() => setHoveredId(seg.id)}
              onMouseLeave={() => setHoveredId(null)}
              title={`${seg.label}: ${formatBytes(seg.bytes)} (${pct}%)`}
            />
          );
        })}
      </div>

      {/* Segment Legend Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
        {segments.map((seg) => {
          const pct = Math.round((seg.bytes / Math.max(accountedBytes, 1)) * 100);
          const isHovered = hoveredId === seg.id;

          return (
            <div
              key={seg.id}
              onMouseEnter={() => setHoveredId(seg.id)}
              onMouseLeave={() => setHoveredId(null)}
              className={`p-2 rounded-[12px] border transition-all cursor-pointer ${
                isHovered
                  ? "bg-[#18181b] border-[#47ab61]/50 shadow-sm"
                  : "bg-[#18181b]/30 border-[#26262a] hover:border-[#333338]"
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
                <span className="text-[11px] font-semibold text-[#ffffff] truncate">{seg.label.split(" ")[0]}</span>
              </div>
              <div className="flex items-baseline justify-between mt-1 text-xs font-mono">
                <span className="text-[10px] text-[#8c8b8f]">{formatBytes(seg.bytes)}</span>
                <span className="font-bold text-[#ffffff]">{pct}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
