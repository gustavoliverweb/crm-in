import Link from "next/link";
import { CalendarDays, Search, UserPlus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { switchOrganizationAction, signOutAction } from "@/app/(app)/actions";

type Membership = {
  organizationId: string;
  organizationName: string;
  role: string;
};

export function TopBar({
  userName,
  userEmail,
  activeOrgName,
  memberships,
}: {
  userName?: string | null;
  userEmail?: string | null;
  activeOrgName: string;
  memberships: Membership[];
}) {
  const initials = (userName ?? userEmail ?? "?").slice(0, 1).toUpperCase();

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-[1600px] items-center gap-3 px-4 py-3">
        <Link href="/" className="text-lg font-bold text-slate-900">
          intalva
        </Link>

        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          nativeButton={false}
          render={
            <Link href="/agenda">
              <CalendarDays className="size-4" />
              Hoy
            </Link>
          }
        />

        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-slate-500"
          nativeButton={false}
          render={
            <Link href="/clientes">
              <Search className="size-4" />
              Buscar
            </Link>
          }
        />

        <Button
          size="sm"
          className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
          nativeButton={false}
          render={
            <Link href="/agenda">
              <Plus className="size-4" />
              Nueva cita
            </Link>
          }
        />

        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          nativeButton={false}
          render={
            <Link href="/clientes">
              <UserPlus className="size-4" />
              Nuevo cliente
            </Link>
          }
        />

        <div className="ml-auto flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="sm">
                  {activeOrgName}
                </Button>
              }
            />
            <DropdownMenuContent align="end">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Cambiar de negocio</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {memberships.map((m) => (
                  <form key={m.organizationId} action={switchOrganizationAction}>
                    <input type="hidden" name="organizationId" value={m.organizationId} />
                    <DropdownMenuItem
                      nativeButton
                      render={
                        <button type="submit" className="w-full text-left">
                          {m.organizationName}
                        </button>
                      }
                    />
                  </form>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button className="rounded-full">
                  <Avatar className="size-8">
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                </button>
              }
            />
            <DropdownMenuContent align="end">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="max-w-48 truncate">
                  {userEmail}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <form action={signOutAction}>
                  <DropdownMenuItem
                    nativeButton
                    render={
                      <button type="submit" className="w-full text-left">
                        Cerrar sesión
                      </button>
                    }
                  />
                </form>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
