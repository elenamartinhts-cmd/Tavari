import { notFound, redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import PortalSidebar from "@/components/portal/portal-sidebar";

export default async function PortalLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const role = user.user_metadata?.role as string | undefined;
  if (role === "tenant") {
    const myTenantId = user.user_metadata?.tenant_id as string | undefined;
    if (myTenantId && myTenantId !== tenantId) redirect(`/portal/${myTenantId}`);
  }

  const admin = createAdminClient();
  const { data: tenant } = await admin
    .from("tenants")
    .select("full_name, email, is_active")
    .eq("id", tenantId)
    .single();

  if (!tenant || !tenant.is_active) notFound();

  return (
    <div className="flex h-screen bg-cream">
      <PortalSidebar
        tenantId={tenantId}
        tenantName={tenant.full_name}
        tenantEmail={tenant.email}
      />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
