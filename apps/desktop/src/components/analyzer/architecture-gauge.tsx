import React, { useMemo } from "react";
import * as d3 from "d3";

interface ArchitectureGaugeProps {
  score: number; // 0 to 1
  confidence: string;
  size?: number;
  color?: string;
}

export function ArchitectureGauge({
  score,
  confidence,
  size = 110,
  color = "#47ab61",
}: ArchitectureGaugeProps) {
  const percentage = Math.min(Math.max(Math.round(score * 100), 0), 100);

  const { trackPath, valuePath } = useMemo(() => {
    const radius = size / 2;
    const strokeWidth = 8;
    const innerRadius = radius - strokeWidth;
    const outerRadius = radius;

    // 240 degree gauge arc (-120 deg to +120 deg)
    const startAngle = -((2 * Math.PI) / 3);
    const totalAngle = (4 * Math.PI) / 3;
    const endAngle = startAngle + totalAngle;
    const valueEndAngle = startAngle + totalAngle * (percentage / 100);

    const trackArc = d3
      .arc()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius)
      .startAngle(startAngle)
      .endAngle(endAngle)
      .cornerRadius(4);

    const valueArc = d3
      .arc()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius)
      .startAngle(startAngle)
      .endAngle(valueEndAngle)
      .cornerRadius(4);

    return {
      trackPath: trackArc(null as any) || "",
      valuePath: valueArc(null as any) || "",
    };
  }, [percentage, size]);

  return (
    <div className="relative flex items-center justify-center select-none" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
        <g transform={`translate(${size / 2}, ${size / 2})`}>
          {/* Background Track */}
          <path d={trackPath} fill="#18181b" stroke="#26262a" strokeWidth={0.5} />

          {/* Value Arc */}
          <path
            d={valuePath}
            fill={color}
            style={{
              filter: `drop-shadow(0 0 6px ${color}60)`,
            }}
          />
        </g>
      </svg>

      {/* Central Value */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pt-1">
        <span className="text-xl font-bold font-mono text-[#ffffff] tabular-nums leading-none">
          {percentage}%
        </span>
        <span
          className="text-[9px] font-mono uppercase tracking-wider font-semibold mt-1"
          style={{ color }}
        >
          {confidence}
        </span>
      </div>
    </div>
  );
}
