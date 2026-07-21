"use server";

import { revalidatePath } from "next/cache";
import { parse } from "csv-parse/sync";
import { prisma } from "@/lib/prisma";
import { getActiveMembership } from "@/lib/session";
import { catalogItemSchema } from "@/lib/validations/catalog-item";

export type CatalogItemFormState = { error?: string; success?: boolean };

function parseAllowedTimes(raw?: string) {
  if (!raw) return [];
  return Array.from(
    new Set(
      raw
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    ),
  );
}

function formDataToCatalogItemInput(formData: FormData) {
  return catalogItemSchema.safeParse({
    type: formData.get("type"),
    name: formData.get("name"),
    durationMinutes: formData.get("durationMinutes"),
    bufferMinutes: formData.get("bufferMinutes"),
    basePrice: formData.get("basePrice"),
    vatRate: formData.get("vatRate"),
    active: formData.get("active"),
    allowedTimes: formData.get("allowedTimes"),
    maxPerSlot: formData.get("maxPerSlot"),
    conditions: formData.get("conditions"),
    sku: formData.get("sku"),
    stock: formData.get("stock"),
  });
}

export async function createCatalogItem(
  _prevState: CatalogItemFormState,
  formData: FormData,
): Promise<CatalogItemFormState> {
  const { membership } = await getActiveMembership();

  const parsed = formDataToCatalogItemInput(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos no válidos" };
  }

  const { allowedTimes, ...data } = parsed.data;

  await prisma.catalogItem.create({
    data: {
      ...data,
      allowedTimes: parseAllowedTimes(allowedTimes),
      organizationId: membership.organizationId,
    },
  });

  revalidatePath("/catalogo");
  return { success: true };
}

export async function updateCatalogItem(
  itemId: string,
  _prevState: CatalogItemFormState,
  formData: FormData,
): Promise<CatalogItemFormState> {
  const { membership } = await getActiveMembership();

  const existing = await prisma.catalogItem.findFirst({
    where: { id: itemId, organizationId: membership.organizationId },
  });
  if (!existing) {
    return { error: "Elemento no encontrado" };
  }

  const parsed = formDataToCatalogItemInput(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos no válidos" };
  }

  const { allowedTimes, ...data } = parsed.data;

  await prisma.catalogItem.update({
    where: { id: itemId },
    data: { ...data, allowedTimes: parseAllowedTimes(allowedTimes) },
  });

  revalidatePath("/catalogo");
  return { success: true };
}

export async function deleteCatalogItem(itemId: string) {
  const { membership } = await getActiveMembership();

  await prisma.catalogItem.deleteMany({
    where: { id: itemId, organizationId: membership.organizationId },
  });

  revalidatePath("/catalogo");
}

export type ImportState = { error?: string; imported?: number };

export async function importCatalogCsv(
  type: "SERVICIO" | "PRODUCTO" | "EXTRA",
  _prevState: ImportState,
  formData: FormData,
): Promise<ImportState> {
  const { membership } = await getActiveMembership();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Selecciona un archivo CSV" };
  }

  const text = await file.text();
  let rows: Record<string, string>[];
  try {
    rows = parse(text, {
      columns: (header: string[]) => header.map((h) => h.trim().toLowerCase()),
      skip_empty_lines: true,
      trim: true,
    });
  } catch {
    return { error: "No se pudo leer el CSV. Revisa el formato." };
  }

  let imported = 0;
  for (const row of rows) {
    const name = row["nombre"];
    if (!name) continue;

    await prisma.catalogItem.create({
      data: {
        organizationId: membership.organizationId,
        type,
        name,
        durationMinutes: row["duracion"] ? Number(row["duracion"]) : undefined,
        basePrice: row["precio base"] ? Number(row["precio base"]) : 0,
        vatRate: row["iva"] ? Number(row["iva"]) : 21,
        sku: row["sku"] || undefined,
        stock: row["stock"] ? Number(row["stock"]) : undefined,
      },
    });
    imported += 1;
  }

  revalidatePath("/catalogo");
  return { imported };
}
