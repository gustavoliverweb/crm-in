"use client";

import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DeleteConfirmButton } from "@/components/delete-confirm-button";
import { formatEUR } from "@/lib/money-utils";
import { ProviderFormDialog, type ProviderRecord } from "./provider-form-dialog";
import { CsvImportDialog } from "./csv-import-dialog";
import { deleteProvider } from "./actions";

export type ProviderRow = ProviderRecord & { invoiceCount: number; totalPurchased: number };

export function ProveedoresView({ providers }: { providers: ProviderRow[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return providers;
    return providers.filter((p) =>
      [p.name, p.taxId, p.email].filter(Boolean).some((v) => v!.toLowerCase().includes(q)),
    );
  }, [providers, query]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900">Proveedores</h1>
        <div className="flex items-center gap-2">
          <CsvImportDialog />
          <ProviderFormDialog
            trigger={
              <Button size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700">
                <Plus className="size-4" />
                Nuevo proveedor
              </Button>
            }
          />
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder="Buscar por nombre o CIF..."
          className="pl-8"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="rounded-lg border border-slate-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Proveedor</TableHead>
              <TableHead>CIF</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="text-right">Facturas</TableHead>
              <TableHead className="text-right">Total comprado</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-slate-400">
                  Sin proveedores.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((provider) => (
                <TableRow key={provider.id}>
                  <TableCell className="font-medium">
                    <ProviderFormDialog
                      provider={provider}
                      trigger={<button className="hover:underline">{provider.name}</button>}
                    />
                  </TableCell>
                  <TableCell>{provider.taxId ?? "—"}</TableCell>
                  <TableCell>{provider.email ?? "—"}</TableCell>
                  <TableCell className="text-right">{provider.invoiceCount}</TableCell>
                  <TableCell className="text-right">{formatEUR(provider.totalPurchased)}</TableCell>
                  <TableCell>
                    <DeleteConfirmButton
                      description={`Se eliminará a ${provider.name}.`}
                      onConfirm={() => deleteProvider(provider.id)}
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
