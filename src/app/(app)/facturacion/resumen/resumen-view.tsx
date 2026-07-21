"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatEUR } from "@/lib/money-utils";
import { FacturacionNav } from "../facturacion-nav";
import { PeriodFilter, currentYearRange, inPeriod, type PeriodValue } from "@/components/period-filter";
import { IngresosGastosChart, type MonthlyPoint } from "./ingresos-gastos-chart";

export type InvoiceSummaryRow = {
  id: string;
  clientName: string | null;
  createdAt: Date;
  status: "BORRADOR" | "EMITIDA" | "PAGADA" | "VENCIDA";
  ivaTotal: number;
  total: number;
};

export type ReceivedSummaryRow = {
  id: string;
  providerName: string | null;
  invoiceDate: Date | null;
  createdAt: Date;
  vatAmount: number;
  totalAmount: number;
};

export function ResumenView({
  invoices,
  receivedInvoices,
}: {
  invoices: InvoiceSummaryRow[];
  receivedInvoices: ReceivedSummaryRow[];
}) {
  const [period, setPeriod] = useState<PeriodValue>(() => currentYearRange());

  const issuedInvoices = useMemo(
    () => invoices.filter((inv) => inv.status !== "BORRADOR"),
    [invoices],
  );

  const filteredInvoices = useMemo(
    () => issuedInvoices.filter((inv) => inPeriod(inv.createdAt, period)),
    [issuedInvoices, period],
  );

  const filteredReceived = useMemo(
    () => receivedInvoices.filter((r) => inPeriod(r.invoiceDate ?? r.createdAt, period)),
    [receivedInvoices, period],
  );

  const ingresos = filteredInvoices.reduce((sum, i) => sum + i.total, 0);
  const gastos = filteredReceived.reduce((sum, r) => sum + r.totalAmount, 0);
  const ivaRepercutido = filteredInvoices.reduce((sum, i) => sum + i.ivaTotal, 0);
  const ivaSoportado = filteredReceived.reduce((sum, r) => sum + r.vatAmount, 0);

  const year = period.from?.getFullYear() ?? new Date().getFullYear();

  const chartData: MonthlyPoint[] = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, month) => ({ month, ingresos: 0, gastos: 0 }));
    for (const inv of issuedInvoices) {
      if (inv.createdAt.getFullYear() !== year) continue;
      months[inv.createdAt.getMonth()].ingresos += inv.total;
    }
    for (const r of receivedInvoices) {
      const d = r.invoiceDate ?? r.createdAt;
      if (d.getFullYear() !== year) continue;
      months[d.getMonth()].gastos += r.totalAmount;
    }
    return months;
  }, [issuedInvoices, receivedInvoices, year]);

  const topClients = useMemo(() => {
    const totals = new Map<string, number>();
    for (const inv of filteredInvoices) {
      const name = inv.clientName ?? "Sin cliente";
      totals.set(name, (totals.get(name) ?? 0) + inv.total);
    }
    return Array.from(totals.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [filteredInvoices]);

  const topProviders = useMemo(() => {
    const totals = new Map<string, number>();
    for (const r of filteredReceived) {
      const name = r.providerName ?? "Sin proveedor";
      totals.set(name, (totals.get(name) ?? 0) + r.totalAmount);
    }
    return Array.from(totals.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [filteredReceived]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Facturación</h1>
          <div className="mt-2">
            <FacturacionNav />
          </div>
        </div>
        <PeriodFilter value={period} onChange={setPeriod} />
      </div>

      <p className="text-sm text-slate-500">
        Periodo: <span className="font-semibold text-slate-700">{year}</span>. Ingresos = facturas
        emitidas · Gastos = facturas recibidas.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Ingresos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">{formatEUR(ingresos)}</p>
            <p className="text-xs text-slate-400">{filteredInvoices.length} facturas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Gastos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{formatEUR(gastos)}</p>
            <p className="text-xs text-slate-400">{filteredReceived.length} facturas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Resultado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${ingresos - gastos >= 0 ? "text-emerald-600" : "text-red-600"}`}>
              {formatEUR(ingresos - gastos)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">IVA repercutido</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-slate-900">{formatEUR(ivaRepercutido)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">IVA soportado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-slate-900">{formatEUR(ivaSoportado)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ingresos vs Gastos</CardTitle>
        </CardHeader>
        <CardContent>
          <IngresosGastosChart data={chartData} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top clientes (ingresos)</CardTitle>
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
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top proveedores (gastos)</CardTitle>
          </CardHeader>
          <CardContent>
            {topProviders.length === 0 ? (
              <p className="text-sm text-slate-400">Sin datos.</p>
            ) : (
              <ul className="space-y-2">
                {topProviders.map(([name, total]) => (
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
    </div>
  );
}
