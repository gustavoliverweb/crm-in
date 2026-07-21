export type FunnelStage = { label: string; value: number; color: string };

export function FunnelChart({ stages }: { stages: FunnelStage[] }) {
  const max = Math.max(1, ...stages.map((s) => s.value));
  const first = stages[0]?.value ?? 0;

  return (
    <div className="space-y-3">
      {stages.map((stage, i) => {
        const widthPct = Math.max(4, (stage.value / max) * 100);
        const pctOfFirst = first > 0 ? (stage.value / first) * 100 : 0;
        return (
          <div key={stage.label}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="font-medium text-slate-700">{stage.label}</span>
              <span className="text-slate-500">
                {stage.value}
                {i > 0 ? (
                  <span className="ml-1 text-xs text-slate-400">({pctOfFirst.toFixed(0)}%)</span>
                ) : null}
              </span>
            </div>
            <div className="h-6 rounded-md bg-slate-100">
              <div
                className="h-6 rounded-md transition-all"
                style={{ width: `${widthPct}%`, backgroundColor: stage.color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
