import { getActiveMembership } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { ClientesTabs } from "./clientes-tabs";

export default async function ClientesPage() {
  const { membership } = await getActiveMembership();
  const organizationId = membership.organizationId;

  const [clients, contacts] = await Promise.all([
    prisma.client.findMany({
      where: { organizationId },
      orderBy: { firstName: "asc" },
      include: { tags: { include: { tag: true } } },
    }),
    prisma.contact.findMany({
      where: { organizationId },
      orderBy: { name: "asc" },
    }),
  ]);

  return <ClientesTabs clients={clients} contacts={contacts} />;
}
