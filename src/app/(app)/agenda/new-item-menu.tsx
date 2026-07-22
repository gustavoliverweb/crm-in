"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AppointmentFormDialog,
  type ServiceOption,
  type StaffOption,
  type ClientOption,
} from "./appointment-form-dialog";
import { EventTaskFormDialog } from "./event-task-form-dialog";
import { ScheduleBlockFormDialog } from "./schedule-block-form-dialog";

type DialogKey = "cita" | "reunion" | "tarea" | "bloqueo";

const OPTIONS: { key: DialogKey; icon: string; label: string }[] = [
  { key: "cita", icon: "📅", label: "Cita" },
  { key: "reunion", icon: "🤝", label: "Reunión / Evento" },
  { key: "tarea", icon: "📌", label: "Tarea" },
  { key: "bloqueo", icon: "🔒", label: "Bloquear horario" },
];

export function NewItemMenu({
  defaultDate,
  serviceOptions,
  staffOptions,
  clientOptions,
}: {
  defaultDate?: Date;
  serviceOptions: ServiceOption[];
  staffOptions: StaffOption[];
  clientOptions: ClientOption[];
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openDialog, setOpenDialog] = useState<DialogKey | null>(null);

  return (
    <>
      <Dialog open={menuOpen} onOpenChange={setMenuOpen}>
        <DialogTrigger
          render={
            <Button size="sm" className="gap-1.5 bg-indigo-600 hover:bg-indigo-700">
              <Plus className="size-4" />
              Nuevo
            </Button>
          }
        />
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Crear Nuevo</DialogTitle>
          </DialogHeader>
          <p className="-mt-2 text-sm text-slate-500">¿Qué quieres crear?</p>
          <div className="space-y-2">
            {OPTIONS.map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  setOpenDialog(opt.key);
                }}
                className="flex w-full items-center gap-2.5 rounded-lg border border-slate-200 px-3 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <span>{opt.icon}</span>
                {opt.label}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <AppointmentFormDialog
        open={openDialog === "cita"}
        onOpenChange={(v) => setOpenDialog(v ? "cita" : null)}
        defaultDate={defaultDate}
        serviceOptions={serviceOptions}
        staffOptions={staffOptions}
        clientOptions={clientOptions}
      />
      <EventTaskFormDialog
        open={openDialog === "reunion" || openDialog === "tarea"}
        onOpenChange={(v) => setOpenDialog(v ? openDialog : null)}
        initialKind={openDialog === "tarea" ? "tarea" : "evento"}
        defaultDate={defaultDate}
        staffOptions={staffOptions}
      />
      <ScheduleBlockFormDialog
        open={openDialog === "bloqueo"}
        onOpenChange={(v) => setOpenDialog(v ? "bloqueo" : null)}
        defaultDate={defaultDate}
        staffOptions={staffOptions}
      />
    </>
  );
}
