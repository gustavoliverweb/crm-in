"use client";

import { useState } from "react";
import { formatEUR } from "@/lib/money-utils";

const MONTH_LABELS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

export type MonthlyValuePoint = { month: number; value: number };

export function MonthlyBarChart({
  data,
  color,
  label,
}: {
  data: MonthlyValuePoint[];
  color: string;
  label: string;
}) {
  const [hovered, setHovered] = useState<number | null>(null);

  const width = 840;
  const height = 260;
  const paddingLeft = 48;
  const paddingBottom = 24;
  const paddingTop = 12;
  const plotWidth = width - paddingLeft - 8;
  const plotHeight = height - paddingBottom - paddingTop;

  const maxValue = Math.max(1, ...data.map((d) => d.value));
  const niceMax = Math.ceil(maxValue / 5) * 5 || 5;

  const groupWidth = plotWidth / data.length;
  const barWidth = Math.min(28, groupWidth * 0.5);

  function y(value: number) {
    return paddingTop + plotHeight - (value / niceMax) * plotHeight;
  }

  const gridLines = Array.from({ length: 5 }, (_, i) => (niceMax / 4) * i);

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label={label}>
        {gridLines.map((v) => (
          <g key={v}>
            <line x1={paddingLeft} x2={width} y1={y(v)} y2={y(v)} stroke="#e1e0d9" strokeWidth={1} />
            <text x={paddingLeft - 8} y={y(v) + 3} textAnchor="end" fontSize="10" fill="#898781">
              {v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v.toFixed(0)}
            </text>
          </g>
        ))}
        <line x1={paddingLeft} x2={width} y1={y(0)} y2={y(0)} stroke="#c3c2b7" strokeWidth={1} />

        {data.map((d, i) => {
          const groupX = paddingLeft + i * groupWidth;
          const centerX = groupX + groupWidth / 2;
          const barX = centerX - barWidth / 2;
          const isHovered = hovered === i;

          return (
            <g
              key={d.month}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              className="cursor-pointer"
            >
              <rect x={groupX} y={paddingTop} width={groupWidth} height={plotHeight} fill="transparent" />
              <rect
                x={barX}
                y={y(d.value)}
                width={barWidth}
                height={Math.max(0, y(0) - y(d.value))}
                rx={3}
                fill={color}
                opacity={isHovered ? 1 : 0.9}
              />
              <text x={centerX} y={height - 6} textAnchor="middle" fontSize="10" fill="#898781">
                {MONTH_LABELS[d.month]}
              </text>
            </g>
          );
        })}
      </svg>

      {hovered !== null ? (
        <div
          className="pointer-events-none absolute top-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-md"
          style={{ left: `${((hovered + 0.5) / data.length) * 100}%`, transform: "translateX(-50%)" }}
        >
          <p className="mb-1 font-semibold text-slate-700">{MONTH_LABELS[data[hovered].month]}</p>
          <p className="flex items-center gap-1.5 text-slate-600">
            <span className="inline-block size-2 rounded-full" style={{ backgroundColor: color }} />
            {label} {formatEUR(data[hovered].value)}
          </p>
        </div>
      ) : null}
    </div>
  );
}
