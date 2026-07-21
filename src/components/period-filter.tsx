"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatDateInput } from "@/lib/date-utils";

export type PeriodValue = { from: Date | null; to: Date | null };

export function inPeriod(date: Date, period: PeriodValue) {
  if (period.from && date < period.from) return false;
  if (period.to && date > period.to) return false;
  return true;
}

type Preset = "year" | "q1" | "q2" | "q3" | "q4" | "custom";

function presetRange(year: number, preset: Exclude<Preset, "custom">): PeriodValue {
  const ranges: Record<Exclude<Preset, "custom">, [Date, Date]> = {
    year: [new Date(year, 0, 1), new Date(year, 11, 31, 23, 59, 59)],
    q1: [new Date(year, 0, 1), new Date(year, 2, 31, 23, 59, 59)],
    q2: [new Date(year, 3, 1), new Date(year, 5, 30, 23, 59, 59)],
    q3: [new Date(year, 6, 1), new Date(year, 8, 30, 23, 59, 59)],
    q4: [new Date(year, 9, 1), new Date(year, 11, 31, 23, 59, 59)],
  };
  const [from, to] = ranges[preset];
  return { from, to };
}

export function currentYearRange(): PeriodValue {
  return presetRange(new Date().getFullYear(), "year");
}

export function PeriodFilter({
  value,
  onChange,
}: {
  value: PeriodValue;
  onChange: (value: PeriodValue) => void;
}) {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(() => value.from?.getFullYear() ?? currentYear);
  const [preset, setPreset] = useState<Preset>("year");

  function selectPreset(nextYear: number, nextPreset: Exclude<Preset, "custom">) {
    setYear(nextYear);
    setPreset(nextPreset);
    onChange(presetRange(nextYear, nextPreset));
  }

  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - 3 + i);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={year}
        onChange={(e) => selectPreset(Number(e.target.value), preset === "custom" ? "year" : preset)}
        className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
      >
        {yearOptions.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>

      {(["year", "q1", "q2", "q3", "q4"] as const).map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => selectPreset(year, p)}
          className={cn(
            "rounded-full border px-3 py-1 text-sm font-medium transition-colors",
            preset === p
              ? "border-slate-700 bg-slate-700 text-white"
              : "border-slate-200 text-slate-600 hover:bg-slate-50",
          )}
        >
          {p === "year" ? "Año" : p.toUpperCase()}
        </button>
      ))}

      <span className="text-sm text-slate-500">Desde</span>
      <Input
        type="date"
        value={value.from ? formatDateInput(value.from) : ""}
        onChange={(e) => {
          setPreset("custom");
          onChange({ ...value, from: e.target.value ? new Date(`${e.target.value}T00:00:00`) : null });
        }}
        className="w-36"
      />
      <span className="text-sm text-slate-500">Hasta</span>
      <Input
        type="date"
        value={value.to ? formatDateInput(value.to) : ""}
        onChange={(e) => {
          setPreset("custom");
          onChange({ ...value, to: e.target.value ? new Date(`${e.target.value}T23:59:59`) : null });
        }}
        className="w-36"
      />
    </div>
  );
}
