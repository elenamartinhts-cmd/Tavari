import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Sidebar from "@/components/layout/sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const displayName = (user.user_metadata?.full_name as string | undefined) ?? "";
  const displayPhone = (user.user_metadata?.phone as string | undefined) ?? "";

  return (
    <div className="flex h-screen bg-cream">
      <Sidebar userName={displayName} userEmail={user.email ?? ""} userPhone={displayPhone} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
