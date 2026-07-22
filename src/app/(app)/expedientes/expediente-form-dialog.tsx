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
import { ClientSearchField, type ClientOption } from "@/components/client-search-field";
import {
  EXPEDIENTE_STATUS_LABEL,
  EXPEDIENTE_TYPES,
  PERIODICITIES,
  VAT_REGIMES,
} from "@/lib/validations/expediente";
import { createExpediente, updateExpediente, type ExpedienteFormState } from "./actions";

export type ExpedienteRecord = {
  id: string;
  clientId: string | null;
  clientName: string | null;
  name: string;
  number: string | null;
  type: string | null;
  vatRegime: string | null;
  taxModels: string[];
  periodicity: string | null;
  ownerTaxId: string | null;
  responsibleId: string | null;
  status: "ABIERTO" | "EN_PROCESO" | "CERRADO";
  description: string | null;
  notes: string | null;
};

export type StaffOption = { id: string; name: string };

const initialState: ExpedienteFormState = {};
const selectClass = "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm";

export function ExpedienteFormDialog({
  expediente,
  clientOptions,
  staffOptions,
  trigger,
}: {
  expediente?: ExpedienteRecord;
  clientOptions: ClientOption[];
  staffOptions: StaffOption[];
  trigger: React.ReactElement;
}) {
  const [open, setOpen] = useState(false);
  const action = expediente ? updateExpediente.bind(null, expediente.id) : createExpediente;
  const [state, formAction, pending] = useActionState(action, initialState);
  const wasPending = useRef(false);
  const [selectedClient, setSelectedClient] = useState<{ id: string; name: string } | null>(
    expediente?.clientId && expediente.clientName
      ? { id: expediente.clientId, name: expediente.clientName }
      : null,
  );

  useEffect(() => {
    if (wasPending.current && !pending && state.success) {
      setOpen(false);
    }
    wasPending.current = pending;
  }, [pending, state]);

  const isEdit = Boolean(expediente);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar expediente" : "Nuevo expediente"}</DialogTitle>
        </DialogHeader>

        <form key={expediente?.id ?? "new"} action={formAction} className="space-y-4">
          {state.error ? (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
          ) : null}

          <div className="space-y-1">
            <Label>Cliente</Label>
            <ClientSearchField options={clientOptions} value={selectedClient} onChange={setSelectedClient} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1">
              <Label htmlFor="name">Nombre / referencia *</Label>
              <Input
                id="name"
                name="name"
                required
                placeholder="Ej. IRPF 2026 — Juan Pérez"
                defaultValue={expediente?.name}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="number">Nº expediente</Label>
              <Input id="number" name="number" defaultValue={expediente?.number ?? ""} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="type">Tipo</Label>
              <select id="type" name="type" defaultValue={expediente?.type ?? ""} className={selectClass}>
                <option value="">—</option>
                {EXPEDIENTE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="vatRegime">Régimen IVA</Label>
              <select
                id="vatRegime"
                name="vatRegime"
                defaultValue={expediente?.vatRegime ?? ""}
                className={selectClass}
              >
                <option value="">—</option>
                {VAT_REGIMES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="taxModels">Modelos</Label>
              <Input
                id="taxModels"
                name="taxModels"
                placeholder="303, 130, 111..."
                defaultValue={expediente?.taxModels.join(", ") ?? ""}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="periodicity">Periodicidad</Label>
              <select
                id="periodicity"
                name="periodicity"
                defaultValue={expediente?.periodicity ?? ""}
                className={selectClass}
              >
                <option value="">—</option>
                {PERIODICITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="ownerTaxId">NIF/CIF titular</Label>
              <Input id="ownerTaxId" name="ownerTaxId" defaultValue={expediente?.ownerTaxId ?? ""} />
            </div>

            <div className="space-y-1">
              <Label htmlFor="responsibleId">Responsable</Label>
              <select
                id="responsibleId"
                name="responsibleId"
                defaultValue={expediente?.responsibleId ?? ""}
                className={selectClass}
              >
                <option value="">Sin asignar</option>
                {staffOptions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="status">Estado</Label>
              <select
                id="status"
                name="status"
                defaultValue={expediente?.status ?? "ABIERTO"}
                className={selectClass}
              >
                {Object.entries(EXPEDIENTE_STATUS_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-span-2 space-y-1">
              <Label htmlFor="description">Descripción</Label>
              <textarea
                id="description"
                name="description"
                rows={2}
                defaultValue={expediente?.description ?? ""}
                className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm"
              />
            </div>

            <div className="col-span-2 space-y-1">
              <Label htmlFor="notes">Notas</Label>
              <textarea
                id="notes"
                name="notes"
                rows={2}
                defaultValue={expediente?.notes ?? ""}
                className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending} className="bg-indigo-600 hover:bg-indigo-700">
              {pending ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear expediente"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
