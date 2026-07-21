"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatEUR } from "@/lib/money-utils";
import { PeriodFilter, currentYearRange, inPeriod, type PeriodValue } from "@/components/period-filter";
import { InformesNav } from "../informes-nav";

type InvoiceRow = { createdAt: Date; baseNeto: number; ivaTotal: number; irpfAmount: number };
type ReceivedRow = { date: Date; baseAmount: number; vatAmount: number };

function quarterRange(year: number, quarter: 1 | 2 | 3 | 4): [Date, Date] {
  const startMonth = (quarter - 1) * 3;
  return [new Date(year, startMonth, 1), new Date(year, startMonth + 3, 0, 23, 59, 59)];
}

export function ImpuestosView({
  invoices,
  receivedInvoices,
}: {
  invoices: InvoiceRow[];
  receivedInvoices: ReceivedRow[];
}) {
  const [period, setPeriod] = useState<PeriodValue>(() => currentYearRange());
  const year = period.from?.getFullYear() ?? new Date().getFullYear();

  const filteredInvoices = useMemo(
    () => invoices.filter((inv) => inPeriod(inv.createdAt, period)),
    [invoices, period],
  );
  const filteredReceived = useMemo(
    () => receivedInvoices.filter((r) => inPeriod(r.date, period)),
    [receivedInvoices, period],
  );

  const ivaRepercutido = filteredInvoices.reduce((sum, inv) => sum + inv.ivaTotal, 0);
  const ivaSoportado = filteredReceived.reduce((sum, r) => sum + r.vatAmount, 0);
  const ivaALiquidar = ivaRepercutido - ivaSoportado;
  const irpfRetenido = filteredInvoices.reduce((sum, inv) => sum + inv.irpfAmount, 0);

  const quarterlyRows = useMemo(() => {
    const quarters: (1 | 2 | 3 | 4)[] = [1, 2, 3, 4];
    return quarters.map((q) => {
      const [from, to] = quarterRange(year, q);
      const qPeriod: PeriodValue = { from, to };
      const invs = invoices.filter((inv) => inPeriod(inv.createdAt, qPeriod));
      const recv = receivedInvoices.filter((r) => inPeriod(r.date, qPeriod));
      const repercutido = invs.reduce((sum, inv) => sum + inv.ivaTotal, 0);
      const soportado = recv.reduce((sum, r) => sum + r.vatAmount, 0);
      const irpf = invs.reduce((sum, inv) => sum + inv.irpfAmount, 0);
      const baseFacturada = invs.reduce((sum, inv) => sum + inv.baseNeto, 0);
      return {
        label: `T${q} ${year}`,
        baseFacturada,
        repercutido,
        soportado,
        diferencia: repercutido - soportado,
        irpf,
      };
    });
  }, [invoices, receivedInvoices, year]);

  const yearTotal = quarterlyRows.reduce(
    (acc, r) => ({
      baseFacturada: acc.baseFacturada + r.baseFacturada,
      repercutido: acc.repercutido + r.repercutido,
      soportado: acc.soportado + r.soportado,
      diferencia: acc.diferencia + r.diferencia,
      irpf: acc.irpf + r.irpf,
    }),
    { baseFacturada: 0, repercutido: 0, soportado: 0, diferencia: 0, irpf: 0 },
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
        Periodo: <span className="font-semibold text-slate-700">{year}</span>. Estimación
        informativa a partir de facturas emitidas y recibidas — no sustituye la presentación de
        modelos ante la AEAT.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">IVA repercutido</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">{formatEUR(ivaRepercutido)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">IVA soportado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{formatEUR(ivaSoportado)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              {ivaALiquidar >= 0 ? "IVA a ingresar" : "IVA a devolver"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={`text-2xl font-bold ${ivaALiquidar >= 0 ? "text-slate-900" : "text-emerald-600"}`}
            >
              {formatEUR(Math.abs(ivaALiquidar))}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">IRPF retenido</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-slate-900">{formatEUR(irpfRetenido)}</p>
            <p className="text-xs text-slate-400">A cuenta en facturas emitidas</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Desglose trimestral {year}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Periodo</TableHead>
                <TableHead className="text-right">Base facturada</TableHead>
                <TableHead className="text-right">IVA repercutido</TableHead>
                <TableHead className="text-right">IVA soportado</TableHead>
                <TableHead className="text-right">IVA a liquidar</TableHead>
                <TableHead className="text-right">IRPF retenido</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quarterlyRows.map((r) => (
                <TableRow key={r.label}>
                  <TableCell className="font-medium text-slate-900">{r.label}</TableCell>
                  <TableCell className="text-right">{formatEUR(r.baseFacturada)}</TableCell>
                  <TableCell className="text-right">{formatEUR(r.repercutido)}</TableCell>
                  <TableCell className="text-right">{formatEUR(r.soportado)}</TableCell>
                  <TableCell className="text-right">{formatEUR(r.diferencia)}</TableCell>
                  <TableCell className="text-right">{formatEUR(r.irpf)}</TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell className="font-semibold text-slate-900">Total {year}</TableCell>
                <TableCell className="text-right font-semibold text-slate-900">
                  {formatEUR(yearTotal.baseFacturada)}
                </TableCell>
                <TableCell className="text-right font-semibold text-slate-900">
                  {formatEUR(yearTotal.repercutido)}
                </TableCell>
                <TableCell className="text-right font-semibold text-slate-900">
                  {formatEUR(yearTotal.soportado)}
                </TableCell>
                <TableCell className="text-right font-semibold text-slate-900">
                  {formatEUR(yearTotal.diferencia)}
                </TableCell>
                <TableCell className="text-right font-semibold text-slate-900">
                  {formatEUR(yearTotal.irpf)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
