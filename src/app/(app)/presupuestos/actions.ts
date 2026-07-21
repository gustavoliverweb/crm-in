"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getActiveMembership } from "@/lib/session";
import { budgetSchema, budgetLineSchema } from "@/lib/validations/budget";

export type BudgetFormState = { error?: string };

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

  const lines: z.infer<typeof budgetLineSchema>[] = [];
  for (const line of raw) {
    const parsed = budgetLineSchema.safeParse(line);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Partida no válida" } as const;
    }
    lines.push(parsed.data);
  }
  return { lines } as const;
}

async function nextBudgetNumber(organizationId: string) {
  const year = new Date().getFullYear();
  const count = await prisma.budget.count({
    where: { organizationId, number: { startsWith: `${year}-` } },
  });
  return `${year}-${String(count + 1).padStart(4, "0")}`;
}

function formDataToBudgetInput(formData: FormData) {
  return budgetSchema.safeParse({
    clientId: formData.get("clientId"),
    validUntil: formData.get("validUntil"),
    irpfRate: formData.get("irpfRate"),
    salespersonId: formData.get("salespersonId"),
    paymentTerms: formData.get("paymentTerms"),
    notes: formData.get("notes"),
    discountPct: formData.get("discountPct"),
    status: formData.get("status"),
  });
}

export async function createBudget(
  _prevState: BudgetFormState,
  formData: FormData,
): Promise<BudgetFormState> {
  const { membership } = await getActiveMembership();

  const parsedHeader = formDataToBudgetInput(formData);
  if (!parsedHeader.success) {
    return { error: parsedHeader.error.issues[0]?.message ?? "Datos no válidos" };
  }

  const parsedLines = parseLines(formData);
  if ("error" in parsedLines) return { error: parsedLines.error };

  const { validUntil, ...data } = parsedHeader.data;
  const intent = formData.get("intent");
  const number =
    intent === "confirm" ? await nextBudgetNumber(membership.organizationId) : null;

  const budget = await prisma.budget.create({
    data: {
      ...data,
      number,
      validUntil: validUntil ? new Date(`${validUntil}T00:00:00`) : undefined,
      organizationId: membership.organizationId,
      lines: {
        create: parsedLines.lines.map((line, i) => ({ ...line, sortOrder: i })),
      },
    },
  });

  revalidatePath("/presupuestos");
  redirect(`/presupuestos/${budget.id}`);
}

export async function updateBudget(
  budgetId: string,
  _prevState: BudgetFormState,
  formData: FormData,
): Promise<BudgetFormState> {
  const { membership } = await getActiveMembership();

  const existing = await prisma.budget.findFirst({
    where: { id: budgetId, organizationId: membership.organizationId },
  });
  if (!existing) return { error: "Presupuesto no encontrado" };

  const parsedHeader = formDataToBudgetInput(formData);
  if (!parsedHeader.success) {
    return { error: parsedHeader.error.issues[0]?.message ?? "Datos no válidos" };
  }

  const parsedLines = parseLines(formData);
  if ("error" in parsedLines) return { error: parsedLines.error };

  const { validUntil, ...data } = parsedHeader.data;
  const intent = formData.get("intent");
  const number =
    intent === "confirm" && !existing.number
      ? await nextBudgetNumber(membership.organizationId)
      : existing.number;

  await prisma.$transaction([
    prisma.budgetLine.deleteMany({ where: { budgetId } }),
    prisma.budget.update({
      where: { id: budgetId },
      data: {
        ...data,
        number,
        validUntil: validUntil ? new Date(`${validUntil}T00:00:00`) : null,
        lines: {
          create: parsedLines.lines.map((line, i) => ({ ...line, sortOrder: i })),
        },
      },
    }),
  ]);

  revalidatePath("/presupuestos");
  revalidatePath(`/presupuestos/${budgetId}`);
  redirect(`/presupuestos/${budgetId}`);
}

export async function deleteBudget(budgetId: string) {
  const { membership } = await getActiveMembership();

  await prisma.budget.deleteMany({
    where: { id: budgetId, organizationId: membership.organizationId },
  });

  revalidatePath("/presupuestos");
  redirect("/presupuestos");
}

export async function sendBudget(budgetId: string) {
  const { membership } = await getActiveMembership();

  await prisma.budget.updateMany({
    where: {
      id: budgetId,
      organizationId: membership.organizationId,
      status: "BORRADOR",
      number: { not: null },
    },
    data: { status: "ENVIADO" },
  });

  revalidatePath("/presupuestos");
}
