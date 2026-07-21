"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getActiveMembership } from "@/lib/session";
import {
  receivedInvoiceSchema,
  receivedInvoiceLineSchema,
} from "@/lib/validations/received-invoice";

export type ReceivedInvoiceFormState = { error?: string };

function zipLines(formData: FormData) {
  const productNames = formData.getAll("rLineProductName");
  const skus = formData.getAll("rLineSku");
  const quantities = formData.getAll("rLineQuantity");
  const units = formData.getAll("rLineUnit");
  const unitPrices = formData.getAll("rLineUnitPrice");
  const totals = formData.getAll("rLineTotal");

  return productNames.map((_, i) => ({
    productName: productNames[i],
    sku: skus[i],
    quantity: quantities[i],
    unit: units[i],
    unitPrice: unitPrices[i],
    total: totals[i],
  }));
}

function parseLines(formData: FormData) {
  const raw = zipLines(formData).filter(
    (l) => typeof l.productName === "string" && l.productName.trim() !== "",
  );

  const lines: z.infer<typeof receivedInvoiceLineSchema>[] = [];
  for (const line of raw) {
    const parsed = receivedInvoiceLineSchema.safeParse(line);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Línea no válida" } as const;
    }
    lines.push(parsed.data);
  }
  return { lines } as const;
}

function formDataToReceivedInvoiceInput(formData: FormData) {
  return receivedInvoiceSchema.safeParse({
    providerId: formData.get("providerId"),
    invoiceNumber: formData.get("invoiceNumber"),
    invoiceDate: formData.get("invoiceDate"),
    baseAmount: formData.get("baseAmount"),
    vatAmount: formData.get("vatAmount"),
    totalAmount: formData.get("totalAmount"),
    status: formData.get("status"),
  });
}

export async function createReceivedInvoice(
  _prevState: ReceivedInvoiceFormState,
  formData: FormData,
): Promise<ReceivedInvoiceFormState> {
  const { membership } = await getActiveMembership();

  const parsedHeader = formDataToReceivedInvoiceInput(formData);
  if (!parsedHeader.success) {
    return { error: parsedHeader.error.issues[0]?.message ?? "Datos no válidos" };
  }

  const parsedLines = parseLines(formData);
  if ("error" in parsedLines) return { error: parsedLines.error };

  const { invoiceDate, ...data } = parsedHeader.data;

  const receivedInvoice = await prisma.receivedInvoice.create({
    data: {
      ...data,
      source: "MANUAL",
      invoiceDate: invoiceDate ? new Date(`${invoiceDate}T00:00:00`) : undefined,
      organizationId: membership.organizationId,
      lines: { create: parsedLines.lines },
    },
  });

  revalidatePath("/facturacion/recibidas");
  redirect(`/facturacion/recibidas/${receivedInvoice.id}`);
}

export async function updateReceivedInvoice(
  receivedInvoiceId: string,
  _prevState: ReceivedInvoiceFormState,
  formData: FormData,
): Promise<ReceivedInvoiceFormState> {
  const { membership } = await getActiveMembership();

  const existing = await prisma.receivedInvoice.findFirst({
    where: { id: receivedInvoiceId, organizationId: membership.organizationId },
  });
  if (!existing) return { error: "Factura recibida no encontrada" };

  const parsedHeader = formDataToReceivedInvoiceInput(formData);
  if (!parsedHeader.success) {
    return { error: parsedHeader.error.issues[0]?.message ?? "Datos no válidos" };
  }

  const parsedLines = parseLines(formData);
  if ("error" in parsedLines) return { error: parsedLines.error };

  const { invoiceDate, ...data } = parsedHeader.data;

  await prisma.$transaction([
    prisma.receivedInvoiceLine.deleteMany({ where: { receivedInvoiceId } }),
    prisma.receivedInvoice.update({
      where: { id: receivedInvoiceId },
      data: {
        ...data,
        invoiceDate: invoiceDate ? new Date(`${invoiceDate}T00:00:00`) : null,
        lines: { create: parsedLines.lines },
      },
    }),
  ]);

  revalidatePath("/facturacion/recibidas");
  revalidatePath(`/facturacion/recibidas/${receivedInvoiceId}`);
  redirect(`/facturacion/recibidas/${receivedInvoiceId}`);
}

export async function deleteReceivedInvoice(receivedInvoiceId: string) {
  const { membership } = await getActiveMembership();

  await prisma.receivedInvoice.deleteMany({
    where: { id: receivedInvoiceId, organizationId: membership.organizationId },
  });

  revalidatePath("/facturacion/recibidas");
  redirect("/facturacion/recibidas");
}

export async function markReceivedInvoiceVerified(receivedInvoiceId: string) {
  const { membership } = await getActiveMembership();

  await prisma.receivedInvoice.updateMany({
    where: { id: receivedInvoiceId, organizationId: membership.organizationId },
    data: { status: "VERIFICADA" },
  });

  revalidatePath("/facturacion/recibidas");
}

export type CreateProviderState = { error?: string; provider?: { id: string; name: string } };

export async function createProviderQuick(
  _prevState: CreateProviderState,
  formData: FormData,
): Promise<CreateProviderState> {
  const { membership } = await getActiveMembership();

  const name = formData.get("name");
  if (typeof name !== "string" || name.trim() === "") {
    return { error: "El nombre del proveedor es obligatorio" };
  }

  const provider = await prisma.provider.create({
    data: { name: name.trim(), organizationId: membership.organizationId },
  });

  revalidatePath("/facturacion/recibidas");
  return { provider: { id: provider.id, name: provider.name } };
}
