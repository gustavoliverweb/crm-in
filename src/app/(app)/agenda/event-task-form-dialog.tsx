"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DeleteConfirmButton } from "@/components/delete-confirm-button";
import { cn } from "@/lib/utils";
import { formatDateInput, formatTimeInput } from "./agenda-utils";
import {
  createEvent,
  updateEvent,
  deleteEvent,
  createTask,
  updateTask,
  deleteTask,
  type AgendaFormState,
} from "./actions";
import type { StaffOption } from "./appointment-form-dialog";

export type EventRecord = {
  id: string;
  title: string;
  allDay: boolean;
  startsAt: Date;
  durationMinutes: number;
  staffUserIds: string[];
  externalGuestEmails: string[];
  location: string | null;
  videoCallUrl: string | null;
  notes: string | null;
};

export type TaskRecord = {
  id: string;
  title: string;
  allDay: boolean;
  startsAt: Date;
  durationMinutes: number;
  assigneeId: string | null;
  assigneeName: string | null;
  notes: string | null;
  completed: boolean;
};

const initialState: AgendaFormState = {};

function EventForm({
  item,
  defaultDate,
  staffOptions,
  onClose,
}: {
  item?: EventRecord;
  defaultDate?: Date;
  staffOptions: StaffOption[];
  onClose: () => void;
}) {
  const isEdit = Boolean(item);
  const action = item ? updateEvent.bind(null, item.id) : createEvent;
  const [state, formAction, pending] = useActionState(action, initialState);
  const wasPending = useRef(false);
  const [allDay, setAllDay] = useState(item?.allDay ?? false);
  const [guestEmails, setGuestEmails] = useState<string[]>(
    item?.externalGuestEmails.length ? item.externalGuestEmails : [""],
  );

  useEffect(() => {
    if (wasPending.current && !pending && state.success) onClose();
    wasPending.current = pending;
  }, [pending, state, onClose]);

  const baseDate = item?.startsAt ?? defaultDate ?? new Date();

  return (
    <form key={item?.id ?? "new-event"} action={formAction} className="space-y-4">
      {state.error ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      ) : null}

      <div className="space-y-1">
        <Label htmlFor="title">Título</Label>
        <Input
          id="title"
          name="title"
          required
          placeholder="Ej. Reunión de equipo"
          defaultValue={item?.title}
        />
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="allDay"
          name="allDay"
          checked={allDay}
          onCheckedChange={(v) => setAllDay(Boolean(v))}
        />
        <Label htmlFor="allDay">Todo el día</Label>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1">
          <Label htmlFor="date">Fecha</Label>
          <Input id="date" name="date" type="date" defaultValue={formatDateInput(baseDate)} required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="time">Hora</Label>
          <Input
            id="time"
            name="time"
            type="time"
            defaultValue={formatTimeInput(baseDate)}
            disabled={allDay}
            required
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="durationMinutes">Duración (min)</Label>
          <Input
            id="durationMinutes"
            name="durationMinutes"
            type="number"
            defaultValue={item?.durationMinutes ?? 60}
            disabled={allDay}
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label>Incluir personal</Label>
        {staffOptions.length === 0 ? (
          <p className="text-sm text-slate-400">Sin personal.</p>
        ) : (
          <div className="space-y-1.5 rounded-lg border border-slate-200 p-2">
            {staffOptions.map((s) => (
              <label key={s.id} className="flex items-center gap-2 text-sm">
                <Checkbox
                  name="staffUserIds"
                  value={s.id}
                  defaultChecked={item?.staffUserIds.includes(s.id)}
                />
                {s.name}
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-1">
        <Label>Invitados externos (email)</Label>
        <div className="space-y-2">
          {guestEmails.map((email, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                name="externalGuestEmails"
                type="email"
                placeholder="cliente@email.com"
                value={email}
                onChange={(e) =>
                  setGuestEmails((prev) => prev.map((v, idx) => (idx === i ? e.target.value : v)))
                }
              />
              {guestEmails.length > 1 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="text-slate-400 hover:text-red-600"
                  onClick={() => setGuestEmails((prev) => prev.filter((_, idx) => idx !== i))}
                >
                  <X className="size-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  onClick={() => setGuestEmails((prev) => [...prev, ""])}
                >
                  <Plus className="size-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="location">Ubicación</Label>
          <Input id="location" name="location" placeholder="Sala / dirección / Online" defaultValue={item?.location ?? ""} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="videoCallUrl">Videollamada</Label>
          <Input id="videoCallUrl" name="videoCallUrl" placeholder="Enlace de Meet/Zoom..." defaultValue={item?.videoCallUrl ?? ""} />
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="notes">Notas (opcional)</Label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={item?.notes ?? ""}
          className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm"
        />
      </div>

      <div className="flex items-center justify-between gap-2 pt-2">
        {isEdit && item ? (
          <DeleteConfirmButton
            description="Se eliminará esta reunión/evento."
            onConfirm={async () => {
              await deleteEvent(item.id);
              onClose();
            }}
          />
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cerrar
          </Button>
          <Button type="submit" disabled={pending} className="bg-emerald-600 hover:bg-emerald-700">
            {pending ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear"}
          </Button>
        </div>
      </div>
    </form>
  );
}

function TaskForm({
  item,
  defaultDate,
  staffOptions,
  onClose,
}: {
  item?: TaskRecord;
  defaultDate?: Date;
  staffOptions: StaffOption[];
  onClose: () => void;
}) {
  const isEdit = Boolean(item);
  const action = item ? updateTask.bind(null, item.id) : createTask;
  const [state, formAction, pending] = useActionState(action, initialState);
  const wasPending = useRef(false);
  const [allDay, setAllDay] = useState(item?.allDay ?? false);

  useEffect(() => {
    if (wasPending.current && !pending && state.success) onClose();
    wasPending.current = pending;
  }, [pending, state, onClose]);

  const baseDate = item?.startsAt ?? defaultDate ?? new Date();

  return (
    <form key={item?.id ?? "new-task"} action={formAction} className="space-y-4">
      {state.error ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      ) : null}

      <div className="space-y-1">
        <Label htmlFor="title">Título</Label>
        <Input
          id="title"
          name="title"
          required
          placeholder="Ej. Llamar al proveedor"
          defaultValue={item?.title}
        />
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="allDay"
          name="allDay"
          checked={allDay}
          onCheckedChange={(v) => setAllDay(Boolean(v))}
        />
        <Label htmlFor="allDay">Todo el día</Label>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1">
          <Label htmlFor="date">Fecha</Label>
          <Input id="date" name="date" type="date" defaultValue={formatDateInput(baseDate)} required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="time">Hora</Label>
          <Input
            id="time"
            name="time"
            type="time"
            defaultValue={formatTimeInput(baseDate)}
            disabled={allDay}
            required
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="durationMinutes">Duración (min)</Label>
          <Input
            id="durationMinutes"
            name="durationMinutes"
            type="number"
            defaultValue={item?.durationMinutes ?? 60}
            disabled={allDay}
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="assigneeId">Asignado a (opcional)</Label>
        {staffOptions.length === 0 ? (
          <p className="text-sm text-slate-400">Sin personal.</p>
        ) : (
          <select
            id="assigneeId"
            name="assigneeId"
            defaultValue={item?.assigneeId ?? ""}
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

      <div className="space-y-1">
        <Label htmlFor="notes">Notas (opcional)</Label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={item?.notes ?? ""}
          className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm"
        />
      </div>

      <div className="flex items-center justify-between gap-2 pt-2">
        {isEdit && item ? (
          <DeleteConfirmButton
            description="Se eliminará esta tarea."
            onConfirm={async () => {
              await deleteTask(item.id);
              onClose();
            }}
          />
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cerrar
          </Button>
          <Button type="submit" disabled={pending} className="bg-emerald-600 hover:bg-emerald-700">
            {pending ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear"}
          </Button>
        </div>
      </div>
    </form>
  );
}

export function EventTaskFormDialog({
  open,
  onOpenChange,
  initialKind = "evento",
  defaultDate,
  eventItem,
  taskItem,
  staffOptions,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialKind?: "evento" | "tarea";
  defaultDate?: Date;
  eventItem?: EventRecord;
  taskItem?: TaskRecord;
  staffOptions: StaffOption[];
}) {
  const isEdit = Boolean(eventItem) || Boolean(taskItem);
  const [kind, setKind] = useState<"evento" | "tarea">(
    eventItem ? "evento" : taskItem ? "tarea" : initialKind,
  );

  useEffect(() => {
    if (open) setKind(eventItem ? "evento" : taskItem ? "tarea" : initialKind);
  }, [open, eventItem, taskItem, initialKind]);

  const title = isEdit
    ? kind === "evento"
      ? "Editar reunión"
      : "Editar tarea"
    : kind === "evento"
      ? "Nueva reunión"
      : "Nueva tarea";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {!isEdit ? (
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setKind("evento")}
              className={cn(
                "rounded-md py-1.5 text-sm font-medium transition-colors",
                kind === "evento" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500",
              )}
            >
              Reunión / Evento
            </button>
            <button
              type="button"
              onClick={() => setKind("tarea")}
              className={cn(
                "rounded-md py-1.5 text-sm font-medium transition-colors",
                kind === "tarea" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500",
              )}
            >
              Tarea
            </button>
          </div>
        ) : null}

        {kind === "evento" ? (
          <EventForm
            item={eventItem}
            defaultDate={defaultDate}
            staffOptions={staffOptions}
            onClose={() => onOpenChange(false)}
          />
        ) : (
          <TaskForm
            item={taskItem}
            defaultDate={defaultDate}
            staffOptions={staffOptions}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
