"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeleteConfirmButton } from "@/components/delete-confirm-button";
import { cn } from "@/lib/utils";
import { formatDateInput } from "@/lib/date-utils";
import { formatEUR } from "@/lib/money-utils";
import { RECEIVED_INVOICE_STATUS_LABEL } from "@/lib/validations/received-invoice";
import {
  createReceivedInvoice,
  updateReceivedInvoice,
  deleteReceivedInvoice,
  markReceivedInvoiceVerified,
  createProviderQuick,
  type ReceivedInvoiceFormState,
  type CreateProviderState,
} from "../received-actions";

export type ProviderOption = { id: string; name: string };

export type ReceivedInvoiceRecord = {
  id: string;
  providerId: string | null;
  invoiceNumber: string | null;
  invoiceDate: Date | null;
  baseAmount: number;
  vatAmount: number;
  totalAmount: number;
  status: "PENDIENTE_VERIFICACION" | "VERIFICADA";
  lines: {
    productName: string;
    sku: string | null;
    quantity: number;
    unit: string | null;
    unitPrice: number;
    total: number;
  }[];
};

type DraftLine = {
  key: number;
  productName: string;
  sku: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
};

const initialState: ReceivedInvoiceFormState = {};
const initialProviderState: CreateProviderState = {};

function NewProviderDialog({ onCreated }: { onCreated: (provider: ProviderOption) => void }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createProviderQuick, initialProviderState);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && state.provider) {
      onCreated(state.provider);
      setOpen(false);
    }
    wasPending.current = pending;
  }, [pending, state, onCreated]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm text-emerald-700 hover:underline"
      >
        + Nuevo proveedor
      </button>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Nuevo proveedor</DialogTitle>
        </DialogHeader>
        <form key={open ? "open" : "closed"} action={formAction} className="space-y-4">
          {state.error ? (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
          ) : null}
          <div className="space-y-1">
            <Label htmlFor="providerName">Nombre</Label>
            <Input id="providerName" name="name" required autoFocus />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending} className="bg-emerald-600 hover:bg-emerald-700">
              {pending ? "Creando..." : "Crear proveedor"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ReceivedInvoiceForm({
  receivedInvoice,
  providerOptions,
}: {
  receivedInvoice?: ReceivedInvoiceRecord;
  providerOptions: ProviderOption[];
}) {
  const isEdit = Boolean(receivedInvoice);
  const action = receivedInvoice
    ? updateReceivedInvoice.bind(null, receivedInvoice.id)
    : createReceivedInvoice;
  const [state, formAction, pending] = useActionState(action, initialState);

  const [providers, setProviders] = useState(providerOptions);
  const [providerId, setProviderId] = useState(receivedInvoice?.providerId ?? "");

  const nextKey = useRef((receivedInvoice?.lines ?? []).length);
  const [lines, setLines] = useState<DraftLine[]>(() =>
    (receivedInvoice?.lines ?? []).map((l, i) => ({
      key: i,
      productName: l.productName,
      sku: l.sku ?? "",
      quantity: l.quantity,
      unit: l.unit ?? "",
      unitPrice: l.unitPrice,
      total: l.total,
    })),
  );

  function addLine() {
    setLines((prev) => [
      ...prev,
      { key: nextKey.current++, productName: "", sku: "", quantity: 1, unit: "", unitPrice: 0, total: 0 },
    ]);
  }

  function updateLine(key: number, patch: Partial<DraftLine>) {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }

  function removeLine(key: number) {
    setLines((prev) => prev.filter((l) => l.key !== key));
  }

  const linesSum = lines.reduce((sum, l) => sum + l.total, 0);
  const status = receivedInvoice?.status ?? "PENDIENTE_VERIFICACION";

  return (
    <div className="space-y-4">
      <Link href="/facturacion/recibidas" className="text-sm text-emerald-700 hover:underline">
        ← Volver a recibidas
      </Link>

      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-900">Factura recibida</h1>
            <Badge
              className={cn(
                "border-0",
                status === "VERIFICADA" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800",
              )}
            >
              {RECEIVED_INVOICE_STATUS_LABEL[status]}
            </Badge>
          </div>
          <Link href="/facturacion/recibidas">
            <Button variant="ghost" size="icon-sm">
              <X className="size-4" />
            </Button>
          </Link>
        </div>

        <form action={formAction} className="space-y-4">
          {state.error ? (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
          ) : null}

          <div className="space-y-1">
            <Label htmlFor="providerId">Proveedor</Label>
            <div className="flex items-center gap-3">
              <select
                id="providerId"
                name="providerId"
                value={providerId}
                onChange={(e) => setProviderId(e.target.value)}
                className="h-8 w-full max-w-sm rounded-lg border border-input bg-transparent px-2.5 text-sm"
              >
                <option value="">— Selecciona proveedor —</option>
                {providers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <NewProviderDialog
                onCreated={(p) => {
                  setProviders((prev) => [...prev, p]);
                  setProviderId(p.id);
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-1">
              <Label htmlFor="invoiceNumber">Nº factura</Label>
              <Input id="invoiceNumber" name="invoiceNumber" defaultValue={receivedInvoice?.invoiceNumber ?? ""} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="invoiceDate">Fecha</Label>
              <Input
                id="invoiceDate"
                name="invoiceDate"
                type="date"
                defaultValue={receivedInvoice?.invoiceDate ? formatDateInput(receivedInvoice.invoiceDate) : ""}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="baseAmount">Base</Label>
              <Input
                id="baseAmount"
                name="baseAmount"
                type="number"
                step="0.01"
                defaultValue={receivedInvoice?.baseAmount ?? ""}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="vatAmount">IVA</Label>
              <Input
                id="vatAmount"
                name="vatAmount"
                type="number"
                step="0.01"
                defaultValue={receivedInvoice?.vatAmount ?? ""}
              />
            </div>
          </div>

          <div className="w-full max-w-[12rem] space-y-1">
            <Label htmlFor="totalAmount">Total</Label>
            <Input
              id="totalAmount"
              name="totalAmount"
              type="number"
              step="0.01"
              defaultValue={receivedInvoice?.totalAmount ?? ""}
            />
          </div>

          <div className="rounded-lg border border-slate-200">
            {lines.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">Sin líneas.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead className="w-24">SKU</TableHead>
                    <TableHead className="w-20">Cant.</TableHead>
                    <TableHead className="w-20">Ud.</TableHead>
                    <TableHead className="w-24">Precio</TableHead>
                    <TableHead className="w-24">Total</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lines.map((line) => (
                    <TableRow key={line.key}>
                      <TableCell>
                        <Input
                          name="rLineProductName"
                          value={line.productName}
                          onChange={(e) => updateLine(line.key, { productName: e.target.value })}
                          required
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          name="rLineSku"
                          value={line.sku}
                          onChange={(e) => updateLine(line.key, { sku: e.target.value })}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          name="rLineQuantity"
                          type="number"
                          step="0.01"
                          value={line.quantity}
                          onChange={(e) => updateLine(line.key, { quantity: Number(e.target.value) })}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          name="rLineUnit"
                          value={line.unit}
                          onChange={(e) => updateLine(line.key, { unit: e.target.value })}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          name="rLineUnitPrice"
                          type="number"
                          step="0.01"
                          value={line.unitPrice}
                          onChange={(e) => updateLine(line.key, { unitPrice: Number(e.target.value) })}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          name="rLineTotal"
                          type="number"
                          step="0.01"
                          value={line.total}
                          onChange={(e) => updateLine(line.key, { total: Number(e.target.value) })}
                        />
                      </TableCell>
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
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          <div className="flex items-center justify-between">
            <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={addLine}>
              <Plus className="size-4" />
              Añadir línea
            </Button>
            <p className="text-sm text-slate-500">
              Suma líneas: <span className="font-semibold text-slate-900">{formatEUR(linesSum)}</span>
            </p>
          </div>

          <input type="hidden" name="status" value={status} />

          <div className="flex items-center justify-between gap-2 pt-2">
            {isEdit && receivedInvoice ? (
              <div className="flex items-center gap-2">
                <DeleteConfirmButton
                  description="Se eliminará esta factura recibida."
                  onConfirm={() => deleteReceivedInvoice(receivedInvoice.id)}
                />
                {status !== "VERIFICADA" ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => markReceivedInvoiceVerified(receivedInvoice.id)}
                  >
                    Marcar como verificada
                  </Button>
                ) : null}
              </div>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Link href="/facturacion/recibidas">
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </Link>
              <Button type="submit" disabled={pending} className="bg-emerald-600 hover:bg-emerald-700">
                {pending ? "Guardando..." : "Guardar factura"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
