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
import { SPANISH_REGIONS } from "@/lib/validations/client";
import { createClient, updateClient, type ClientFormState } from "./actions";

export type ClientRecord = {
  id: string;
  isCompany: boolean;
  firstName: string;
  lastName: string | null;
  taxId: string | null;
  clientCode: string | null;
  birthDate: Date | null;
  mobilePhone: string | null;
  landlinePhone: string | null;
  email: string | null;
  address: string | null;
  postalCode: string | null;
  city: string | null;
  province: string | null;
  region: string | null;
  country: string;
  notes: string | null;
  whatsappOptIn: boolean;
  equivalenceSurcharge: boolean;
  tags: { tag: { name: string } }[];
};

const initialState: ClientFormState = {};

function dateInputValue(date: Date | null) {
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}

export function ClientFormDialog({
  client,
  trigger,
}: {
  client?: ClientRecord;
  trigger: React.ReactElement;
}) {
  const [open, setOpen] = useState(false);
  const action = client ? updateClient.bind(null, client.id) : createClient;
  const [state, formAction, pending] = useActionState(action, initialState);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && state.success) {
      setOpen(false);
    }
    wasPending.current = pending;
  }, [pending, state]);

  const isEdit = Boolean(client);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar cliente" : "Nuevo cliente"}</DialogTitle>
        </DialogHeader>

        <form
          key={client?.id ?? "new"}
          action={formAction}
          className="space-y-4"
        >
          {state.error ? (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {state.error}
            </p>
          ) : null}

          <div className="flex items-center gap-2">
            <Checkbox
              id="isCompany"
              name="isCompany"
              defaultChecked={client?.isCompany}
            />
            <Label htmlFor="isCompany">Es empresa</Label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="firstName">Nombre *</Label>
              <Input
                id="firstName"
                name="firstName"
                required
                defaultValue={client?.firstName}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="lastName">Apellidos</Label>
              <Input
                id="lastName"
                name="lastName"
                defaultValue={client?.lastName ?? ""}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="taxId">NIF / DNI / CIF</Label>
              <Input id="taxId" name="taxId" defaultValue={client?.taxId ?? ""} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="clientCode">Código de cliente</Label>
              <Input
                id="clientCode"
                name="clientCode"
                defaultValue={client?.clientCode ?? ""}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="birthDate">Fecha nacimiento</Label>
              <Input
                id="birthDate"
                name="birthDate"
                type="date"
                defaultValue={dateInputValue(client?.birthDate ?? null)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="mobilePhone">Móvil</Label>
              <Input
                id="mobilePhone"
                name="mobilePhone"
                defaultValue={client?.mobilePhone ?? ""}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="landlinePhone">Fijo</Label>
              <Input
                id="landlinePhone"
                name="landlinePhone"
                defaultValue={client?.landlinePhone ?? ""}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={client?.email ?? ""}
              />
            </div>

            <div className="col-span-2 space-y-1">
              <Label htmlFor="address">Dirección</Label>
              <Input id="address" name="address" defaultValue={client?.address ?? ""} />
            </div>

            <div className="space-y-1">
              <Label htmlFor="postalCode">Código postal</Label>
              <Input
                id="postalCode"
                name="postalCode"
                defaultValue={client?.postalCode ?? ""}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="city">Localidad</Label>
              <Input id="city" name="city" defaultValue={client?.city ?? ""} />
            </div>

            <div className="space-y-1">
              <Label htmlFor="province">Provincia</Label>
              <Input id="province" name="province" defaultValue={client?.province ?? ""} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="region">Comunidad Autónoma</Label>
              <select
                id="region"
                name="region"
                defaultValue={client?.region ?? ""}
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
              >
                <option value="">—</option>
                {SPANISH_REGIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="country">País</Label>
              <Input
                id="country"
                name="country"
                defaultValue={client?.country ?? "ES"}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="tags">Etiquetas (separadas por coma)</Label>
              <Input
                id="tags"
                name="tags"
                defaultValue={client?.tags.map((t) => t.tag.name).join(", ") ?? ""}
              />
            </div>

            <div className="col-span-2 space-y-1">
              <Label htmlFor="notes">Observaciones</Label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                defaultValue={client?.notes ?? ""}
                className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="whatsappOptIn"
              name="whatsappOptIn"
              defaultChecked={client ? client.whatsappOptIn : true}
            />
            <Label htmlFor="whatsappOptIn">Comunicación por WhatsApp</Label>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="equivalenceSurcharge"
              name="equivalenceSurcharge"
              defaultChecked={client?.equivalenceSurcharge}
            />
            <Label htmlFor="equivalenceSurcharge">
              En recargo de equivalencia (solo minoristas; aplica recargo a
              productos en sus facturas)
            </Label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={pending}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {pending ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear cliente"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
