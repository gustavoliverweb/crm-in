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
import { formatDateInput } from "./agenda-utils";
import { createScheduleBlock, type AgendaFormState } from "./actions";
import type { StaffOption } from "./appointment-form-dialog";

export type ScheduleBlockRecord = {
  id: string;
  scope: "EMPLEADO" | "NEGOCIO";
  employeeId: string | null;
  employeeName: string | null;
  date: Date;
  startTime: string;
  endTime: string;
  reason: string | null;
};

const initialState: AgendaFormState = {};

export function ScheduleBlockFormDialog({
  open,
  onOpenChange,
  defaultDate,
  staffOptions,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDate?: Date;
  staffOptions: StaffOption[];
}) {
  const [state, formAction, pending] = useActionState(createScheduleBlock, initialState);
  const wasPending = useRef(false);
  const [scope, setScope] = useState<"EMPLEADO" | "NEGOCIO">("EMPLEADO");

  useEffect(() => {
    if (wasPending.current && !pending && state.success) {
      onOpenChange(false);
    }
    wasPending.current = pending;
  }, [pending, state, onOpenChange]);

  useEffect(() => {
    if (open) setScope("EMPLEADO");
  }, [open]);

  const baseDate = defaultDate ?? new Date();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bloquear horario</DialogTitle>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          {state.error ? (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
          ) : null}

          <div className="space-y-1">
            <Label>Alcance</Label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-1.5 text-sm">
                <input
                  type="radio"
                  name="scope"
                  value="EMPLEADO"
                  checked={scope === "EMPLEADO"}
                  onChange={() => setScope("EMPLEADO")}
                  className="accent-indigo-600"
                />
                Un empleado
              </label>
              <label className="flex items-center gap-1.5 text-sm">
                <input
                  type="radio"
                  name="scope"
                  value="NEGOCIO"
                  checked={scope === "NEGOCIO"}
                  onChange={() => setScope("NEGOCIO")}
                  className="accent-indigo-600"
                />
                Todo el negocio
              </label>
            </div>
          </div>

          {scope === "EMPLEADO" ? (
            <div className="space-y-1">
              <Label htmlFor="employeeId">Empleado</Label>
              {staffOptions.length === 0 ? (
                <p className="text-sm text-slate-400">Sin personal.</p>
              ) : (
                <select
                  id="employeeId"
                  name="employeeId"
                  className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
                >
                  <option value="">Selecciona...</option>
                  {staffOptions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          ) : null}

          <div className="space-y-1">
            <Label htmlFor="date">Fecha</Label>
            <Input id="date" name="date" type="date" defaultValue={formatDateInput(baseDate)} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="startTime">Desde</Label>
              <Input id="startTime" name="startTime" type="time" defaultValue="14:00" required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="endTime">Hasta</Label>
              <Input id="endTime" name="endTime" type="time" defaultValue="15:00" required />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="reason">Motivo (opcional)</Label>
            <Input id="reason" name="reason" placeholder="Comida, reunión, médico..." />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending} className="bg-indigo-600 hover:bg-indigo-700">
              {pending ? "Bloqueando..." : "Bloquear"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
