"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatEUR } from "@/lib/money-utils";
import { PeriodFilter, currentYearRange, inPeriod, type PeriodValue } from "@/components/period-filter";
import { InformesNav } from "../informes-nav";

type Member = { userId: string; name: string };
type AppointmentRow = { professionalId: string | null; status: string; startsAt: Date };
type TaskRow = { assigneeId: string | null; completed: boolean; startsAt: Date };
type BudgetRow = { salespersonId: string | null; status: string; createdAt: Date; total: number };

export function RendimientoPersonalView({
  members,
  appointments,
  tasks,
  budgets,
}: {
  members: Member[];
  appointments: AppointmentRow[];
  tasks: TaskRow[];
  budgets: BudgetRow[];
}) {
  const [period, setPeriod] = useState<PeriodValue>(() => currentYearRange());
  const year = period.from?.getFullYear() ?? new Date().getFullYear();

  const rows = useMemo(() => {
    return members
      .map((member) => {
        const citasCompletadas = appointments.filter(
          (a) =>
            a.professionalId === member.userId &&
            a.status === "COMPLETADA" &&
            inPeriod(a.startsAt, period),
        ).length;

        const tareasCompletadas = tasks.filter(
          (t) => t.assigneeId === member.userId && t.completed && inPeriod(t.startsAt, period),
        ).length;

        const presupuestosGestionados = budgets.filter(
          (b) => b.salespersonId === member.userId && inPeriod(b.createdAt, period),
        ).length;

        const valorAceptado = budgets
          .filter(
            (b) =>
              b.salespersonId === member.userId &&
              b.status === "ACEPTADO" &&
              inPeriod(b.createdAt, period),
          )
          .reduce((sum, b) => sum + b.total, 0);

        return { ...member, citasCompletadas, tareasCompletadas, presupuestosGestionados, valorAceptado };
      })
      .sort((a, b) => b.valorAceptado - a.valorAceptado);
  }, [members, appointments, tasks, budgets, period]);

  const totals = rows.reduce(
    (acc, r) => ({
      citasCompletadas: acc.citasCompletadas + r.citasCompletadas,
      tareasCompletadas: acc.tareasCompletadas + r.tareasCompletadas,
      presupuestosGestionados: acc.presupuestosGestionados + r.presupuestosGestionados,
      valorAceptado: acc.valorAceptado + r.valorAceptado,
    }),
    { citasCompletadas: 0, tareasCompletadas: 0, presupuestosGestionados: 0, valorAceptado: 0 },
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
        Periodo: <span className="font-semibold text-slate-700">{year}</span>. Rendimiento por
        miembro del equipo.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Citas completadas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">{totals.citasCompletadas}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Tareas completadas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-slate-900">{totals.tareasCompletadas}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Presupuestos gestionados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-slate-900">{totals.presupuestosGestionados}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Valor aceptado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">{formatEUR(totals.valorAceptado)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Por miembro del equipo</CardTitle>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-sm text-slate-400">Sin miembros en la organización.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Miembro</TableHead>
                  <TableHead className="text-right">Citas completadas</TableHead>
                  <TableHead className="text-right">Tareas completadas</TableHead>
                  <TableHead className="text-right">Presupuestos gestionados</TableHead>
                  <TableHead className="text-right">Valor aceptado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.userId}>
                    <TableCell className="font-medium text-slate-900">{r.name}</TableCell>
                    <TableCell className="text-right">{r.citasCompletadas}</TableCell>
                    <TableCell className="text-right">{r.tareasCompletadas}</TableCell>
                    <TableCell className="text-right">{r.presupuestosGestionados}</TableCell>
                    <TableCell className="text-right font-medium text-slate-900">
                      {formatEUR(r.valorAceptado)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
