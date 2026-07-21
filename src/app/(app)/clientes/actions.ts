"use server";

import { revalidatePath } from "next/cache";
import { parse } from "csv-parse/sync";
import { prisma } from "@/lib/prisma";
import { getActiveMembership } from "@/lib/session";
import { clientSchema } from "@/lib/validations/client";
import type { Prisma } from "@/generated/prisma/client";

export type ClientFormState = { error?: string; success?: boolean };

function parseTags(raw?: string) {
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

async function syncTags(
  tx: Prisma.TransactionClient,
  organizationId: string,
  clientId: string,
  tagNames: string[],
) {
  await tx.clientTag.deleteMany({ where: { clientId } });
  if (tagNames.length === 0) return;

  for (const name of tagNames) {
    const tag = await tx.tag.upsert({
      where: { organizationId_name: { organizationId, name } },
      update: {},
      create: { organizationId, name },
    });
    await tx.clientTag.create({ data: { clientId, tagId: tag.id } });
  }
}

function formDataToClientInput(formData: FormData) {
  return clientSchema.safeParse({
    isCompany: formData.get("isCompany"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    taxId: formData.get("taxId"),
    clientCode: formData.get("clientCode"),
    birthDate: formData.get("birthDate"),
    mobilePhone: formData.get("mobilePhone"),
    landlinePhone: formData.get("landlinePhone"),
    email: formData.get("email"),
    address: formData.get("address"),
    postalCode: formData.get("postalCode"),
    city: formData.get("city"),
    province: formData.get("province"),
    region: formData.get("region"),
    country: formData.get("country"),
    notes: formData.get("notes"),
    whatsappOptIn: formData.get("whatsappOptIn"),
    equivalenceSurcharge: formData.get("equivalenceSurcharge"),
    tags: formData.get("tags"),
  });
}

export async function createClient(
  _prevState: ClientFormState,
  formData: FormData,
): Promise<ClientFormState> {
  const { membership } = await getActiveMembership();

  const parsed = formDataToClientInput(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos no válidos" };
  }

  const { tags, ...data } = parsed.data;
  const tagNames = parseTags(tags);

  await prisma.$transaction(async (tx) => {
    const client = await tx.client.create({
      data: { ...data, organizationId: membership.organizationId },
    });
    await syncTags(tx, membership.organizationId, client.id, tagNames);
  });

  revalidatePath("/clientes");
  return { success: true };
}

export async function updateClient(
  clientId: string,
  _prevState: ClientFormState,
  formData: FormData,
): Promise<ClientFormState> {
  const { membership } = await getActiveMembership();

  const existing = await prisma.client.findFirst({
    where: { id: clientId, organizationId: membership.organizationId },
  });
  if (!existing) {
    return { error: "Cliente no encontrado" };
  }

  const parsed = formDataToClientInput(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos no válidos" };
  }

  const { tags, ...data } = parsed.data;
  const tagNames = parseTags(tags);

  await prisma.$transaction(async (tx) => {
    await tx.client.update({ where: { id: clientId }, data });
    await syncTags(tx, membership.organizationId, clientId, tagNames);
  });

  revalidatePath("/clientes");
  return { success: true };
}

export async function deleteClient(clientId: string) {
  const { membership } = await getActiveMembership();

  await prisma.client.deleteMany({
    where: { id: clientId, organizationId: membership.organizationId },
  });

  revalidatePath("/clientes");
}

export type ImportState = { error?: string; imported?: number };

export async function importClientsCsv(
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
      columns: (header: string[]) =>
        header.map((h) => h.trim().toLowerCase()),
      skip_empty_lines: true,
      trim: true,
    });
  } catch {
    return { error: "No se pudo leer el CSV. Revisa el formato." };
  }

  const columnMap: Record<string, string> = {
    nombre: "firstName",
    apellidos: "lastName",
    "nif/dni": "taxId",
    nif: "taxId",
    dni: "taxId",
    codigo: "clientCode",
    "código": "clientCode",
    movil: "mobilePhone",
    "móvil": "mobilePhone",
    fijo: "landlinePhone",
    email: "email",
    direccion: "address",
    "dirección": "address",
    "codigo postal": "postalCode",
    "código postal": "postalCode",
    localidad: "city",
    provincia: "province",
    "pais": "country",
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
    if (!data.firstName) continue;

    await prisma.client.create({
      data: {
        organizationId: membership.organizationId,
        firstName: data.firstName,
        lastName: data.lastName,
        taxId: data.taxId,
        clientCode: data.clientCode,
        mobilePhone: data.mobilePhone,
        landlinePhone: data.landlinePhone,
        email: data.email,
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

  revalidatePath("/clientes");
  return { imported };
}
