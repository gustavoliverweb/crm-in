"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getActiveMembership } from "@/lib/session";
import { contactSchema } from "@/lib/validations/contact";

export type ContactFormState = { error?: string; success?: boolean };

function formDataToContactInput(formData: FormData) {
  return contactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    company: formData.get("company"),
    clientId: formData.get("clientId"),
    notes: formData.get("notes"),
  });
}

export async function createContact(
  _prevState: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const { membership } = await getActiveMembership();

  const parsed = formDataToContactInput(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos no válidos" };
  }

  await prisma.contact.create({
    data: { ...parsed.data, organizationId: membership.organizationId },
  });

  revalidatePath("/clientes");
  return { success: true };
}

export async function updateContact(
  contactId: string,
  _prevState: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const { membership } = await getActiveMembership();

  const existing = await prisma.contact.findFirst({
    where: { id: contactId, organizationId: membership.organizationId },
  });
  if (!existing) {
    return { error: "Contacto no encontrado" };
  }

  const parsed = formDataToContactInput(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos no válidos" };
  }

  await prisma.contact.update({
    where: { id: contactId },
    data: parsed.data,
  });

  revalidatePath("/clientes");
  return { success: true };
}

export async function deleteContact(contactId: string) {
  const { membership } = await getActiveMembership();

  await prisma.contact.deleteMany({
    where: { id: contactId, organizationId: membership.organizationId },
  });

  revalidatePath("/clientes");
}
