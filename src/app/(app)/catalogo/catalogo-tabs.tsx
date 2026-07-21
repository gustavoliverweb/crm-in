"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DeleteConfirmButton } from "@/components/delete-confirm-button";
import {
  CatalogFormDialog,
  type CatalogItemRecord,
  type CatalogItemType,
} from "./catalog-form-dialog";
import { CsvImportDialog } from "./csv-import-dialog";
import { deleteCatalogItem } from "./actions";

function formatEUR(value: number) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

const TABS: { value: CatalogItemType; label: string; newLabel: string }[] = [
  { value: "SERVICIO", label: "Servicios", newLabel: "Nuevo servicio" },
  { value: "PRODUCTO", label: "Productos", newLabel: "Nuevo producto" },
  { value: "EXTRA", label: "Extras", newLabel: "Nuevo extra" },
];

function CatalogTable({
  items,
  type,
}: {
  items: CatalogItemRecord[];
  type: CatalogItemType;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{type === "PRODUCTO" ? "Producto" : type === "EXTRA" ? "Extra" : "Servicio"}</TableHead>
            {type === "SERVICIO" ? <TableHead>Duración</TableHead> : null}
            {type === "PRODUCTO" ? <TableHead>SKU</TableHead> : null}
            <TableHead>Precio base</TableHead>
            <TableHead>IVA</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="w-16" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={type === "SERVICIO" || type === "PRODUCTO" ? 6 : 5}
                className="py-8 text-center text-slate-400"
              >
                Vacío.
              </TableCell>
            </TableRow>
          ) : (
            items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">
                  <CatalogFormDialog
                    type={type}
                    item={item}
                    trigger={<button className="hover:underline">{item.name}</button>}
                  />
                </TableCell>
                {type === "SERVICIO" ? (
                  <TableCell>
                    {item.durationMinutes ? `${item.durationMinutes} min` : "—"}
                  </TableCell>
                ) : null}
                {type === "PRODUCTO" ? <TableCell>{item.sku ?? "—"}</TableCell> : null}
                <TableCell>{formatEUR(item.basePrice)}</TableCell>
                <TableCell>{Number(item.vatRate)}%</TableCell>
                <TableCell>
                  <Badge variant={item.active ? "default" : "secondary"}>
                    {item.active ? "Activo" : "Inactivo"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DeleteConfirmButton
                    description={`Se eliminará "${item.name}".`}
                    onConfirm={() => deleteCatalogItem(item.id)}
                  />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export function CatalogoTabs({
  itemsByType,
}: {
  itemsByType: Record<CatalogItemType, CatalogItemRecord[]>;
}) {
  return (
    <Tabs defaultValue="SERVICIO" className="gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Catálogo</h1>
          <TabsList className="mt-2">
            {TABS.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <div className="flex items-center gap-2">
          {TABS.map((tab) => (
            <TabsContent key={tab.value} value={tab.value} className="m-0 flex-none">
              <div className="flex items-center gap-2">
                <CsvImportDialog type={tab.value} />
                <CatalogFormDialog
                  type={tab.value}
                  trigger={
                    <Button size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700">
                      <Plus className="size-4" />
                      {tab.newLabel}
                    </Button>
                  }
                />
              </div>
            </TabsContent>
          ))}
        </div>
      </div>

      {TABS.map((tab) => (
        <TabsContent key={tab.value} value={tab.value}>
          <CatalogTable items={itemsByType[tab.value]} type={tab.value} />
        </TabsContent>
      ))}
    </Tabs>
  );
}
