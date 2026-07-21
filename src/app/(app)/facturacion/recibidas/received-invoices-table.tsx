"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Upload, Pencil, Download } from "lucide-react";
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
import { RECEIVED_INVOICE_STATUS_LABEL } from "@/lib/validations/received-invoice";
import { FacturacionNav } from "../facturacion-nav";
import { PeriodFilter, currentYearRange, type PeriodValue } from "@/components/period-filter";

export type ReceivedInvoiceRow = {
  id: string;
  providerName: string | null;
  invoiceNumber: string | null;
  invoiceDate: Date | null;
  createdAt: Date;
  baseAmount: number;
  vatAmount: number;
  totalAmount: number;
  status: "PENDIENTE_VERIFICACION" | "VERIFICADA";
};

const STATUS_STYLES: Record<ReceivedInvoiceRow["status"], string> = {
  PENDIENTE_VERIFICACION: "bg-amber-100 text-amber-800",
  VERIFICADA: "bg-emerald-100 text-emerald-800",
};

function formatDate(d: Date | null) {
  if (!d) return "—";
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function ReceivedInvoicesTable({ rows }: { rows: ReceivedInvoiceRow[] }) {
  const [query, setQuery] = useState("");
  const [period, setPeriod] = useState<PeriodValue>(() => currentYearRange());

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const refDate = (r: ReceivedInvoiceRow) => r.invoiceDate ?? r.createdAt;

    return rows.filter((r) => {
      if (q && ![r.providerName, r.invoiceNumber].filter(Boolean).some((v) => v!.toLowerCase().includes(q))) {
        return false;
      }
      if (period.from && refDate(r) < period.from) return false;
      if (period.to && refDate(r) > period.to) return false;
      return true;
    });
  }, [rows, query, period]);

  function exportCsv() {
    const header = ["Proveedor", "Nº", "Fecha", "Base", "IVA", "Total", "Estado"];
    const lines = filtered.map((r) =>
      [
        r.providerName ?? "",
        r.invoiceNumber ?? "",
        formatDate(r.invoiceDate ?? r.createdAt),
        r.baseAmount.toFixed(2),
        r.vatAmount.toFixed(2),
        r.totalAmount.toFixed(2),
        RECEIVED_INVOICE_STATUS_LABEL[r.status],
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(","),
    );
    const csv = [header.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "facturas-recibidas.csv";
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

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" className="gap-1.5" disabled title="Próximamente: subida y lectura automática">
          <Upload className="size-4" />
          Subir Factura Recibida
        </Button>
        <Link href="/facturacion/recibidas/nueva">
          <Button size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700">
            <Pencil className="size-4" />
            Entrada manual
          </Button>
        </Link>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={exportCsv}>
          <Download className="size-4" />
          CSV
        </Button>
      </div>

      <Input
        placeholder="Buscar por proveedor o nº..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="max-w-md"
      />

      <div className="rounded-lg border border-slate-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Proveedor</TableHead>
              <TableHead>Nº</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Base</TableHead>
              <TableHead>IVA</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-slate-400">
                  Sin facturas recibidas.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">
                    <Link href={`/facturacion/recibidas/${r.id}`} className="hover:underline">
                      {r.providerName ?? "—"}
                    </Link>
                  </TableCell>
                  <TableCell>{r.invoiceNumber ?? "—"}</TableCell>
                  <TableCell>{formatDate(r.invoiceDate ?? r.createdAt)}</TableCell>
                  <TableCell>{formatEUR(r.baseAmount)}</TableCell>
                  <TableCell>{formatEUR(r.vatAmount)}</TableCell>
                  <TableCell className="font-medium">{formatEUR(r.totalAmount)}</TableCell>
                  <TableCell>
                    <Badge className={cn("border-0", STATUS_STYLES[r.status])}>
                      {RECEIVED_INVOICE_STATUS_LABEL[r.status]}
                    </Badge>
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
