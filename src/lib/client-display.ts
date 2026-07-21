export function clientDisplayName(client: {
  isCompany: boolean;
  firstName: string;
  lastName: string | null;
}) {
  return client.isCompany ? client.firstName : `${client.firstName} ${client.lastName ?? ""}`.trim();
}
