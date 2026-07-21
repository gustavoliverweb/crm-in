"use client";

import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DeleteConfirmButton } from "@/components/delete-confirm-button";
import { ClientFormDialog, type ClientRecord } from "./client-form-dialog";
import { ContactFormDialog, type ContactRecord } from "./contact-form-dialog";
import { CsvImportDialog } from "./csv-import-dialog";
import { deleteClient } from "./actions";
import { deleteContact } from "./contact-actions";

export function ClientesTabs({
  clients,
  contacts,
}: {
  clients: ClientRecord[];
  contacts: ContactRecord[];
}) {
  const [query, setQuery] = useState("");

  const filteredClients = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) =>
      [c.firstName, c.lastName, c.clientCode, c.mobilePhone, c.taxId, c.email]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(q)),
    );
  }, [clients, query]);

  const filteredContacts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter((c) =>
      [c.name, c.email, c.company]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(q)),
    );
  }, [contacts, query]);

  return (
    <Tabs defaultValue="clientes" className="gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clientes</h1>
          <TabsList className="mt-2">
            <TabsTrigger value="clientes">Clientes</TabsTrigger>
            <TabsTrigger value="contactos">Contactos</TabsTrigger>
          </TabsList>
        </div>

        <div className="flex items-center gap-2">
          <CsvImportDialog />
          <TabsContent value="clientes" className="m-0 flex-none">
            <ClientFormDialog
              trigger={
                <Button size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="size-4" />
                  Nuevo
                </Button>
              }
            />
          </TabsContent>
          <TabsContent value="contactos" className="m-0 flex-none">
            <ContactFormDialog
              trigger={
                <Button size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="size-4" />
                  Nuevo
                </Button>
              }
            />
          </TabsContent>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder="Buscar por nombre, código, teléfono, DNI o email..."
          className="pl-8"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <TabsContent value="clientes">
        <div className="rounded-lg border border-slate-200 bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Móvil</TableHead>
                <TableHead>NIF/DNI</TableHead>
                <TableHead>Etiquetas</TableHead>
                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-slate-400">
                    Sin resultados.
                  </TableCell>
                </TableRow>
              ) : (
                filteredClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">
                      <ClientFormDialog
                        client={client}
                        trigger={
                          <button className="hover:underline">
                            {client.firstName} {client.lastName ?? ""}
                          </button>
                        }
                      />
                    </TableCell>
                    <TableCell>{client.clientCode ?? "—"}</TableCell>
                    <TableCell>{client.mobilePhone ?? "—"}</TableCell>
                    <TableCell>{client.taxId ?? "—"}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {client.tags.map(({ tag }) => (
                          <Badge key={tag.name} variant="secondary">
                            {tag.name}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DeleteConfirmButton
                        description={`Se eliminará a ${client.firstName} ${client.lastName ?? ""}.`}
                        onConfirm={() => deleteClient(client.id)}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </TabsContent>

      <TabsContent value="contactos">
        <div className="rounded-lg border border-slate-200 bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContacts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-slate-400">
                    Sin contactos.
                  </TableCell>
                </TableRow>
              ) : (
                filteredContacts.map((contact) => (
                  <TableRow key={contact.id}>
                    <TableCell className="font-medium">
                      <ContactFormDialog
                        contact={contact}
                        trigger={
                          <button className="hover:underline">{contact.name}</button>
                        }
                      />
                    </TableCell>
                    <TableCell>{contact.email ?? "—"}</TableCell>
                    <TableCell>{contact.company ?? "—"}</TableCell>
                    <TableCell>
                      <DeleteConfirmButton
                        description={`Se eliminará a ${contact.name}.`}
                        onConfirm={() => deleteContact(contact.id)}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </TabsContent>
    </Tabs>
  );
}
