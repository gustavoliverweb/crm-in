"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Plus, Download, Send } from "lucide-react";
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
import { BUDGET_STATUS_LABEL } from "@/lib/validations/budget";
import { formatEUR } from "./budget-utils";
import { sendBudget } from "./actions";

export type BudgetRow = {
  id: string;
  number: string | null;
  clientName: string | null;
  clientTaxId: string | null;
  createdAt: Date;
  validUntil: Date | null;
  status: "BORRADOR" | "ENVIADO" | "ACEPTADO" | "RECHAZADO" | "CADUCADO";
  total: number;
};

const STATUS_TABS: { value: BudgetRow["status"] | "TODOS"; label: string }[] = [
  { value: "TODOS", label: "Todos" },
  { value: "BORRADOR", label: "Borradores" },
  { value: "ENVIADO", label: "Enviados" },
  { value: "ACEPTADO", label: "Aceptados" },
  { value: "RECHAZADO", label: "Rechazados" },
  { value: "CADUCADO", label: "Caducados" },
];

const STATUS_STYLES: Record<BudgetRow["status"], string> = {
  BORRADOR: "bg-slate-100 text-slate-600",
  ENVIADO: "bg-blue-100 text-blue-800",
  ACEPTADO: "bg-emerald-100 text-emerald-800",
  RECHAZADO: "bg-red-100 text-red-800",
  CADUCADO: "bg-amber-100 text-amber-800",
};

function formatDate(d: Date | null) {
  if (!d) return "—";
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function toCsv(rows: BudgetRow[]) {
  const header = ["Número", "Cliente", "Fecha", "Válido hasta", "Total", "Estado"];
  const lines = rows.map((r) =>
    [
      r.number ?? "",
      r.clientName ?? "",
      formatDate(r.createdAt),
      formatDate(r.validUntil),
      r.total.toFixed(2),
      BUDGET_STATUS_LABEL[r.status],
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(","),
  );
  return [header.join(","), ...lines].join("\n");
}

export function PresupuestosTable({ rows }: { rows: BudgetRow[] }) {
  const [status, setStatus] = useState<BudgetRow["status"] | "TODOS">("TODOS");
  const [query, setQuery] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const fromDate = from ? new Date(`${from}T00:00:00`) : null;
    const toDate = to ? new Date(`${to}T23:59:59`) : null;

    return rows.filter((r) => {
      if (status !== "TODOS" && r.status !== status) return false;
      if (q && ![r.clientName, r.clientTaxId].filter(Boolean).some((v) => v!.toLowerCase().includes(q))) {
        return false;
      }
      if (fromDate && r.createdAt < fromDate) return false;
      if (toDate && r.createdAt > toDate) return false;
      return true;
    });
  }, [rows, status, query, from, to]);

  function exportCsv() {
    const blob = new Blob([toCsv(filtered)], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "presupuestos.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900">Presupuestos</h1>
        <div className="flex items-center gap-2">
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-36" />
          <span className="text-sm text-slate-400">—</span>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-36" />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link href="/presupuestos/nuevo">
            <Button size="sm" className="gap-1.5 bg-indigo-600 hover:bg-indigo-700">
              <Plus className="size-4" />
              Nuevo presupuesto
            </Button>
          </Link>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={exportCsv}>
            <Download className="size-4" />
            CSV
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setStatus(tab.value)}
            className={cn(
              "rounded-full border px-3 py-1 text-sm font-medium transition-colors",
              status === tab.value
                ? "border-slate-700 bg-slate-700 text-white"
                : "border-slate-200 text-slate-600 hover:bg-slate-50",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <Input
        placeholder="Buscar por cliente o CIF/DNI..."
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
              <TableHead>Válido hasta</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-16">Enviar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-slate-400">
                  Sin presupuestos.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">
                    <Link href={`/presupuestos/${r.id}`} className="hover:underline">
                      {r.number ?? "Borrador"}
                    </Link>
                  </TableCell>
                  <TableCell>{r.clientName ?? "—"}</TableCell>
                  <TableCell>{formatDate(r.createdAt)}</TableCell>
                  <TableCell>{formatDate(r.validUntil)}</TableCell>
                  <TableCell>{formatEUR(r.total)}</TableCell>
                  <TableCell>
                    <Badge className={cn("border-0", STATUS_STYLES[r.status])}>
                      {BUDGET_STATUS_LABEL[r.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {r.status === "BORRADOR" && r.number ? (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-slate-400 hover:text-indigo-600"
                        onClick={() => sendBudget(r.id)}
                      >
                        <Send className="size-4" />
                      </Button>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
