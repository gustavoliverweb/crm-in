"use server";

import { redirect } from "next/navigation";
import { signOut } from "@/auth";
import { setActiveOrganization } from "@/lib/session";

export async function switchOrganizationAction(formData: FormData) {
  const organizationId = formData.get("organizationId");
  if (typeof organizationId === "string" && organizationId) {
    await setActiveOrganization(organizationId);
  }
  redirect("/");
}

export async function signOutAction() {
  await signOut({ redirectTo: "/login" });
}
