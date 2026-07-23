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
import {
  createContact,
  updateContact,
  type ContactFormState,
} from "./contact-actions";

export type ContactRecord = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  clientId: string | null;
  notes: string | null;
};

const initialState: ContactFormState = {};

export function ContactFormDialog({
  contact,
  trigger,
}: {
  contact?: ContactRecord;
  trigger: React.ReactElement;
}) {
  const [open, setOpen] = useState(false);
  const action = contact ? updateContact.bind(null, contact.id) : createContact;
  const [state, formAction, pending] = useActionState(action, initialState);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && state.success) {
      setOpen(false);
    }
    wasPending.current = pending;
  }, [pending, state]);

  const isEdit = Boolean(contact);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar contacto" : "Nuevo contacto"}
          </DialogTitle>
        </DialogHeader>

        <form
          key={contact?.id ?? "new"}
          action={formAction}
          className="space-y-4"
        >
          {state.error ? (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {state.error}
            </p>
          ) : null}

          <div className="space-y-1">
            <Label htmlFor="name">Nombre *</Label>
            <Input
              id="name"
              name="name"
              required
              defaultValue={contact?.name}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={contact?.email ?? ""}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="phone">Teléfono</Label>
            <Input
              id="phone"
              name="phone"
              defaultValue={contact?.phone ?? ""}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="company">Empresa</Label>
            <Input
              id="company"
              name="company"
              defaultValue={contact?.company ?? ""}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="notes">Notas</Label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              defaultValue={contact?.notes ?? ""}
              className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm"
            />
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
              className="bg-primary hover:bg-[#00A3A8]"
            >
              {pending
                ? "Guardando..."
                : isEdit
                  ? "Guardar cambios"
                  : "Crear contacto"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
