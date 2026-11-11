import React, { useId, useMemo } from "react";
import * as d3 from "d3";

export interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  fillOpacity?: number;
  strokeWidth?: number;
  showPeak?: boolean;
  showCurrent?: boolean;
  curve?: "monotone" | "basis" | "linear" | "step";
  className?: string;
}

export function Sparkline({
  data,
  width = 120,
  height = 36,
  color = "#47ab61",
  fillOpacity = 0.15,
  strokeWidth = 1.75,
  showPeak = false,
  showCurrent = true,
  curve = "monotone",
  className = "",
}: SparklineProps) {
  const gradientId = useId();

  const { pathD, areaD, points, peakPoint, currentPoint } = useMemo(() => {
    if (!data || data.length === 0) {
      return { pathD: "", areaD: "", points: [], peakPoint: null, currentPoint: null };
    }

    const padTop = 4;
    const padBottom = 4;
    const padLeft = 2;
    const padRight = 4;

    const effectiveWidth = Math.max(width - padLeft - padRight, 10);
    const effectiveHeight = Math.max(height - padTop - padBottom, 10);

    const minVal = Math.min(...data);
    const maxVal = Math.max(...data);
    const range = maxVal - minVal;

    // Avoid zero division if flatline
    const yDomain = range === 0 ? [minVal - 1, maxVal + 1] : [minVal, maxVal];

    const xScale = d3
      .scaleLinear()
      .domain([0, Math.max(data.length - 1, 1)])
      .range([padLeft, padLeft + effectiveWidth]);

    const yScale = d3
      .scaleLinear()
      .domain(yDomain)
      .range([padTop + effectiveHeight, padTop]);

    const curveFactory =
      curve === "basis"
        ? d3.curveBasis
        : curve === "linear"
        ? d3.curveLinear
        : curve === "step"
        ? d3.curveStepAfter
        : d3.curveMonotoneX;

    const lineGenerator = d3
      .line<number>()
      .x((_, i) => xScale(i))
      .y((d) => yScale(d))
      .curve(curveFactory);

    const areaGenerator = d3
      .area<number>()
      .x((_, i) => xScale(i))
      .y0(padTop + effectiveHeight)
      .y1((d) => yScale(d))
      .curve(curveFactory);

    const pts = data.map((d, i) => ({
      x: xScale(i),
      y: yScale(d),
      val: d,
    }));

    const maxIndex = data.indexOf(maxVal);
    const peak = maxIndex !== -1 ? pts[maxIndex] : null;
    const current = pts.length > 0 ? pts[pts.length - 1] : null;

    return {
      pathD: lineGenerator(data) || "",
      areaD: areaGenerator(data) || "",
      points: pts,
      peakPoint: peak,
      currentPoint: current,
    };
  }, [data, width, height, curve]);

  if (!data || data.length === 0) {
    return <div className={`h-[${height}px] w-[${width}px] ${className}`} />;
  }

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={`overflow-visible select-none pointer-events-none ${className}`}
      style={{ width: "100%", height, maxWidth: width }}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={fillOpacity} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>

      {/* Area Gradient Fill */}
      {areaD && <path d={areaD} fill={`url(#${gradientId})`} />}

      {/* Sparkline Stroke */}
      {pathD && (
        <path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      {/* Optional Peak Value Indicator */}
      {showPeak && peakPoint && (
        <circle
          cx={peakPoint.x}
          cy={peakPoint.y}
          r={2}
          fill="#ffffff"
          stroke={color}
          strokeWidth={1.5}
        />
      )}

      {/* Current/Latest Data Point with Subtle Ping Glow */}
      {showCurrent && currentPoint && (
        <g>
          <circle
            cx={currentPoint.x}
            cy={currentPoint.y}
            r={3}
            fill={color}
            className="animate-pulse opacity-75"
          />
          <circle
            cx={currentPoint.x}
            cy={currentPoint.y}
            r={1.75}
            fill="#ffffff"
          />
        </g>
      )}
    </svg>
  );
}
