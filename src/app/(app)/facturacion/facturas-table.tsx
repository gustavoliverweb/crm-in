"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Plus, Download, Euro, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { formatEUR } from "@/lib/money-utils";
import { INVOICE_STATUS_LABEL } from "@/lib/validations/invoice";
import { FacturacionNav } from "./facturacion-nav";
import { PeriodFilter, currentYearRange, type PeriodValue } from "@/components/period-filter";
import { markInvoicePaid } from "./actions";

export type InvoiceRow = {
  id: string;
  number: string | null;
  type: "SIMPLIFICADA" | "COMPLETA";
  clientName: string | null;
  clientTaxId: string | null;
  createdAt: Date;
  dueDate: Date | null;
  status: "BORRADOR" | "EMITIDA" | "PAGADA" | "VENCIDA";
  baseImponible: number;
  ivaTotal: number;
  total: number;
};

const STATUS_TABS = [
  { value: "TODAS", label: "Todas" },
  { value: "EMITIDA_ANY", label: "Emitidas" },
  { value: "PAGADA", label: "Pagadas" },
  { value: "PENDIENTE", label: "Pendientes" },
  { value: "BORRADOR", label: "Borradores" },
] as const;

const TYPE_TABS = [
  { value: "TODOS", label: "Todos" },
  { value: "SIMPLIFICADA", label: "Simplificadas" },
  { value: "COMPLETA", label: "Completas" },
] as const;

const STATUS_STYLES: Record<InvoiceRow["status"], string> = {
  BORRADOR: "bg-slate-100 text-slate-600",
  EMITIDA: "bg-blue-100 text-blue-800",
  PAGADA: "bg-emerald-100 text-emerald-800",
  VENCIDA: "bg-red-100 text-red-800",
};

function isOverdue(row: InvoiceRow) {
  return row.status === "EMITIDA" && row.dueDate !== null && row.dueDate < new Date();
}

function displayStatus(row: InvoiceRow): InvoiceRow["status"] {
  return isOverdue(row) ? "VENCIDA" : row.status;
}

function formatDate(d: Date | null) {
  if (!d) return "—";
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function FacturasTable({ rows }: { rows: InvoiceRow[] }) {
  const [statusTab, setStatusTab] = useState<(typeof STATUS_TABS)[number]["value"]>("TODAS");
  const [typeTab, setTypeTab] = useState<(typeof TYPE_TABS)[number]["value"]>("TODOS");
  const [query, setQuery] = useState("");
  const [period, setPeriod] = useState<PeriodValue>(() => currentYearRange());

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return rows.filter((r) => {
      const status = displayStatus(r);
      if (statusTab === "EMITIDA_ANY" && r.status === "BORRADOR") return false;
      if (statusTab === "PAGADA" && status !== "PAGADA") return false;
      if (statusTab === "PENDIENTE" && status !== "EMITIDA") return false;
      if (statusTab === "BORRADOR" && status !== "BORRADOR") return false;
      if (typeTab !== "TODOS" && r.type !== typeTab) return false;
      if (q && ![r.clientName, r.clientTaxId].filter(Boolean).some((v) => v!.toLowerCase().includes(q))) {
        return false;
      }
      if (period.from && r.createdAt < period.from) return false;
      if (period.to && r.createdAt > period.to) return false;
      return true;
    });
  }, [rows, statusTab, typeTab, query, period]);

  function exportCsv() {
    const header = ["Número", "Cliente", "Fecha", "Vence", "Base imponible", "IVA", "Total", "Estado"];
    const lines = filtered.map((r) =>
      [
        r.number ?? "",
        r.clientName ?? "",
        formatDate(r.createdAt),
        formatDate(r.dueDate),
        r.baseImponible.toFixed(2),
        r.ivaTotal.toFixed(2),
        r.total.toFixed(2),
        INVOICE_STATUS_LABEL[displayStatus(r)],
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(","),
    );
    const csv = [header.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "facturas.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

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

      <div className="flex items-center gap-2">
        <Link href="/facturacion/nuevo">
          <Button size="sm" className="gap-1.5 bg-indigo-600 hover:bg-indigo-700">
            <Plus className="size-4" />
            Nueva factura
          </Button>
        </Link>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={exportCsv}>
          <Download className="size-4" />
          CSV
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setStatusTab(tab.value)}
            className={cn(
              "rounded-full border px-3 py-1 text-sm font-medium transition-colors",
              statusTab === tab.value
                ? "border-slate-700 bg-slate-700 text-white"
                : "border-slate-200 text-slate-600 hover:bg-slate-50",
            )}
          >
            {tab.label}
          </button>
        ))}
        <span className="mx-1 h-4 w-px bg-slate-200" />
        {TYPE_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setTypeTab(tab.value)}
            className={cn(
              "rounded-full border px-3 py-1 text-sm font-medium transition-colors",
              typeTab === tab.value
                ? "border-slate-700 bg-slate-700 text-white"
                : "border-slate-200 text-slate-600 hover:bg-slate-50",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <Input
        placeholder="Buscar por cliente, teléfono o CIF/DNI..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="max-w-md"
      />

      <div className="rounded-lg border border-slate-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Vence</TableHead>
              <TableHead>Base imponible</TableHead>
              <TableHead>IVA</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-16">Cobro</TableHead>
              <TableHead className="w-16">Enviar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="py-8 text-center text-slate-400">
                  Sin facturas.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((r) => {
                const status = displayStatus(r);
                return (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">
                      <Link href={`/facturacion/${r.id}`} className="hover:underline">
                        {r.number ?? "Borrador"}
                      </Link>
                    </TableCell>
                    <TableCell>{r.clientName ?? "—"}</TableCell>
                    <TableCell>{formatDate(r.createdAt)}</TableCell>
                    <TableCell>{formatDate(r.dueDate)}</TableCell>
                    <TableCell>{formatEUR(r.baseImponible)}</TableCell>
                    <TableCell>{formatEUR(r.ivaTotal)}</TableCell>
                    <TableCell className="font-medium">{formatEUR(r.total)}</TableCell>
                    <TableCell>
                      <Badge className={cn("border-0", STATUS_STYLES[status])}>
                        {INVOICE_STATUS_LABEL[status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {r.status === "EMITIDA" ? (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-slate-400 hover:text-emerald-600"
                          onClick={() => markInvoicePaid(r.id)}
                          title="Marcar como cobrada"
                        >
                          <Euro className="size-4" />
                        </Button>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-slate-300"
                        disabled
                        title="Envío por email (próximamente)"
                      >
                        <Send className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
