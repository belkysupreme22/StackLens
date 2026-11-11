import React, { useState, useMemo } from "react";
import * as d3 from "d3";

export interface FrameworkDonutItem {
  id: string;
  name: string;
  count: number;
  percentage: number;
  color: string;
  category?: string;
}

interface FrameworkDonutChartProps {
  data: FrameworkDonutItem[];
  total: number;
  hoveredId: string | null;
  onHover: (id: string | null) => void;
  size?: number;
}

export function FrameworkDonutChart({
  data,
  total,
  hoveredId,
  onHover,
  size = 220,
}: FrameworkDonutChartProps) {
  const [internalHover, setInternalHover] = useState<string | null>(null);
  const activeId = hoveredId ?? internalHover;

  const width = size;
  const height = size;
  const radius = Math.min(width, height) / 2;
  const innerRadius = radius * 0.64;
  const outerRadius = radius * 0.94;

  const activeItem = useMemo(() => {
    return data.find((d) => d.id === activeId) || null;
  }, [data, activeId]);

  const arcs = useMemo(() => {
    if (!data || data.length === 0) return [];

    const pie = d3
      .pie<FrameworkDonutItem>()
      .value((d) => Math.max(d.count, 1))
      .sort(null)
      .padAngle(0.035);

    const arcGenerator = d3
      .arc<d3.PieArcDatum<FrameworkDonutItem>>()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius)
      .cornerRadius(4);

    const hoveredArcGenerator = d3
      .arc<d3.PieArcDatum<FrameworkDonutItem>>()
      .innerRadius(innerRadius - 2)
      .outerRadius(outerRadius + 6)
      .cornerRadius(5);

    const pieData = pie(data);

    return pieData.map((d) => {
      const isHovered = d.data.id === activeId;
      const path = (isHovered ? hoveredArcGenerator(d) : arcGenerator(d)) || "";
      const centroid = arcGenerator.centroid(d);
      return {
        data: d.data,
        path,
        isHovered,
        centroid,
      };
    });
  }, [data, activeId, innerRadius, outerRadius]);

  if (!data || data.length === 0) {
    return (
      <div
        className="relative flex items-center justify-center mx-auto"
        style={{ width: size, height: size }}
      >
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius * 0.8}
            fill="none"
            stroke="#26262a"
            strokeWidth={16}
            strokeDasharray="4 6"
          />
        </svg>
        <div className="absolute text-center">
          <span className="text-[10px] text-[#8c8b8f] uppercase tracking-wider font-mono">No data</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex items-center justify-center select-none" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${width} ${height}`}
        className="overflow-visible"
      >
        <g transform={`translate(${width / 2}, ${height / 2})`}>
          {/* Subtle Ambient Track Glow */}
          <circle
            r={innerRadius - 4}
            fill="none"
            stroke="#26262a"
            strokeWidth={1}
            strokeDasharray="2 3"
            opacity={0.4}
          />

          {/* D3 Donut Slices */}
          {arcs.map((arc) => (
            <path
              key={arc.data.id}
              d={arc.path}
              fill={arc.data.color}
              opacity={activeId && !arc.isHovered ? 0.35 : 1}
              className="transition-all duration-200 cursor-pointer"
              style={{
                filter: arc.isHovered ? `drop-shadow(0 0 10px ${arc.data.color}80)` : undefined,
              }}
              onMouseEnter={() => {
                setInternalHover(arc.data.id);
                onHover(arc.data.id);
              }}
              onMouseLeave={() => {
                setInternalHover(null);
                onHover(null);
              }}
            />
          ))}
        </g>
      </svg>

      {/* Central Data Readout */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none transition-all duration-200"
        style={{ padding: `0 ${radius * 0.35}px` }}
      >
        {activeItem ? (
          <div className="text-center animate-in fade-in zoom-in-95 duration-150">
            <span
              className="text-[10px] font-mono uppercase tracking-wider font-semibold block truncate"
              style={{ color: activeItem.color }}
            >
              {activeItem.name}
            </span>
            <div className="text-xl font-bold font-mono text-[#ffffff] tabular-nums leading-tight mt-0.5">
              {activeItem.percentage}%
            </div>
            <span className="text-[10px] text-[#8c8b8f] font-mono">
              {activeItem.count} {activeItem.count === 1 ? "app" : "apps"}
            </span>
          </div>
        ) : (
          <div className="text-center">
            <span className="text-[9px] font-mono uppercase tracking-wider text-[#8c8b8f] block">
              Analyzed
            </span>
            <div className="text-2xl font-bold font-mono text-[#ffffff] tabular-nums leading-tight">
              {total}
            </div>
            <span className="text-[10px] text-[#47ab61] font-mono font-medium">
              100% catalog
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
