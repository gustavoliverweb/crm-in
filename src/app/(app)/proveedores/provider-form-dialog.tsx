"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createProvider, updateProvider, type ProviderFormState } from "./actions";

export type ProviderRecord = {
  id: string;
  name: string;
  taxId: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  postalCode: string | null;
  city: string | null;
  province: string | null;
  country: string;
  notes: string | null;
};

const initialState: ProviderFormState = {};

export function ProviderFormDialog({
  provider,
  trigger,
}: {
  provider?: ProviderRecord;
  trigger: React.ReactElement;
}) {
  const [open, setOpen] = useState(false);
  const action = provider ? updateProvider.bind(null, provider.id) : createProvider;
  const [state, formAction, pending] = useActionState(action, initialState);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && state.success) {
      setOpen(false);
    }
    wasPending.current = pending;
  }, [pending, state]);

  const isEdit = Boolean(provider);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar proveedor" : "Nuevo proveedor"}</DialogTitle>
        </DialogHeader>

        <form key={provider?.id ?? "new"} action={formAction} className="space-y-4">
          {state.error ? (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
          ) : null}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1">
              <Label htmlFor="name">Nombre *</Label>
              <Input id="name" name="name" required defaultValue={provider?.name} />
            </div>

            <div className="space-y-1">
              <Label htmlFor="taxId">CIF/NIF</Label>
              <Input id="taxId" name="taxId" defaultValue={provider?.taxId ?? ""} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" defaultValue={provider?.email ?? ""} />
            </div>

            <div className="space-y-1">
              <Label htmlFor="phone">Teléfono</Label>
              <Input id="phone" name="phone" defaultValue={provider?.phone ?? ""} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="address">Dirección</Label>
              <Input id="address" name="address" defaultValue={provider?.address ?? ""} />
            </div>

            <div className="space-y-1">
              <Label htmlFor="postalCode">Código postal</Label>
              <Input id="postalCode" name="postalCode" defaultValue={provider?.postalCode ?? ""} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="city">Ciudad</Label>
              <Input id="city" name="city" defaultValue={provider?.city ?? ""} />
            </div>

            <div className="space-y-1">
              <Label htmlFor="province">Provincia</Label>
              <Input id="province" name="province" defaultValue={provider?.province ?? ""} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="country">País</Label>
              <Input id="country" name="country" defaultValue={provider?.country ?? "ES"} />
            </div>

            <div className="col-span-2 space-y-1">
              <Label htmlFor="notes">Notas</Label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                defaultValue={provider?.notes ?? ""}
                className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending} className="bg-indigo-600 hover:bg-indigo-700">
              {pending ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear proveedor"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
