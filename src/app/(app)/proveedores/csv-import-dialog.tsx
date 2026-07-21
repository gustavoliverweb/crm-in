"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { importProvidersCsv, type ImportState } from "./actions";

const initialState: ImportState = {};

export function CsvImportDialog() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(importProvidersCsv, initialState);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && state.imported !== undefined) {
      setTimeout(() => setOpen(false), 1200);
    }
    wasPending.current = pending;
  }, [pending, state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" className="gap-1.5" />}>
        <Upload className="size-4" />
        Importar
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Importar proveedores desde CSV</DialogTitle>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <p className="text-sm text-slate-500">
            Columnas admitidas: Nombre, CIF/NIF, Email, Teléfono, Dirección, Código Postal,
            Ciudad, Provincia, País, Notas.
          </p>

          <input type="file" name="file" accept=".csv,text/csv" required className="w-full text-sm" />

          {state.error ? (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
          ) : null}

          {state.imported !== undefined ? (
            <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {state.imported} proveedores importados.
            </p>
          ) : null}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cerrar
            </Button>
            <Button type="submit" disabled={pending} className="bg-emerald-600 hover:bg-emerald-700">
              {pending ? "Importando..." : "Importar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
