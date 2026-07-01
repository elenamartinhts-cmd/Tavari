import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import PortalSidebar from "@/components/portal/portal-sidebar";

export default async function PortalLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = await params;
  const supabase = createAdminClient();
  const { data: tenant } = await supabase
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
