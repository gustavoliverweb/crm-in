"use client";

import { useState } from "react";

const MONTH_LABELS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

export type MonthlyStatusPoint = {
  month: number;
  completadas: number;
  pendientes: number;
  canceladas: number;
};

const COMPLETADAS_COLOR = "#059669";
const PENDIENTES_COLOR = "#2a78d6";
const CANCELADAS_COLOR = "#ef4444";
const SEGMENT_GAP = 2;

export function CitasChart({ data }: { data: MonthlyStatusPoint[] }) {
  const [hovered, setHovered] = useState<number | null>(null);

  const width = 840;
  const height = 260;
  const paddingLeft = 32;
  const paddingBottom = 24;
  const paddingTop = 12;
  const plotWidth = width - paddingLeft - 8;
  const plotHeight = height - paddingBottom - paddingTop;

  const totals = data.map((d) => d.completadas + d.pendientes + d.canceladas);
  const maxValue = Math.max(1, ...totals);
  const niceMax = Math.ceil(maxValue / 5) * 5 || 5;

  const groupWidth = plotWidth / data.length;
  const barWidth = Math.min(28, groupWidth * 0.5);

  function y(value: number) {
    return paddingTop + plotHeight - (value / niceMax) * plotHeight;
  }

  const gridLines = Array.from({ length: 5 }, (_, i) => Math.round((niceMax / 4) * i));

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label="Citas por mes y estado">
        {gridLines.map((v) => (
          <g key={v}>
            <line x1={paddingLeft} x2={width} y1={y(v)} y2={y(v)} stroke="#e1e0d9" strokeWidth={1} />
            <text x={paddingLeft - 8} y={y(v) + 3} textAnchor="end" fontSize="10" fill="#898781">
              {v}
            </text>
          </g>
        ))}
        <line x1={paddingLeft} x2={width} y1={y(0)} y2={y(0)} stroke="#c3c2b7" strokeWidth={1} />

        {data.map((d, i) => {
          const groupX = paddingLeft + i * groupWidth;
          const centerX = groupX + groupWidth / 2;
          const barX = centerX - barWidth / 2;
          const isHovered = hovered === i;

          const stackSegments = [
            { key: "completadas", value: d.completadas, color: COMPLETADAS_COLOR },
            { key: "pendientes", value: d.pendientes, color: PENDIENTES_COLOR },
            { key: "canceladas", value: d.canceladas, color: CANCELADAS_COLOR },
          ].filter((s) => s.value > 0);

          let cumulative = 0;
          const rects = stackSegments.map((seg, si) => {
            const segBottom = cumulative;
            const segTop = cumulative + seg.value;
            cumulative = segTop;
            const isLast = si === stackSegments.length - 1;
            const gapAdjust = isLast ? 0 : SEGMENT_GAP;
            const yTopPx = y(segTop) + gapAdjust;
            const yBottomPx = y(segBottom);
            return { ...seg, y: yTopPx, height: Math.max(0, yBottomPx - yTopPx) };
          });

          return (
            <g
              key={d.month}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              className="cursor-pointer"
            >
              <rect x={groupX} y={paddingTop} width={groupWidth} height={plotHeight} fill="transparent" />
              {rects.map((r) => (
                <rect
                  key={r.key}
                  x={barX}
                  y={r.y}
                  width={barWidth}
                  height={r.height}
                  rx={2}
                  fill={r.color}
                  opacity={isHovered ? 1 : 0.9}
                />
              ))}
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
            <span className="inline-block size-2 rounded-full" style={{ backgroundColor: COMPLETADAS_COLOR }} />
            Completadas {data[hovered].completadas}
          </p>
          <p className="flex items-center gap-1.5 text-slate-600">
            <span className="inline-block size-2 rounded-full" style={{ backgroundColor: PENDIENTES_COLOR }} />
            Pendientes/Confirmadas {data[hovered].pendientes}
          </p>
          <p className="flex items-center gap-1.5 text-slate-600">
            <span className="inline-block size-2 rounded-full" style={{ backgroundColor: CANCELADAS_COLOR }} />
            Canceladas {data[hovered].canceladas}
          </p>
        </div>
      ) : null}

      <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-2.5 rounded-full" style={{ backgroundColor: COMPLETADAS_COLOR }} />
          Completadas
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-2.5 rounded-full" style={{ backgroundColor: PENDIENTES_COLOR }} />
          Pendientes/Confirmadas
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-2.5 rounded-full" style={{ backgroundColor: CANCELADAS_COLOR }} />
          Canceladas
        </span>
      </div>
    </div>
  );
}
