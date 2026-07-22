import { getActiveMembership } from "@/lib/session";
import { TopBar } from "@/components/layout/top-bar";
import { SidebarNav } from "@/components/layout/sidebar-nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session, membership, memberships } = await getActiveMembership();

  return (
    <div className="flex min-h-screen">
      <SidebarNav />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          userName={session.user.name}
          userEmail={session.user.email}
          activeOrgName={membership.organizationName}
          memberships={memberships}
        />
        <main className="mx-auto w-full max-w-[1600px] flex-1 px-6 py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
