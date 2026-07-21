"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatEUR } from "@/lib/money-utils";
import { PeriodFilter, currentYearRange, inPeriod, type PeriodValue } from "@/components/period-filter";
import { InformesNav } from "../informes-nav";
import { MonthlyBarChart, type MonthlyValuePoint } from "../monthly-bar-chart";
import { FunnelChart } from "./funnel-chart";

type ClientRow = { createdAt: Date };
type BudgetRow = {
  createdAt: Date;
  status: "BORRADOR" | "ENVIADO" | "ACEPTADO" | "RECHAZADO" | "CADUCADO";
  hasInvoice: boolean;
};
type InvoiceRow = { createdAt: Date; total: number };

const REVENUE_COLOR = "#059669";
const FUNNEL_COLORS = ["#86b6ef", "#5598e7", "#2a78d6", "#184f95"];

export function RendimientoComercialView({
  clients,
  budgets,
  invoices,
}: {
  clients: ClientRow[];
  budgets: BudgetRow[];
  invoices: InvoiceRow[];
}) {
  const [period, setPeriod] = useState<PeriodValue>(() => currentYearRange());
  const year = period.from?.getFullYear() ?? new Date().getFullYear();

  const filteredClients = useMemo(
    () => clients.filter((c) => inPeriod(c.createdAt, period)),
    [clients, period],
  );
  const filteredBudgets = useMemo(
    () => budgets.filter((b) => inPeriod(b.createdAt, period)),
    [budgets, period],
  );
  const filteredInvoices = useMemo(
    () => invoices.filter((inv) => inPeriod(inv.createdAt, period)),
    [invoices, period],
  );

  const creados = filteredBudgets.length;
  const enviados = filteredBudgets.filter((b) => b.status !== "BORRADOR").length;
  const aceptados = filteredBudgets.filter((b) => b.status === "ACEPTADO").length;
  const facturados = filteredBudgets.filter((b) => b.status === "ACEPTADO" && b.hasInvoice).length;

  const conversionGlobal = creados > 0 ? (aceptados / creados) * 100 : null;
  const ingresosFacturados = filteredInvoices.reduce((sum, inv) => sum + inv.total, 0);
  const ticketMedio = filteredInvoices.length > 0 ? ingresosFacturados / filteredInvoices.length : 0;

  const funnelStages = [
    { label: "Creados", value: creados, color: FUNNEL_COLORS[0] },
    { label: "Enviados", value: enviados, color: FUNNEL_COLORS[1] },
    { label: "Aceptados", value: aceptados, color: FUNNEL_COLORS[2] },
    { label: "Facturados", value: facturados, color: FUNNEL_COLORS[3] },
  ];

  const revenueChartData: MonthlyValuePoint[] = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, month) => ({ month, value: 0 }));
    for (const inv of invoices) {
      if (inv.createdAt.getFullYear() !== year) continue;
      months[inv.createdAt.getMonth()].value += inv.total;
    }
    return months;
  }, [invoices, year]);

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
        Periodo: <span className="font-semibold text-slate-700">{year}</span>.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Nuevos clientes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-slate-900">{filteredClients.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Conversión global</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-slate-900">
              {conversionGlobal === null ? "—" : `${conversionGlobal.toFixed(0)}%`}
            </p>
            <p className="text-xs text-slate-400">Presupuestos aceptados / creados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Ingresos facturados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">{formatEUR(ingresosFacturados)}</p>
            <p className="text-xs text-slate-400">{filteredInvoices.length} facturas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Ticket medio</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-slate-900">{formatEUR(ticketMedio)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Embudo comercial</CardTitle>
          </CardHeader>
          <CardContent>
            <FunnelChart stages={funnelStages} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ingresos facturados por mes</CardTitle>
          </CardHeader>
          <CardContent>
            <MonthlyBarChart data={revenueChartData} color={REVENUE_COLOR} label="Ingresos" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
