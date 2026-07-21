import type { DefaultSession } from "next-auth";
import type { MembershipRole } from "@/generated/prisma/enums";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      memberships: Array<{
        organizationId: string;
        organizationName: string;
        role: MembershipRole;
      }>;
    } & DefaultSession["user"];
  }
}
