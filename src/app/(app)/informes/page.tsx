import { prisma } from "@/lib/prisma";
import { getActiveMembership } from "@/lib/session";
import { clientDisplayName } from "@/lib/client-display";
import { CitasView } from "./citas-view";

export default async function InformesPage() {
  const { membership } = await getActiveMembership();
  const organizationId = membership.organizationId;

  const appointments = await prisma.appointment.findMany({
    where: { organizationId },
    include: { client: true, catalogItem: true, professional: true },
  });

  const rows = appointments.map((a) => ({
    id: a.id,
    startsAt: a.startsAt,
    status: a.status,
    clientName: a.client ? clientDisplayName(a.client) : null,
    serviceName: a.catalogItem?.name ?? null,
    professionalName: a.professional?.name ?? null,
  }));

  return <CitasView appointments={rows} />;
}
