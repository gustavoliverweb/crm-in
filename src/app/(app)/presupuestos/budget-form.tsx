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
import { formatDateInput } from "@/lib/date-utils";
import { BUDGET_STATUS_LABEL } from "@/lib/validations/budget";
import { computeBudgetTotals, formatEUR } from "./budget-utils";
import { createBudget, updateBudget, deleteBudget, type BudgetFormState } from "./actions";

export type CatalogOption = {
  id: string;
  name: string;
  basePrice: number;
  vatRate: number;
};

export type StaffOption = { id: string; name: string };

export type BudgetRecord = {
  id: string;
  number: string | null;
  clientId: string | null;
  clientName: string | null;
  validUntil: Date | null;
  irpfRate: number;
  salespersonId: string | null;
  paymentTerms: string | null;
  notes: string | null;
  discountPct: number;
  status: "BORRADOR" | "ENVIADO" | "ACEPTADO" | "RECHAZADO" | "CADUCADO";
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

const initialState: BudgetFormState = {};

export function BudgetForm({
  budget,
  serviceOptions,
  productOptions,
  staffOptions,
  clientOptions,
}: {
  budget?: BudgetRecord;
  serviceOptions: CatalogOption[];
  productOptions: CatalogOption[];
  staffOptions: StaffOption[];
  clientOptions: ClientOption[];
}) {
  const isEdit = Boolean(budget);
  const action = budget ? updateBudget.bind(null, budget.id) : createBudget;
  const [state, formAction, pending] = useActionState(action, initialState);

  const nextKey = useRef((budget?.lines ?? []).length);
  const [lines, setLines] = useState<DraftLine[]>(() =>
    (budget?.lines ?? []).map((l, i) => ({ ...l, key: i })),
  );
  const [discountPct, setDiscountPct] = useState(budget?.discountPct ?? 0);
  const [selectedClient, setSelectedClient] = useState<{ id: string; name: string } | null>(
    budget?.clientId && budget.clientName ? { id: budget.clientId, name: budget.clientName } : null,
  );

  function addCatalogLine(item: CatalogOption) {
    setLines((prev) => [
      ...prev,
      {
        key: nextKey.current++,
        catalogItemId: item.id,
        description: item.name,
        quantity: 1,
        unitPrice: item.basePrice,
        discountPct: 0,
        vatRate: item.vatRate,
      },
    ]);
  }

  function addBlankLine() {
    setLines((prev) => [
      ...prev,
      {
        key: nextKey.current++,
        catalogItemId: null,
        description: "",
        quantity: 1,
        unitPrice: 0,
        discountPct: 0,
        vatRate: 21,
      },
    ]);
  }

  function updateLine(key: number, patch: Partial<DraftLine>) {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }

  function removeLine(key: number) {
    setLines((prev) => prev.filter((l) => l.key !== key));
  }

  const totals = computeBudgetTotals(lines, discountPct);

  return (
    <div className="space-y-4">
      <Link href="/presupuestos" className="text-sm text-emerald-700 hover:underline">
        ← Volver a presupuestos
      </Link>

      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-900">
            {isEdit ? `Presupuesto ${budget?.number ?? "(borrador)"}` : "Nuevo presupuesto"}
          </h1>
          <Link href="/presupuestos">
            <Button variant="ghost" size="icon-sm">
              <X className="size-4" />
            </Button>
          </Link>
        </div>

        <form action={formAction} className="space-y-4">
          {state.error ? (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
          ) : null}

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label>Cliente</Label>
              <ClientSearchField
                options={clientOptions}
                value={selectedClient}
                onChange={setSelectedClient}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="validUntil">Válido hasta</Label>
              <Input
                id="validUntil"
                name="validUntil"
                type="date"
                defaultValue={budget?.validUntil ? formatDateInput(budget.validUntil) : ""}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="irpfRate">IRPF %</Label>
              <Input id="irpfRate" name="irpfRate" type="number" step="0.01" defaultValue={budget?.irpfRate ?? 0} />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="salespersonId">Comercial</Label>
            <select
              id="salespersonId"
              name="salespersonId"
              defaultValue={budget?.salespersonId ?? ""}
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm sm:w-64"
            >
              <option value="">— Sin asignar —</option>
              {staffOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <select
              value=""
              onChange={(e) => {
                const item = serviceOptions.find((s) => s.id === e.target.value);
                if (item) addCatalogLine(item);
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
                if (item) addCatalogLine(item);
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
          </div>

          <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={addBlankLine}>
            <Plus className="size-4" />
            Partida
          </Button>

          <div className="rounded-lg border border-slate-200">
            {lines.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">Sin partidas.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="w-20">Cant.</TableHead>
                    <TableHead className="w-28">Precio</TableHead>
                    <TableHead className="w-20">Dto %</TableHead>
                    <TableHead className="w-20">IVA %</TableHead>
                    <TableHead className="w-28">Total</TableHead>
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="paymentTerms">Forma de pago</Label>
              <textarea
                id="paymentTerms"
                name="paymentTerms"
                rows={3}
                placeholder={"1 PAGO ... A LA FORMALIZACIÓN\n2 PAGO ... A FINALIZAR"}
                defaultValue={budget?.paymentTerms ?? ""}
                className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="notes">Notas / condiciones</Label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                placeholder="Materiales, retenciones, garantías..."
                defaultValue={budget?.notes ?? ""}
                className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm"
              />
            </div>
          </div>

          {isEdit ? (
            <div className="space-y-1 sm:w-64">
              <Label htmlFor="status">Estado</Label>
              <select
                id="status"
                name="status"
                defaultValue={budget?.status}
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
              >
                {Object.entries(BUDGET_STATUS_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <input type="hidden" name="status" value="BORRADOR" />
          )}

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
            {isEdit && budget ? (
              <DeleteConfirmButton
                description="Se eliminará este presupuesto."
                onConfirm={() => deleteBudget(budget.id)}
              />
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Link href="/presupuestos">
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
                disabled={pending}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {pending ? "Guardando..." : "Confirmar y numerar"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
