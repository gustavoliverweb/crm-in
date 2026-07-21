"use server";

import { revalidatePath } from "next/cache";
import { parse } from "csv-parse/sync";
import { prisma } from "@/lib/prisma";
import { getActiveMembership } from "@/lib/session";
import { expedienteSchema } from "@/lib/validations/expediente";

export type ExpedienteFormState = { error?: string; success?: boolean };

function parseTaxModels(raw?: string) {
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

function formDataToExpedienteInput(formData: FormData) {
  return expedienteSchema.safeParse({
    clientId: formData.get("clientId"),
    name: formData.get("name"),
    number: formData.get("number"),
    type: formData.get("type"),
    vatRegime: formData.get("vatRegime"),
    taxModels: formData.get("taxModels"),
    periodicity: formData.get("periodicity"),
    ownerTaxId: formData.get("ownerTaxId"),
    responsibleId: formData.get("responsibleId"),
    status: formData.get("status"),
    description: formData.get("description"),
    notes: formData.get("notes"),
  });
}

export async function createExpediente(
  _prevState: ExpedienteFormState,
  formData: FormData,
): Promise<ExpedienteFormState> {
  const { membership } = await getActiveMembership();

  const parsed = formDataToExpedienteInput(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos no válidos" };
  }

  const { taxModels, ...data } = parsed.data;

  await prisma.expediente.create({
    data: {
      ...data,
      taxModels: parseTaxModels(taxModels),
      organizationId: membership.organizationId,
    },
  });

  revalidatePath("/expedientes");
  return { success: true };
}

export async function updateExpediente(
  expedienteId: string,
  _prevState: ExpedienteFormState,
  formData: FormData,
): Promise<ExpedienteFormState> {
  const { membership } = await getActiveMembership();

  const existing = await prisma.expediente.findFirst({
    where: { id: expedienteId, organizationId: membership.organizationId },
  });
  if (!existing) {
    return { error: "Expediente no encontrado" };
  }

  const parsed = formDataToExpedienteInput(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos no válidos" };
  }

  const { taxModels, ...data } = parsed.data;

  await prisma.expediente.update({
    where: { id: expedienteId },
    data: { ...data, taxModels: parseTaxModels(taxModels) },
  });

  revalidatePath("/expedientes");
  return { success: true };
}

export async function deleteExpediente(expedienteId: string) {
  const { membership } = await getActiveMembership();

  await prisma.expediente.deleteMany({
    where: { id: expedienteId, organizationId: membership.organizationId },
  });

  revalidatePath("/expedientes");
}

export type ImportState = { error?: string; imported?: number };

export async function importExpedientesCsv(
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
    "nombre / referencia": "name",
    referencia: "name",
    numero: "number",
    "número": "number",
    "nº expediente": "number",
    tipo: "type",
    "regimen iva": "vatRegime",
    "régimen iva": "vatRegime",
    modelos: "taxModels",
    periodicidad: "periodicity",
    "nif/cif titular": "ownerTaxId",
    "codigo cliente": "clientCode",
    "código cliente": "clientCode",
    estado: "status",
    descripcion: "description",
    "descripción": "description",
    notas: "notes",
  };

  const statusMap: Record<string, "ABIERTO" | "EN_PROCESO" | "CERRADO"> = {
    abierto: "ABIERTO",
    "en proceso": "EN_PROCESO",
    cerrado: "CERRADO",
  };

  let imported = 0;
  for (const row of rows) {
    const data: Record<string, string> = {};
    for (const [csvKey, field] of Object.entries(columnMap)) {
      const value = row[csvKey];
      if (value) data[field] = value;
    }
    if (!data.name) continue;

    let clientId: string | undefined;
    if (data.clientCode) {
      const client = await prisma.client.findFirst({
        where: { organizationId: membership.organizationId, clientCode: data.clientCode },
      });
      clientId = client?.id;
    }

    await prisma.expediente.create({
      data: {
        organizationId: membership.organizationId,
        clientId,
        name: data.name,
        number: data.number,
        type: data.type,
        vatRegime: data.vatRegime,
        taxModels: parseTaxModels(data.taxModels),
        periodicity: data.periodicity,
        ownerTaxId: data.ownerTaxId,
        status: (data.status && statusMap[data.status.toLowerCase()]) || "ABIERTO",
        description: data.description,
        notes: data.notes,
      },
    });
    imported += 1;
  }

  revalidatePath("/expedientes");
  return { imported };
}
