import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

const ACTIVE_ORG_COOKIE = "intalva_active_org";

export async function requireSession() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  return session;
}

export async function getActiveMembership() {
  const session = await requireSession();
  const memberships = session.user.memberships;

  if (memberships.length === 0) {
    redirect("/registro");
  }

  const cookieStore = await cookies();
  const activeOrgId = cookieStore.get(ACTIVE_ORG_COOKIE)?.value;

  const active =
    memberships.find((m) => m.organizationId === activeOrgId) ??
    memberships[0];

  return { session, membership: active, memberships };
}

export async function setActiveOrganization(organizationId: string) {
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_ORG_COOKIE, organizationId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
}
