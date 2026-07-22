"use client";

import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DeleteConfirmButton } from "@/components/delete-confirm-button";
import type { ClientOption } from "@/components/client-search-field";
import { EXPEDIENTE_STATUS_LABEL } from "@/lib/validations/expediente";
import {
  ExpedienteFormDialog,
  type ExpedienteRecord,
  type StaffOption,
} from "./expediente-form-dialog";
import { CsvImportDialog } from "./csv-import-dialog";
import { deleteExpediente } from "./actions";

const STATUS_STYLES: Record<ExpedienteRecord["status"], string> = {
  ABIERTO: "bg-emerald-100 text-emerald-800",
  EN_PROCESO: "bg-blue-100 text-blue-800",
  CERRADO: "bg-slate-100 text-slate-600",
};

export function ExpedientesView({
  expedientes,
  clientOptions,
  staffOptions,
}: {
  expedientes: ExpedienteRecord[];
  clientOptions: ClientOption[];
  staffOptions: StaffOption[];
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return expedientes;
    return expedientes.filter((e) =>
      [e.name, e.number, e.clientName].filter(Boolean).some((v) => v!.toLowerCase().includes(q)),
    );
  }, [expedientes, query]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900">Expedientes</h1>
        <div className="flex items-center gap-2">
          <CsvImportDialog />
          <ExpedienteFormDialog
            clientOptions={clientOptions}
            staffOptions={staffOptions}
            trigger={
              <Button size="sm" className="gap-1.5 bg-indigo-600 hover:bg-indigo-700">
                <Plus className="size-4" />
                Nuevo expediente
              </Button>
            }
          />
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder="Buscar por nombre, código o cliente..."
          className="pl-8"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="rounded-lg border border-slate-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Expediente</TableHead>
              <TableHead>Detalle</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-slate-400">
                  Sin expedientes.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((expediente) => (
                <TableRow key={expediente.id}>
                  <TableCell className="font-medium">
                    <ExpedienteFormDialog
                      expediente={expediente}
                      clientOptions={clientOptions}
                      staffOptions={staffOptions}
                      trigger={<button className="hover:underline">{expediente.name}</button>}
                    />
                    {expediente.number ? (
                      <span className="ml-1 text-xs text-slate-400">#{expediente.number}</span>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {[expediente.type, expediente.vatRegime].filter(Boolean).join(" · ") || "—"}
                  </TableCell>
                  <TableCell>{expediente.clientName ?? "—"}</TableCell>
                  <TableCell>
                    <Badge className={STATUS_STYLES[expediente.status]}>
                      {EXPEDIENTE_STATUS_LABEL[expediente.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DeleteConfirmButton
                      description={`Se eliminará el expediente ${expediente.name}.`}
                      onConfirm={() => deleteExpediente(expediente.id)}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
