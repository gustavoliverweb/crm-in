"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatEUR } from "@/lib/money-utils";
import { PeriodFilter, currentYearRange, inPeriod, type PeriodValue } from "@/components/period-filter";
import { InformesNav } from "../informes-nav";
import { MonthlyBarChart, type MonthlyValuePoint } from "../monthly-bar-chart";

export type BudgetRow = {
  id: string;
  clientName: string | null;
  createdAt: Date;
  status: "BORRADOR" | "ENVIADO" | "ACEPTADO" | "RECHAZADO" | "CADUCADO";
  total: number;
};

const CHART_COLOR = "#2a78d6";

export function PresupuestosView({ budgets }: { budgets: BudgetRow[] }) {
  const [period, setPeriod] = useState<PeriodValue>(() => currentYearRange());
  const year = period.from?.getFullYear() ?? new Date().getFullYear();

  const numbered = useMemo(() => budgets.filter((b) => b.status !== "BORRADOR"), [budgets]);

  const filtered = useMemo(
    () => numbered.filter((b) => inPeriod(b.createdAt, period)),
    [numbered, period],
  );

  const totalPresupuestado = filtered.reduce((sum, b) => sum + b.total, 0);
  const aceptados = filtered.filter((b) => b.status === "ACEPTADO");
  const rechazados = filtered.filter((b) => b.status === "RECHAZADO");
  const valorAceptado = aceptados.reduce((sum, b) => sum + b.total, 0);
  const valorRechazado = rechazados.reduce((sum, b) => sum + b.total, 0);
  const resueltos = aceptados.length + rechazados.length;
  const tasaConversion = resueltos > 0 ? (aceptados.length / resueltos) * 100 : null;
  const valorMedio = filtered.length > 0 ? totalPresupuestado / filtered.length : 0;

  const chartData: MonthlyValuePoint[] = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, month) => ({ month, value: 0 }));
    for (const b of numbered) {
      if (b.createdAt.getFullYear() !== year) continue;
      months[b.createdAt.getMonth()].value += b.total;
    }
    return months;
  }, [numbered, year]);

  const topClients = useMemo(() => {
    const totals = new Map<string, number>();
    for (const b of filtered) {
      const name = b.clientName ?? "Sin cliente";
      totals.set(name, (totals.get(name) ?? 0) + b.total);
    }
    return Array.from(totals.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [filtered]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Informes</h1>
          <div className="mt-2">
            <InformesNav />
          </div>
        </div>
        <PeriodFilter value={period} onChange={setPeriod} />
      </div>

      <p className="text-sm text-slate-500">
        Periodo: <span className="font-semibold text-slate-700">{year}</span>. Excluye borradores sin
        enviar.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Presupuestado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-slate-900">{formatEUR(totalPresupuestado)}</p>
            <p className="text-xs text-slate-400">{filtered.length} presupuestos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Aceptados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">{formatEUR(valorAceptado)}</p>
            <p className="text-xs text-slate-400">{aceptados.length} presupuestos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Rechazados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{formatEUR(valorRechazado)}</p>
            <p className="text-xs text-slate-400">{rechazados.length} presupuestos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Tasa de conversión</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-slate-900">
              {tasaConversion === null ? "—" : `${tasaConversion.toFixed(0)}%`}
            </p>
            <p className="text-xs text-slate-400">Aceptados / (Aceptados + Rechazados)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Valor medio</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-slate-900">{formatEUR(valorMedio)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Presupuestado por mes</CardTitle>
        </CardHeader>
        <CardContent>
          <MonthlyBarChart data={chartData} color={CHART_COLOR} label="Presupuestado" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top clientes (valor presupuestado)</CardTitle>
        </CardHeader>
        <CardContent>
          {topClients.length === 0 ? (
            <p className="text-sm text-slate-400">Sin datos.</p>
          ) : (
            <ul className="space-y-2">
              {topClients.map(([name, total]) => (
                <li key={name} className="flex items-center justify-between text-sm">
                  <span className="text-slate-700">{name}</span>
                  <span className="font-medium text-slate-900">{formatEUR(total)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
