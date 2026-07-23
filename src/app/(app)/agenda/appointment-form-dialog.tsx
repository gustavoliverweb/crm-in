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
} from "@/components/ui/dialog";
import { DeleteConfirmButton } from "@/components/delete-confirm-button";
import {
  ClientSearchField,
  type ClientOption,
} from "@/components/client-search-field";
import {
  formatDateInput,
  formatTimeInput,
  addMinutesToTime,
} from "./agenda-utils";
import {
  createAppointment,
  updateAppointment,
  deleteAppointment,
  type AgendaFormState,
} from "./actions";

export type AppointmentRecord = {
  id: string;
  startsAt: Date;
  durationMinutes: number;
  location: string | null;
  videoCallUrl: string | null;
  notes: string | null;
  status: "PENDIENTE" | "CONFIRMADA" | "CANCELADA" | "COMPLETADA";
  catalogItemId: string | null;
  professionalId: string | null;
  clientId: string | null;
  clientName: string | null;
  serviceName: string | null;
  professionalName: string | null;
};

export type ServiceOption = {
  id: string;
  name: string;
  durationMinutes: number | null;
};
export type StaffOption = { id: string; name: string };
export type { ClientOption };

const initialState: AgendaFormState = {};

export function AppointmentFormDialog({
  open,
  onOpenChange,
  item,
  defaultDate,
  serviceOptions,
  staffOptions,
  clientOptions,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: AppointmentRecord;
  defaultDate?: Date;
  serviceOptions: ServiceOption[];
  staffOptions: StaffOption[];
  clientOptions: ClientOption[];
}) {
  const isEdit = Boolean(item);
  const action = item
    ? updateAppointment.bind(null, item.id)
    : createAppointment;
  const [state, formAction, pending] = useActionState(action, initialState);
  const wasPending = useRef(false);

  const baseDate = item?.startsAt ?? defaultDate ?? new Date();
  const [time, setTime] = useState(formatTimeInput(baseDate));
  const [duration, setDuration] = useState(item?.durationMinutes ?? 60);
  const [selectedClient, setSelectedClient] = useState<{
    id: string;
    name: string;
  } | null>(
    item?.clientId && item.clientName
      ? { id: item.clientId, name: item.clientName }
      : null,
  );

  useEffect(() => {
    if (wasPending.current && !pending && state.success) {
      onOpenChange(false);
    }
    wasPending.current = pending;
  }, [pending, state, onOpenChange]);

  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      const d = item?.startsAt ?? defaultDate ?? new Date();
      setTime(formatTimeInput(d));
      setDuration(item?.durationMinutes ?? 60);
      setSelectedClient(
        item?.clientId && item.clientName
          ? { id: item.clientId, name: item.clientName }
          : null,
      );
    }
  }

  const endTime = addMinutesToTime(time, duration);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar cita" : "Nueva cita"}</DialogTitle>
        </DialogHeader>

        <form key={item?.id ?? "new"} action={formAction} className="space-y-4">
          {state.error ? (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {state.error}
            </p>
          ) : null}

          <div className="space-y-1">
            <Label htmlFor="catalogItemId">Servicio</Label>
            <select
              id="catalogItemId"
              name="catalogItemId"
              defaultValue={item?.catalogItemId ?? ""}
              onChange={(e) => {
                const svc = serviceOptions.find((s) => s.id === e.target.value);
                if (svc?.durationMinutes) setDuration(svc.durationMinutes);
              }}
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
            >
              <option value="">Selecciona...</option>
              {serviceOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="professionalId">Profesional</Label>
            <select
              id="professionalId"
              name="professionalId"
              defaultValue={item?.professionalId ?? ""}
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
            >
              <option value="">Selecciona...</option>
              {staffOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <Label>Cliente</Label>
            <ClientSearchField
              options={clientOptions}
              value={selectedClient}
              onChange={setSelectedClient}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label htmlFor="date">Fecha</Label>
              <Input
                id="date"
                name="date"
                type="date"
                defaultValue={formatDateInput(baseDate)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="time">Hora</Label>
              <Input
                id="time"
                name="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="durationMinutes">Duración (min)</Label>
              <Input
                id="durationMinutes"
                name="durationMinutes"
                type="number"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
              />
            </div>
          </div>
          <p className="-mt-2 text-xs text-slate-400">
            Termina a las {endTime}
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="location">Ubicación (opcional)</Label>
              <Input
                id="location"
                name="location"
                placeholder="Dirección o «Online»"
                defaultValue={item?.location ?? ""}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="videoCallUrl">Videollamada (opcional)</Label>
              <Input
                id="videoCallUrl"
                name="videoCallUrl"
                placeholder="Enlace de Meet/Zoom..."
                defaultValue={item?.videoCallUrl ?? ""}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              placeholder="Observaciones para esta cita..."
              defaultValue={item?.notes ?? ""}
              className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm"
            />
          </div>

          {isEdit ? (
            <div className="space-y-1">
              <Label htmlFor="status">Estado</Label>
              <select
                id="status"
                name="status"
                defaultValue={item?.status}
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
              >
                <option value="PENDIENTE">Pendiente</option>
                <option value="CONFIRMADA">Confirmada</option>
                <option value="CANCELADA">Cancelada</option>
                <option value="COMPLETADA">Completada</option>
              </select>
            </div>
          ) : (
            <input type="hidden" name="status" value="PENDIENTE" />
          )}

          <div className="flex items-center justify-between gap-2 pt-2">
            {isEdit && item ? (
              <DeleteConfirmButton
                description="Se eliminará esta cita."
                onConfirm={async () => {
                  await deleteAppointment(item.id);
                  onOpenChange(false);
                }}
              />
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cerrar
              </Button>
              <Button
                type="submit"
                disabled={pending}
                className="bg-primary hover:bg-[#00A3A8]"
              >
                {pending
                  ? "Guardando..."
                  : isEdit
                    ? "Guardar cambios"
                    : "Crear cita"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
