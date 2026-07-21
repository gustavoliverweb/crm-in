import { getActiveMembership } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { clientDisplayName } from "@/lib/client-display";
import { ExpedientesView } from "./expedientes-view";

export default async function ExpedientesPage() {
  const { membership } = await getActiveMembership();
  const organizationId = membership.organizationId;

  const [expedientes, clients, memberships] = await Promise.all([
    prisma.expediente.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      include: { client: true },
    }),
    prisma.client.findMany({
      where: { organizationId },
      orderBy: { firstName: "asc" },
    }),
    prisma.membership.findMany({
      where: { organizationId },
      include: { user: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const rows = expedientes.map((e) => ({
    id: e.id,
    clientId: e.clientId,
    clientName: e.client ? clientDisplayName(e.client) : null,
    name: e.name,
    number: e.number,
    type: e.type,
    vatRegime: e.vatRegime,
    taxModels: e.taxModels,
    periodicity: e.periodicity,
    ownerTaxId: e.ownerTaxId,
    responsibleId: e.responsibleId,
    status: e.status,
    description: e.description,
    notes: e.notes,
  }));

  const clientOptions = clients.map((c) => ({
    id: c.id,
    name: clientDisplayName(c),
    clientCode: c.clientCode,
    mobilePhone: c.mobilePhone,
    taxId: c.taxId,
  }));

  const staffOptions = memberships.map((m) => ({
    id: m.user.id,
    name: m.user.name ?? m.user.email,
  }));

  return (
    <ExpedientesView expedientes={rows} clientOptions={clientOptions} staffOptions={staffOptions} />
  );
}
