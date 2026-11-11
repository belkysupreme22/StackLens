import React, { useMemo, useState } from "react";
import * as d3 from "d3";

export interface HealthMetric {
  id: string;
  label: string;
  percentage: number;
  color: string;
  description: string;
  target: string;
}

interface BinaryHealthRingsProps {
  metrics?: HealthMetric[];
  size?: number;
}

export function BinaryHealthRings({
  metrics = [
    {
      id: "alignment",
      label: "16 KB Page Alignment",
      percentage: 88,
      color: "#47ab61",
      description: "Native .so ELF binaries aligned for 16 KB pages",
      target: "Android 15+",
    },
    {
      id: "abi",
      label: "64-bit ABI Coverage",
      percentage: 96,
      color: "#38bdf8",
      description: "Modern arm64-v8a architecture binaries",
      target: "Universal",
    },
    {
      id: "hardening",
      label: "DEX Bytecode Protection",
      percentage: 92,
      color: "#a78bfa",
      description: "R8/ProGuard obfuscation & stripped debug symbols",
      target: "Hardened",
    },
  ],
  size = 200,
}: BinaryHealthRingsProps) {
  const [hoveredMetricId, setHoveredMetricId] = useState<string | null>(null);

  const activeMetric = useMemo(() => {
    return metrics.find((m) => m.id === hoveredMetricId) || null;
  }, [metrics, hoveredMetricId]);

  const ringConfigs = [
    { inner: 80, outer: 92 },
    { inner: 64, outer: 76 },
    { inner: 48, outer: 60 },
  ];

  const overallScore = Math.round(
    metrics.reduce((acc, m) => acc + m.percentage, 0) / metrics.length
  );

  const ringPaths = useMemo(() => {
    return metrics.slice(0, 3).map((m, idx) => {
      const cfg = ringConfigs[idx];
      const startAngle = 0;
      const endAngle = (m.percentage / 100) * 2 * Math.PI;

      const trackArc = d3
        .arc()
        .innerRadius(cfg.inner)
        .outerRadius(cfg.outer)
        .startAngle(0)
        .endAngle(2 * Math.PI)
        .cornerRadius(6);

      const fillArc = d3
        .arc()
        .innerRadius(cfg.inner)
        .outerRadius(cfg.outer)
        .startAngle(startAngle)
        .endAngle(endAngle)
        .cornerRadius(6);

      return {
        metric: m,
        trackPath: trackArc(null as any) || "",
        fillPath: fillArc(null as any) || "",
        isHovered: hoveredMetricId === m.id,
      };
    });
  }, [metrics, hoveredMetricId]);

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      {/* Concentric D3 Rings */}
      <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible select-none">
          <g transform={`translate(${size / 2}, ${size / 2})`}>
            {ringPaths.map((ring) => (
              <g
                key={ring.metric.id}
                className="cursor-pointer transition-opacity duration-200"
                opacity={hoveredMetricId && !ring.isHovered ? 0.35 : 1}
                onMouseEnter={() => setHoveredMetricId(ring.metric.id)}
                onMouseLeave={() => setHoveredMetricId(null)}
              >
                {/* Background Track */}
                <path d={ring.trackPath} fill="#18181b" stroke="#26262a" strokeWidth={0.5} />

                {/* Filled Value Arc */}
                <path
                  d={ring.fillPath}
                  fill={ring.metric.color}
                  style={{
                    filter: ring.isHovered
                      ? `drop-shadow(0 0 8px ${ring.metric.color}80)`
                      : undefined,
                  }}
                />
              </g>
            ))}
          </g>
        </svg>

        {/* Central Readout */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          {activeMetric ? (
            <div className="text-center animate-in fade-in zoom-in-95 duration-150">
              <span
                className="text-[10px] font-mono uppercase tracking-wider font-semibold block"
                style={{ color: activeMetric.color }}
              >
                {activeMetric.percentage}%
              </span>
              <span className="text-[10px] text-[#ffffff] font-medium block truncate max-w-[90px]">
                {activeMetric.label.split(" ")[0]}
              </span>
            </div>
          ) : (
            <div className="text-center">
              <span className="text-[9px] font-mono uppercase tracking-wider text-[#8c8b8f] block">
                Health Index
              </span>
              <div className="text-2xl font-bold font-mono text-[#ffffff] tabular-nums leading-tight">
                {overallScore}%
              </div>
              <span className="text-[10px] text-[#47ab61] font-mono">Compliant</span>
            </div>
          )}
        </div>
      </div>

      {/* Metrics Legend List */}
      <div className="flex-1 w-full space-y-3">
        {metrics.map((m) => (
          <div
            key={m.id}
            onMouseEnter={() => setHoveredMetricId(m.id)}
            onMouseLeave={() => setHoveredMetricId(null)}
            className={`p-2.5 rounded-[12px] border transition-all cursor-pointer ${
              hoveredMetricId === m.id
                ? "bg-[#18181b] border-[#47ab61]/40 shadow-sm"
                : "bg-[#18181b]/40 border-[#26262a] hover:border-[#333338]"
            }`}
          >
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: m.color }}
                />
                <span className="font-semibold text-[#ffffff] tracking-tight">{m.label}</span>
              </div>
              <div className="flex items-center gap-2 font-mono">
                <span className="text-[10px] text-[#8c8b8f]">{m.target}</span>
                <span className="font-bold text-xs" style={{ color: m.color }}>
                  {m.percentage}%
                </span>
              </div>
            </div>
            <p className="text-[10px] text-[#8c8b8f] mt-1 pl-4">{m.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
