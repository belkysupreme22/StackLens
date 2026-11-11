import React, { useState, useMemo, useRef, useId } from "react";
import * as d3 from "d3";

export interface TimelineDataPoint {
  label: string;
  inspections: number;
  attributions: number;
  certainty: number;
}

interface InspectionAreaChartProps {
  data: TimelineDataPoint[];
  height?: number;
}

export function InspectionAreaChart({ data, height = 210 }: InspectionAreaChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const gradPrimaryId = useId();
  const gradSecondaryId = useId();

  const width = 640;
  const margin = { top: 16, right: 20, bottom: 30, left: 36 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const { xScale, yScale, primaryArea, primaryLine, secondaryArea, secondaryLine, points, yTicks } =
    useMemo(() => {
      if (!data || data.length === 0) {
        return {
          xScale: null,
          yScale: null,
          primaryArea: "",
          primaryLine: "",
          secondaryArea: "",
          secondaryLine: "",
          points: [],
          yTicks: [],
        };
      }

      const maxInspections = Math.max(...data.map((d) => d.inspections), 5);
      const yMax = Math.ceil(maxInspections * 1.15);

      const x = d3
        .scaleLinear()
        .domain([0, data.length - 1])
        .range([0, innerWidth]);

      const y = d3.scaleLinear().domain([0, yMax]).range([innerHeight, 0]);

      const pAreaGen = d3
        .area<TimelineDataPoint>()
        .x((_, i) => x(i))
        .y0(innerHeight)
        .y1((d) => y(d.inspections))
        .curve(d3.curveMonotoneX);

      const pLineGen = d3
        .line<TimelineDataPoint>()
        .x((_, i) => x(i))
        .y((d) => y(d.inspections))
        .curve(d3.curveMonotoneX);

      const sAreaGen = d3
        .area<TimelineDataPoint>()
        .x((_, i) => x(i))
        .y0(innerHeight)
        .y1((d) => y(d.attributions))
        .curve(d3.curveMonotoneX);

      const sLineGen = d3
        .line<TimelineDataPoint>()
        .x((_, i) => x(i))
        .y((d) => y(d.attributions))
        .curve(d3.curveMonotoneX);

      const pts = data.map((d, i) => ({
        x: x(i),
        yPrimary: y(d.inspections),
        ySecondary: y(d.attributions),
        data: d,
        index: i,
      }));

      const ticks = y.ticks(4);

      return {
        xScale: x,
        yScale: y,
        primaryArea: pAreaGen(data) || "",
        primaryLine: pLineGen(data) || "",
        secondaryArea: sAreaGen(data) || "",
        secondaryLine: sLineGen(data) || "",
        points: pts,
        yTicks: ticks,
      };
    }, [data, innerWidth, innerHeight]);

  const activePoint = hoveredIndex !== null && points[hoveredIndex] ? points[hoveredIndex] : null;

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!xScale || points.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * width;
    const chartX = svgX - margin.left;

    // Find nearest point
    let nearestIdx = 0;
    let minDist = Infinity;
    points.forEach((p, i) => {
      const dist = Math.abs(p.x - chartX);
      if (dist < minDist) {
        minDist = dist;
        nearestIdx = i;
      }
    });

    setHoveredIndex(nearestIdx);
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
  };

  if (!data || data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-xs text-[#8c8b8f] font-mono">
        No inspection trend data available
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full select-none">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto overflow-visible cursor-crosshair"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <defs>
          {/* Gradient Primary: StackLens Green */}
          <linearGradient id={gradPrimaryId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#47ab61" stopOpacity={0.28} />
            <stop offset="90%" stopColor="#47ab61" stopOpacity={0.01} />
            <stop offset="100%" stopColor="#47ab61" stopOpacity={0} />
          </linearGradient>

          {/* Gradient Secondary: Cyan */}
          <linearGradient id={gradSecondaryId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.2} />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity={0} />
          </linearGradient>
        </defs>

        <g transform={`translate(${margin.left}, ${margin.top})`}>
          {/* Horizontal Gridlines */}
          {yScale &&
            yTicks.map((tickVal) => {
              const yPos = yScale(tickVal);
              return (
                <g key={tickVal} className="opacity-40">
                  <line
                    x1={0}
                    x2={innerWidth}
                    y1={yPos}
                    y2={yPos}
                    stroke="#26262a"
                    strokeDasharray="3 3"
                  />
                  <text
                    x={-8}
                    y={yPos + 3}
                    textAnchor="end"
                    fill="#8c8b8f"
                    fontSize={10}
                    fontFamily="monospace"
                  >
                    {tickVal}
                  </text>
                </g>
              );
            })}

          {/* Secondary Series: Attributions Area & Line */}
          {secondaryArea && <path d={secondaryArea} fill={`url(#${gradSecondaryId})`} />}
          {secondaryLine && (
            <path
              d={secondaryLine}
              fill="none"
              stroke="#38bdf8"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              strokeLinecap="round"
            />
          )}

          {/* Primary Series: Total Inspections Area & Line */}
          {primaryArea && <path d={primaryArea} fill={`url(#${gradPrimaryId})`} />}
          {primaryLine && (
            <path
              d={primaryLine}
              fill="none"
              stroke="#47ab61"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* X Axis Labels */}
          {data.map((d, i) => {
            const xPos = xScale ? xScale(i) : 0;
            return (
              <text
                key={i}
                x={xPos}
                y={innerHeight + 18}
                textAnchor="middle"
                fill={hoveredIndex === i ? "#ffffff" : "#8c8b8f"}
                fontSize={10}
                fontFamily="monospace"
                className="transition-colors duration-150"
              >
                {d.label}
              </text>
            );
          })}

          {/* Interactive Guide Line and Pulse Dots */}
          {activePoint && (
            <g>
              {/* Vertical Crosshair Line */}
              <line
                x1={activePoint.x}
                x2={activePoint.x}
                y1={0}
                y2={innerHeight}
                stroke="#47ab61"
                strokeWidth={1}
                strokeDasharray="2 2"
                opacity={0.7}
              />

              {/* Primary Point Marker */}
              <circle
                cx={activePoint.x}
                cy={activePoint.yPrimary}
                r={5}
                fill="#47ab61"
                opacity={0.25}
                className="animate-ping"
              />
              <circle
                cx={activePoint.x}
                cy={activePoint.yPrimary}
                r={4}
                fill="#131315"
                stroke="#47ab61"
                strokeWidth={2}
              />
              <circle cx={activePoint.x} cy={activePoint.yPrimary} r={2} fill="#ffffff" />

              {/* Secondary Point Marker */}
              <circle
                cx={activePoint.x}
                cy={activePoint.ySecondary}
                r={3.5}
                fill="#131315"
                stroke="#38bdf8"
                strokeWidth={2}
              />
            </g>
          )}
        </g>
      </svg>

      {/* Floating Tooltip Card */}
      {activePoint && (
        <div
          className="absolute z-20 pointer-events-none p-2.5 rounded-[12px] bg-[#18181b]/95 backdrop-blur border border-[#26262a] shadow-xl text-xs space-y-1"
          style={{
            left: `${((activePoint.x + margin.left) / width) * 100}%`,
            top: "10%",
            transform: "translate(-50%, -100%)",
          }}
        >
          <div className="font-mono text-[10px] text-[#8c8b8f] border-b border-[#26262a] pb-1 font-medium">
            Timeline: {activePoint.data.label}
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-[#8c8b8f]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#47ab61]" />
              Inspections:
            </span>
            <span className="font-mono font-bold text-[#ffffff]">
              {activePoint.data.inspections}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-[#8c8b8f]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#38bdf8]" />
              Attributed:
            </span>
            <span className="font-mono font-bold text-[#ffffff]">
              {activePoint.data.attributions}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4 pt-0.5 border-t border-[#26262a]/60">
            <span className="text-[10px] text-[#8c8b8f]">Certainty:</span>
            <span className="font-mono text-[10px] text-[#47ab61] font-semibold">
              {activePoint.data.certainty}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
