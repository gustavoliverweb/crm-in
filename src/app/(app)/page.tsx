import { getActiveMembership } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function formatEUR(value: number) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

export default async function InicioPage() {
  const { membership } = await getActiveMembership();
  const organizationId = membership.organizationId;

  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [citasHoy, clientesCount, facturasEmitidasMes, facturasPendientes] =
    await Promise.all([
      prisma.appointment.count({
        where: {
          organizationId,
          startsAt: { gte: startOfDay, lt: endOfDay },
        },
      }),
      prisma.client.count({ where: { organizationId } }),
      prisma.invoice.findMany({
        where: {
          organizationId,
          status: { in: ["EMITIDA", "PAGADA"] },
          createdAt: { gte: startOfMonth, lt: startOfNextMonth },
        },
        include: { lines: true },
      }),
      prisma.invoice.findMany({
        where: { organizationId, status: "EMITIDA" },
        include: { lines: true },
      }),
    ]);

  const sumInvoiceTotal = (invoices: typeof facturasEmitidasMes) =>
    invoices.reduce((total, invoice) => {
      const invoiceTotal = invoice.lines.reduce((lineSum, line) => {
        const base =
          Number(line.quantity) *
          Number(line.unitPrice) *
          (1 - Number(line.discountPct) / 100);
        return lineSum + base * (1 + Number(line.vatRate) / 100);
      }, 0);
      return total + invoiceTotal;
    }, 0);

  const ingresosDelMes = sumInvoiceTotal(facturasEmitidasMes);
  const pendienteCobro = sumInvoiceTotal(facturasPendientes);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Buenas 👋</h1>
        <p className="text-sm text-slate-500">
          {now.toLocaleDateString("es-ES", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Citas hoy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">{citasHoy}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Ingresos del mes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">
              {formatEUR(ingresosDelMes)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Pendiente de cobro
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">
              {formatEUR(pendienteCobro)}
            </p>
            <p className="text-xs text-slate-400">
              {facturasPendientes.length} facturas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Clientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-slate-900">
              {clientesCount}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
