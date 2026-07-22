"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CATALOG_TYPE_LABEL } from "@/lib/validations/catalog-item";
import {
  createCatalogItem,
  updateCatalogItem,
  type CatalogItemFormState,
} from "./actions";

export type CatalogItemType = "SERVICIO" | "PRODUCTO" | "EXTRA";

export type CatalogItemRecord = {
  id: string;
  type: CatalogItemType;
  name: string;
  durationMinutes: number | null;
  bufferMinutes: number | null;
  basePrice: number;
  vatRate: number;
  active: boolean;
  allowedTimes: string[];
  maxPerSlot: number | null;
  conditions: string | null;
  sku: string | null;
  stock: number | null;
};

const initialState: CatalogItemFormState = {};

export function CatalogFormDialog({
  type,
  item,
  trigger,
}: {
  type: CatalogItemType;
  item?: CatalogItemRecord;
  trigger: React.ReactElement;
}) {
  const [open, setOpen] = useState(false);
  const action = item ? updateCatalogItem.bind(null, item.id) : createCatalogItem;
  const [state, formAction, pending] = useActionState(action, initialState);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && state.success) {
      setOpen(false);
    }
    wasPending.current = pending;
  }, [pending, state]);

  const isEdit = Boolean(item);
  const label = CATALOG_TYPE_LABEL[type];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? `Editar ${label}` : `Nuevo ${label}`}
          </DialogTitle>
        </DialogHeader>

        <form key={item?.id ?? "new"} action={formAction} className="space-y-4">
          <input type="hidden" name="type" value={type} />

          {state.error ? (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {state.error}
            </p>
          ) : null}

          <div className="space-y-1">
            <Label htmlFor="name">Nombre *</Label>
            <Input id="name" name="name" required defaultValue={item?.name} />
          </div>

          {type === "SERVICIO" ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="durationMinutes">Duración (min)</Label>
                <Input
                  id="durationMinutes"
                  name="durationMinutes"
                  type="number"
                  defaultValue={item?.durationMinutes ?? 60}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="bufferMinutes">Margen (min)</Label>
                <Input
                  id="bufferMinutes"
                  name="bufferMinutes"
                  type="number"
                  defaultValue={item?.bufferMinutes ?? 0}
                />
              </div>
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="basePrice">Precio base (€)</Label>
              <Input
                id="basePrice"
                name="basePrice"
                type="number"
                step="0.01"
                defaultValue={Number(item?.basePrice ?? 0)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="vatRate">IVA (%)</Label>
              <Input
                id="vatRate"
                name="vatRate"
                type="number"
                step="0.01"
                defaultValue={Number(item?.vatRate ?? 21)}
              />
            </div>
          </div>

          {type === "PRODUCTO" ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="sku">SKU</Label>
                <Input id="sku" name="sku" defaultValue={item?.sku ?? ""} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="stock">Stock</Label>
                <Input
                  id="stock"
                  name="stock"
                  type="number"
                  defaultValue={item?.stock ?? ""}
                />
              </div>
            </div>
          ) : null}

          <div className="flex items-center gap-2">
            <Checkbox
              id="active"
              name="active"
              defaultChecked={item ? item.active : true}
            />
            <Label htmlFor="active">Activo</Label>
          </div>

          {type === "SERVICIO" ? (
            <div className="space-y-4 border-t border-slate-100 pt-4">
              <p className="text-xs font-medium tracking-wide text-slate-400 uppercase">
                Reglas de reserva (opcional)
              </p>

              <div className="space-y-1">
                <Label htmlFor="allowedTimes">
                  Horas permitidas (separadas por coma)
                </Label>
                <Input
                  id="allowedTimes"
                  name="allowedTimes"
                  placeholder="09:30, 16:30"
                  defaultValue={item?.allowedTimes.join(", ") ?? ""}
                />
                <p className="text-xs text-slate-400">
                  Vacío = se puede agendar a cualquier hora.
                </p>
              </div>

              <div className="space-y-1">
                <Label htmlFor="maxPerSlot">Máximo por franja</Label>
                <Input
                  id="maxPerSlot"
                  name="maxPerSlot"
                  type="number"
                  placeholder="sin límite"
                  defaultValue={item?.maxPerSlot ?? ""}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="conditions">Condiciones a mostrar</Label>
                <textarea
                  id="conditions"
                  name="conditions"
                  rows={2}
                  placeholder="Dueño presente, sin sedación..."
                  defaultValue={item?.conditions ?? ""}
                  className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm"
                />
              </div>
            </div>
          ) : null}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={pending}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {pending ? "Guardando..." : isEdit ? "Guardar cambios" : `Crear ${label}`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
