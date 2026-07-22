"use client";

import { useActionState, useRef, useState } from "react";
import Link from "next/link";
import { X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeleteConfirmButton } from "@/components/delete-confirm-button";
import { ClientSearchField, type ClientOption } from "@/components/client-search-field";
import { formatDateInput, addDaysToDate } from "@/lib/date-utils";
import { computeLineTotals, formatEUR } from "@/lib/money-utils";
import { INVOICE_STATUS_LABEL } from "@/lib/validations/invoice";
import { createInvoice, updateInvoice, deleteInvoice, type InvoiceFormState } from "./actions";

export type CatalogOption = { id: string; name: string; basePrice: number; vatRate: number };
export type AppointmentOption = {
  id: string;
  label: string;
  description: string;
  unitPrice: number;
  vatRate: number;
};

export type InvoiceRecord = {
  id: string;
  number: string | null;
  clientId: string | null;
  clientName: string | null;
  type: "SIMPLIFICADA" | "COMPLETA";
  irpfRate: number;
  dueDate: Date | null;
  discountPct: number;
  status: "BORRADOR" | "EMITIDA" | "PAGADA" | "VENCIDA";
  verifactuHash: string | null;
  verifactuQrData: string | null;
  verifactuQrImage: string | null;
  verifactuSubmissionStatus: "NO_CONFIGURADO" | "PENDIENTE_ENVIO" | "ENVIADO" | "ERROR";
  verifactuSubmissionError: string | null;
  lines: {
    catalogItemId: string | null;
    description: string;
    quantity: number;
    unitPrice: number;
    discountPct: number;
    vatRate: number;
  }[];
};

type DraftLine = {
  key: number;
  catalogItemId: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  discountPct: number;
  vatRate: number;
};

const VERIFACTU_STATUS_LABEL: Record<InvoiceRecord["verifactuSubmissionStatus"], string> = {
  NO_CONFIGURADO: "Sin configurar",
  PENDIENTE_ENVIO: "Preparado — pendiente de certificado",
  ENVIADO: "Enviado a la AEAT",
  ERROR: "Error de envío",
};

const VERIFACTU_STATUS_STYLES: Record<InvoiceRecord["verifactuSubmissionStatus"], string> = {
  NO_CONFIGURADO: "bg-slate-100 text-slate-600",
  PENDIENTE_ENVIO: "bg-amber-100 text-amber-800",
  ENVIADO: "bg-emerald-100 text-emerald-800",
  ERROR: "bg-red-100 text-red-800",
};

const initialState: InvoiceFormState = {};

export function InvoiceForm({
  invoice,
  serviceOptions,
  productOptions,
  appointmentOptions,
  clientOptions,
}: {
  invoice?: InvoiceRecord;
  serviceOptions: CatalogOption[];
  productOptions: CatalogOption[];
  appointmentOptions: AppointmentOption[];
  clientOptions: ClientOption[];
}) {
  const isEdit = Boolean(invoice);
  const action = invoice ? updateInvoice.bind(null, invoice.id) : createInvoice;
  const [state, formAction, pending] = useActionState(action, initialState);

  const nextKey = useRef((invoice?.lines ?? []).length);
  const [lines, setLines] = useState<DraftLine[]>(() =>
    (invoice?.lines ?? []).map((l, i) => ({ ...l, key: i })),
  );
  const [discountPct, setDiscountPct] = useState(invoice?.discountPct ?? 0);
  const [dueDate, setDueDate] = useState(invoice?.dueDate ? formatDateInput(invoice.dueDate) : "");
  const [selectedClient, setSelectedClient] = useState<{ id: string; name: string } | null>(
    invoice?.clientId && invoice.clientName ? { id: invoice.clientId, name: invoice.clientName } : null,
  );

  function addLine(item: { description: string; unitPrice: number; vatRate: number; catalogItemId?: string | null }) {
    setLines((prev) => [
      ...prev,
      {
        key: nextKey.current++,
        catalogItemId: item.catalogItemId ?? null,
        description: item.description,
        quantity: 1,
        unitPrice: item.unitPrice,
        discountPct: 0,
        vatRate: item.vatRate,
      },
    ]);
  }

  function addBlankLine() {
    addLine({ description: "", unitPrice: 0, vatRate: 21 });
  }

  function updateLine(key: number, patch: Partial<DraftLine>) {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }

  function removeLine(key: number) {
    setLines((prev) => prev.filter((l) => l.key !== key));
  }

  const totals = computeLineTotals(lines, discountPct);

  return (
    <div className="space-y-4">
      <Link href="/facturacion" className="text-sm text-indigo-700 hover:underline">
        ← Volver a facturas
      </Link>

      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-900">
            {isEdit ? `Factura ${invoice?.number ?? "(borrador)"}` : "Nueva factura (borrador)"}
          </h1>
          <Link href="/facturacion">
            <Button variant="ghost" size="icon-sm">
              <X className="size-4" />
            </Button>
          </Link>
        </div>

        <form action={formAction} className="space-y-4">
          {state.error ? (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
          ) : null}

          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-2 space-y-1">
              <Label>Cliente</Label>
              <ClientSearchField
                options={clientOptions}
                value={selectedClient}
                onChange={setSelectedClient}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="type">Tipo</Label>
              <select
                id="type"
                name="type"
                defaultValue={invoice?.type ?? "SIMPLIFICADA"}
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
              >
                <option value="SIMPLIFICADA">Simplificada</option>
                <option value="COMPLETA">Completa</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="irpfRate">IRPF %</Label>
              <Input id="irpfRate" name="irpfRate" type="number" step="0.01" defaultValue={invoice?.irpfRate ?? 0} />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="dueDate">Vencimiento *</Label>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                id="dueDate"
                name="dueDate"
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-44"
              />
              {[
                { label: "Contado", days: 0 },
                { label: "15 d", days: 15 },
                { label: "30 d", days: 30 },
                { label: "60 d", days: 60 },
              ].map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setDueDate(formatDateInput(addDaysToDate(new Date(), preset.days)))}
                  className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-500 hover:bg-slate-50"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <select
              value=""
              onChange={(e) => {
                const item = serviceOptions.find((s) => s.id === e.target.value);
                if (item) addLine({ description: item.name, unitPrice: item.basePrice, vatRate: item.vatRate, catalogItemId: item.id });
              }}
              className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-sm text-slate-500"
            >
              <option value="">+ Servicio...</option>
              {serviceOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <select
              value=""
              onChange={(e) => {
                const item = productOptions.find((p) => p.id === e.target.value);
                if (item) addLine({ description: item.name, unitPrice: item.basePrice, vatRate: item.vatRate, catalogItemId: item.id });
              }}
              className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-sm text-slate-500"
            >
              <option value="">+ Producto...</option>
              {productOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <select
              value=""
              onChange={(e) => {
                const item = appointmentOptions.find((a) => a.id === e.target.value);
                if (item) addLine(item);
              }}
              className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-sm text-slate-500"
            >
              <option value="">+ Cita completada...</option>
              {appointmentOptions.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label}
                </option>
              ))}
            </select>
          </div>

          <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={addBlankLine}>
            <Plus className="size-4" />
            Línea manual
          </Button>

          <div className="rounded-lg border border-slate-200">
            {lines.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">Sin líneas.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="w-20">Cant.</TableHead>
                    <TableHead className="w-28">Precio</TableHead>
                    <TableHead className="w-20">Desc.%</TableHead>
                    <TableHead className="w-20">IVA</TableHead>
                    <TableHead className="w-28">Importe</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lines.map((line) => {
                    const lineTotal =
                      line.quantity * line.unitPrice * (1 - line.discountPct / 100) *
                      (1 + line.vatRate / 100);
                    return (
                      <TableRow key={line.key}>
                        <TableCell>
                          <input type="hidden" name="lineCatalogItemId" value={line.catalogItemId ?? ""} />
                          <Input
                            name="lineDescription"
                            value={line.description}
                            onChange={(e) => updateLine(line.key, { description: e.target.value })}
                            required
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            name="lineQuantity"
                            type="number"
                            step="0.01"
                            value={line.quantity}
                            onChange={(e) => updateLine(line.key, { quantity: Number(e.target.value) })}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            name="lineUnitPrice"
                            type="number"
                            step="0.01"
                            value={line.unitPrice}
                            onChange={(e) => updateLine(line.key, { unitPrice: Number(e.target.value) })}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            name="lineDiscountPct"
                            type="number"
                            step="0.01"
                            value={line.discountPct}
                            onChange={(e) => updateLine(line.key, { discountPct: Number(e.target.value) })}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            name="lineVatRate"
                            type="number"
                            step="0.01"
                            value={line.vatRate}
                            onChange={(e) => updateLine(line.key, { vatRate: Number(e.target.value) })}
                          />
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">{formatEUR(lineTotal)}</TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="text-slate-400 hover:text-red-600"
                            onClick={() => removeLine(line.key)}
                          >
                            <X className="size-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>

          {isEdit ? (
            <div className="space-y-1 sm:w-64">
              <Label htmlFor="status">Estado</Label>
              <select
                id="status"
                name="status"
                defaultValue={invoice?.status}
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
              >
                {Object.entries(INVOICE_STATUS_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <input type="hidden" name="status" value="BORRADOR" />
          )}

          {invoice?.verifactuHash ? (
            <div className="space-y-2 rounded-lg border border-slate-100 bg-slate-50 p-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium tracking-wide text-slate-400 uppercase">Verifactu</p>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${VERIFACTU_STATUS_STYLES[invoice.verifactuSubmissionStatus]}`}
                >
                  {VERIFACTU_STATUS_LABEL[invoice.verifactuSubmissionStatus]}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Registro generado con el formato oficial de la AEAT. El envío real requiere un
                certificado digital que la organización todavía no tiene.
              </p>
              <div className="flex items-start gap-3">
                {invoice.verifactuQrImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={invoice.verifactuQrImage}
                    alt="Código QR Verifactu"
                    className="size-24 rounded border border-slate-200 bg-white p-1"
                  />
                ) : null}
                <div className="min-w-0 space-y-1">
                  <p className="font-mono text-xs break-all text-slate-500">{invoice.verifactuHash}</p>
                  {invoice.verifactuSubmissionError ? (
                    <p className="text-xs text-red-600">{invoice.verifactuSubmissionError}</p>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}

          <div className="flex flex-col items-end gap-1 border-t border-slate-100 pt-4">
            <div className="flex w-full max-w-xs items-center justify-between text-sm text-slate-500">
              <span>Base imponible</span>
              <span>{formatEUR(totals.baseImponible)}</span>
            </div>
            <div className="flex w-full max-w-xs items-center justify-between text-sm text-slate-500">
              <span className="flex items-center gap-2">
                Descuento %
                <Input
                  name="discountPct"
                  type="number"
                  step="0.01"
                  value={discountPct}
                  onChange={(e) => setDiscountPct(Number(e.target.value))}
                  className="h-7 w-16"
                />
              </span>
              <span className="text-red-600">-{formatEUR(totals.discountAmount)}</span>
            </div>
            <div className="flex w-full max-w-xs items-center justify-between text-sm text-slate-500">
              <span>IVA</span>
              <span>{formatEUR(totals.ivaTotal)}</span>
            </div>
            <div className="flex w-full max-w-xs items-center justify-between text-base font-bold text-slate-900">
              <span>Total</span>
              <span>{formatEUR(totals.total)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-2">
            {isEdit && invoice ? (
              <DeleteConfirmButton
                description="Se eliminará esta factura."
                onConfirm={() => deleteInvoice(invoice.id)}
              />
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Link href="/facturacion">
                <Button type="button" variant="outline">
                  Cerrar
                </Button>
              </Link>
              <Button type="submit" name="intent" value="draft" variant="outline" disabled={pending}>
                {pending ? "Guardando..." : "Guardar borrador"}
              </Button>
              <Button
                type="submit"
                name="intent"
                value="confirm"
                disabled={pending || Boolean(invoice?.number)}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {pending ? "Guardando..." : invoice?.number ? "Ya emitida" : "Emitir factura"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
