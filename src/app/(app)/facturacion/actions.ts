"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getActiveMembership } from "@/lib/session";
import { invoiceSchema, invoiceLineSchema } from "@/lib/validations/invoice";
import { buildVerifactuRegistro, submitVerifactuRecord } from "@/lib/verifactu";
import { clientDisplayName } from "@/lib/client-display";

export type InvoiceFormState = { error?: string };

function zipLines(formData: FormData) {
  const catalogItemIds = formData.getAll("lineCatalogItemId");
  const descriptions = formData.getAll("lineDescription");
  const quantities = formData.getAll("lineQuantity");
  const unitPrices = formData.getAll("lineUnitPrice");
  const discountPcts = formData.getAll("lineDiscountPct");
  const vatRates = formData.getAll("lineVatRate");

  return descriptions.map((_, i) => ({
    catalogItemId: catalogItemIds[i],
    description: descriptions[i],
    quantity: quantities[i],
    unitPrice: unitPrices[i],
    discountPct: discountPcts[i],
    vatRate: vatRates[i],
  }));
}

function parseLines(formData: FormData) {
  const raw = zipLines(formData).filter(
    (l) => typeof l.description === "string" && l.description.trim() !== "",
  );

  const lines: z.infer<typeof invoiceLineSchema>[] = [];
  for (const line of raw) {
    const parsed = invoiceLineSchema.safeParse(line);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Línea no válida" } as const;
    }
    lines.push(parsed.data);
  }
  return { lines } as const;
}

function computeTotal(lines: { quantity: number; unitPrice: number; discountPct: number; vatRate: number }[], discountPct: number) {
  const base = lines.reduce((sum, l) => sum + l.quantity * l.unitPrice * (1 - l.discountPct / 100), 0);
  const discounted = base * (1 - discountPct / 100);
  const iva = lines.reduce((sum, l) => {
    const lineBase = l.quantity * l.unitPrice * (1 - l.discountPct / 100);
    return sum + lineBase * (1 - discountPct / 100) * (l.vatRate / 100);
  }, 0);
  return discounted + iva;
}

async function nextInvoiceNumber(organizationId: string) {
  const year = new Date().getFullYear();
  const count = await prisma.invoice.count({
    where: { organizationId, number: { startsWith: `${year}-` } },
  });
  return `${year}-${String(count + 1).padStart(4, "0")}`;
}

async function emitInvoice(
  organizationId: string,
  clientId: string | undefined,
  invoiceType: "SIMPLIFICADA" | "COMPLETA",
  lines: { quantity: number; unitPrice: number; discountPct: number; vatRate: number }[],
  discountPct: number,
) {
  const number = await nextInvoiceNumber(organizationId);
  const total = computeTotal(lines, discountPct);

  const [prev, organization, client] = await Promise.all([
    prisma.invoice.findFirst({
      where: { organizationId, verifactuHash: { not: null } },
      orderBy: { createdAt: "desc" },
      select: { number: true, createdAt: true, verifactuHash: true },
    }),
    prisma.organization.findUniqueOrThrow({ where: { id: organizationId } }),
    clientId ? prisma.client.findUnique({ where: { id: clientId } }) : Promise.resolve(null),
  ]);

  const issuedAt = new Date();

  // Desglose de IVA por tipo, aplicando el descuento global igual que computeTotal.
  const vatGroups = new Map<number, { base: number; cuota: number }>();
  for (const line of lines) {
    const lineBase =
      line.quantity * line.unitPrice * (1 - line.discountPct / 100) * (1 - discountPct / 100);
    const cuota = lineBase * (line.vatRate / 100);
    const group = vatGroups.get(line.vatRate) ?? { base: 0, cuota: 0 };
    group.base += lineBase;
    group.cuota += cuota;
    vatGroups.set(line.vatRate, group);
  }
  const vatBreakdown = Array.from(vatGroups.entries()).map(([vatRate, g]) => ({
    vatRate,
    base: g.base,
    cuota: g.cuota,
  }));
  const cuotaTotal = vatBreakdown.reduce((sum, v) => sum + v.cuota, 0);

  const { record, hash, qrUrl } = buildVerifactuRegistro({
    organizationId,
    organizationTaxId: organization.taxId ?? "SIN-NIF-CONFIGURADO",
    organizationName: organization.legalName ?? organization.name,
    number,
    issuedAt,
    invoiceType: invoiceType === "COMPLETA" ? "F1" : "F2",
    recipientTaxId: client?.taxId ?? null,
    recipientName: client ? clientDisplayName(client) : null,
    vatBreakdown,
    cuotaTotal,
    total,
    previous:
      prev && prev.number
        ? { number: prev.number, issuedAt: prev.createdAt, hash: prev.verifactuHash! }
        : null,
  });

  const submission = await submitVerifactuRecord();

  return {
    number,
    status: "EMITIDA" as const,
    verifactuHash: hash,
    verifactuPrevHash: prev?.verifactuHash ?? null,
    verifactuQrData: "Registro preparado — pendiente de envío (falta certificado digital)",
    verifactuRecord: record,
    verifactuQrUrl: qrUrl,
    verifactuSubmissionStatus: submission.status,
    verifactuSubmissionError: submission.status === "ERROR" ? submission.error : null,
  };
}

function formDataToInvoiceInput(formData: FormData) {
  return invoiceSchema.safeParse({
    clientId: formData.get("clientId"),
    type: formData.get("type"),
    irpfRate: formData.get("irpfRate"),
    dueDate: formData.get("dueDate"),
    discountPct: formData.get("discountPct"),
    status: formData.get("status"),
  });
}

export async function createInvoice(
  _prevState: InvoiceFormState,
  formData: FormData,
): Promise<InvoiceFormState> {
  const { membership } = await getActiveMembership();

  const parsedHeader = formDataToInvoiceInput(formData);
  if (!parsedHeader.success) {
    return { error: parsedHeader.error.issues[0]?.message ?? "Datos no válidos" };
  }

  const parsedLines = parseLines(formData);
  if ("error" in parsedLines) return { error: parsedLines.error };

  const { dueDate, ...data } = parsedHeader.data;
  const intent = formData.get("intent");

  const emission =
    intent === "confirm"
      ? await emitInvoice(
          membership.organizationId,
          data.clientId,
          data.type,
          parsedLines.lines,
          data.discountPct,
        )
      : {};

  const invoice = await prisma.invoice.create({
    data: {
      ...data,
      ...emission,
      dueDate: dueDate ? new Date(`${dueDate}T00:00:00`) : undefined,
      organizationId: membership.organizationId,
      lines: {
        create: parsedLines.lines.map((line, i) => ({ ...line, sortOrder: i })),
      },
    },
  });

  revalidatePath("/facturacion");
  redirect(`/facturacion/${invoice.id}`);
}

export async function updateInvoice(
  invoiceId: string,
  _prevState: InvoiceFormState,
  formData: FormData,
): Promise<InvoiceFormState> {
  const { membership } = await getActiveMembership();

  const existing = await prisma.invoice.findFirst({
    where: { id: invoiceId, organizationId: membership.organizationId },
  });
  if (!existing) return { error: "Factura no encontrada" };

  const parsedHeader = formDataToInvoiceInput(formData);
  if (!parsedHeader.success) {
    return { error: parsedHeader.error.issues[0]?.message ?? "Datos no válidos" };
  }

  const parsedLines = parseLines(formData);
  if ("error" in parsedLines) return { error: parsedLines.error };

  const { dueDate, ...data } = parsedHeader.data;
  const intent = formData.get("intent");

  const emission =
    intent === "confirm" && !existing.number
      ? await emitInvoice(
          membership.organizationId,
          data.clientId,
          data.type,
          parsedLines.lines,
          data.discountPct,
        )
      : {};

  await prisma.$transaction([
    prisma.invoiceLine.deleteMany({ where: { invoiceId } }),
    prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        ...data,
        ...emission,
        dueDate: dueDate ? new Date(`${dueDate}T00:00:00`) : null,
        lines: {
          create: parsedLines.lines.map((line, i) => ({ ...line, sortOrder: i })),
        },
      },
    }),
  ]);

  revalidatePath("/facturacion");
  revalidatePath(`/facturacion/${invoiceId}`);
  redirect(`/facturacion/${invoiceId}`);
}

export async function deleteInvoice(invoiceId: string) {
  const { membership } = await getActiveMembership();

  await prisma.invoice.deleteMany({
    where: { id: invoiceId, organizationId: membership.organizationId },
  });

  revalidatePath("/facturacion");
  redirect("/facturacion");
}

export async function markInvoicePaid(invoiceId: string) {
  const { membership } = await getActiveMembership();

  await prisma.invoice.updateMany({
    where: { id: invoiceId, organizationId: membership.organizationId, status: "EMITIDA" },
    data: { status: "PAGADA", paidAt: new Date() },
  });

  revalidatePath("/facturacion");
}
