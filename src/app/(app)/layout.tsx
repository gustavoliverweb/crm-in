import { getActiveMembership } from "@/lib/session";
import { TopBar } from "@/components/layout/top-bar";
import { MainNav } from "@/components/layout/main-nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session, membership, memberships } = await getActiveMembership();

  return (
    <div className="flex min-h-screen flex-col">
      <TopBar
        userName={session.user.name}
        userEmail={session.user.email}
        activeOrgName={membership.organizationName}
        memberships={memberships}
      />
      <MainNav />
      <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-6">
        {children}
      </main>
    </div>
  );
}
