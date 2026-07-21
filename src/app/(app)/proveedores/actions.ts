"use server";

import { revalidatePath } from "next/cache";
import { parse } from "csv-parse/sync";
import { prisma } from "@/lib/prisma";
import { getActiveMembership } from "@/lib/session";
import { providerSchema } from "@/lib/validations/provider";

export type ProviderFormState = { error?: string; success?: boolean };

function formDataToProviderInput(formData: FormData) {
  return providerSchema.safeParse({
    name: formData.get("name"),
    taxId: formData.get("taxId"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    address: formData.get("address"),
    postalCode: formData.get("postalCode"),
    city: formData.get("city"),
    province: formData.get("province"),
    country: formData.get("country"),
    notes: formData.get("notes"),
  });
}

export async function createProvider(
  _prevState: ProviderFormState,
  formData: FormData,
): Promise<ProviderFormState> {
  const { membership } = await getActiveMembership();

  const parsed = formDataToProviderInput(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos no válidos" };
  }

  await prisma.provider.create({
    data: { ...parsed.data, organizationId: membership.organizationId },
  });

  revalidatePath("/proveedores");
  return { success: true };
}

export async function updateProvider(
  providerId: string,
  _prevState: ProviderFormState,
  formData: FormData,
): Promise<ProviderFormState> {
  const { membership } = await getActiveMembership();

  const existing = await prisma.provider.findFirst({
    where: { id: providerId, organizationId: membership.organizationId },
  });
  if (!existing) {
    return { error: "Proveedor no encontrado" };
  }

  const parsed = formDataToProviderInput(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos no válidos" };
  }

  await prisma.provider.update({ where: { id: providerId }, data: parsed.data });

  revalidatePath("/proveedores");
  return { success: true };
}

export async function deleteProvider(providerId: string) {
  const { membership } = await getActiveMembership();

  await prisma.provider.deleteMany({
    where: { id: providerId, organizationId: membership.organizationId },
  });

  revalidatePath("/proveedores");
}

export type ImportState = { error?: string; imported?: number };

export async function importProvidersCsv(
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

  const columnMap: Record<string, string> = {
    nombre: "name",
    "cif/nif": "taxId",
    cif: "taxId",
    nif: "taxId",
    email: "email",
    telefono: "phone",
    "teléfono": "phone",
    direccion: "address",
    "dirección": "address",
    "codigo postal": "postalCode",
    "código postal": "postalCode",
    ciudad: "city",
    localidad: "city",
    provincia: "province",
    pais: "country",
    "país": "country",
    notas: "notes",
  };

  let imported = 0;
  for (const row of rows) {
    const data: Record<string, string> = {};
    for (const [csvKey, field] of Object.entries(columnMap)) {
      const value = row[csvKey];
      if (value) data[field] = value;
    }
    if (!data.name) continue;

    await prisma.provider.create({
      data: {
        organizationId: membership.organizationId,
        name: data.name,
        taxId: data.taxId,
        email: data.email,
        phone: data.phone,
        address: data.address,
        postalCode: data.postalCode,
        city: data.city,
        province: data.province,
        country: data.country ?? "ES",
        notes: data.notes,
      },
    });
    imported += 1;
  }

  revalidatePath("/proveedores");
  return { imported };
}
