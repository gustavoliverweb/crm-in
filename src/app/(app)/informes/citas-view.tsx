"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PeriodFilter, currentYearRange, inPeriod, type PeriodValue } from "@/components/period-filter";
import { InformesNav } from "./informes-nav";
import { CitasChart, type MonthlyStatusPoint } from "./citas-chart";

export type AppointmentRow = {
  id: string;
  startsAt: Date;
  status: "PENDIENTE" | "CONFIRMADA" | "CANCELADA" | "COMPLETADA";
  clientName: string | null;
  serviceName: string | null;
  professionalName: string | null;
};

function topCounts(rows: AppointmentRow[], key: "serviceName" | "professionalName", fallback: string) {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const name = row[key] ?? fallback;
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
}

export function CitasView({ appointments }: { appointments: AppointmentRow[] }) {
  const [period, setPeriod] = useState<PeriodValue>(() => currentYearRange());

  const filtered = useMemo(
    () => appointments.filter((a) => inPeriod(a.startsAt, period)),
    [appointments, period],
  );

  const total = filtered.length;
  const completadas = filtered.filter((a) => a.status === "COMPLETADA").length;
  const canceladas = filtered.filter((a) => a.status === "CANCELADA").length;
  const resueltas = completadas + canceladas;
  const tasaAsistencia = resueltas > 0 ? (completadas / resueltas) * 100 : null;

  const year = period.from?.getFullYear() ?? new Date().getFullYear();

  const chartData: MonthlyStatusPoint[] = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, month) => ({
      month,
      completadas: 0,
      pendientes: 0,
      canceladas: 0,
    }));
    for (const a of appointments) {
      if (a.startsAt.getFullYear() !== year) continue;
      const point = months[a.startsAt.getMonth()];
      if (a.status === "COMPLETADA") point.completadas += 1;
      else if (a.status === "CANCELADA") point.canceladas += 1;
      else point.pendientes += 1;
    }
    return months;
  }, [appointments, year]);

  const topServicios = useMemo(() => topCounts(filtered, "serviceName", "Sin servicio"), [filtered]);
  const topProfesionales = useMemo(
    () => topCounts(filtered, "professionalName", "Sin asignar"),
    [filtered],
  );

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
        Periodo: <span className="font-semibold text-slate-700">{year}</span>. Citas registradas en
        Agenda.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total citas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-slate-900">{total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Completadas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">{completadas}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Canceladas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{canceladas}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Tasa de asistencia</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-slate-900">
              {tasaAsistencia === null ? "—" : `${tasaAsistencia.toFixed(0)}%`}
            </p>
            <p className="text-xs text-slate-400">Completadas / (Completadas + Canceladas)</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Citas por mes</CardTitle>
        </CardHeader>
        <CardContent>
          <CitasChart data={chartData} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Servicios más solicitados</CardTitle>
          </CardHeader>
          <CardContent>
            {topServicios.length === 0 ? (
              <p className="text-sm text-slate-400">Sin datos.</p>
            ) : (
              <ul className="space-y-2">
                {topServicios.map(([name, count]) => (
                  <li key={name} className="flex items-center justify-between text-sm">
                    <span className="text-slate-700">{name}</span>
                    <span className="font-medium text-slate-900">{count}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Profesionales con más citas</CardTitle>
          </CardHeader>
          <CardContent>
            {topProfesionales.length === 0 ? (
              <p className="text-sm text-slate-400">Sin datos.</p>
            ) : (
              <ul className="space-y-2">
                {topProfesionales.map(([name, count]) => (
                  <li key={name} className="flex items-center justify-between text-sm">
                    <span className="text-slate-700">{name}</span>
                    <span className="font-medium text-slate-900">{count}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
