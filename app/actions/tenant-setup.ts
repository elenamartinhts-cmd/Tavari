"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export interface TenantSetupData {
  password: string;
  full_name: string;
  phone: string;
  date_of_birth: string;
  nationality: string;
  current_address: string;
  id_type: "dni" | "nie" | "passport" | "";
  id_number: string;
  id_expiry_date: string;
  employer: string;
  position: string;
  monthly_income: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relationship: string;
  guarantor_name: string;
  guarantor_phone: string;
  guarantor_id_number: string;
}

export async function completeTenantSetup(
  data: TenantSetupData
): Promise<{ error?: string; tenantId?: string }> {
  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const tenantId = user.user_metadata?.tenant_id as string | undefined;
  if (!tenantId) return { error: "Cuenta no vinculada a ningún inquilino" };

  const { error: pwError } = await supabase.auth.updateUser({ password: data.password });
  if (pwError) return { error: pwError.message };

  const { error } = await admin
    .from("tenants")
    .update({
      user_id: user.id,
      full_name: data.full_name,
      phone: data.phone || null,
      date_of_birth: data.date_of_birth || null,
      nationality: data.nationality || null,
      current_address: data.current_address || null,
      id_type: (data.id_type as "dni" | "nie" | "passport") || null,
      id_number: data.id_number || null,
      id_expiry_date: data.id_expiry_date || null,
      employer: data.employer || null,
      position: data.position || null,
      monthly_income: data.monthly_income ? parseFloat(data.monthly_income) : null,
      emergency_contact_name: data.emergency_contact_name || null,
      emergency_contact_phone: data.emergency_contact_phone || null,
      emergency_contact_relationship: data.emergency_contact_relationship || null,
      guarantor_name: data.guarantor_name || null,
      guarantor_phone: data.guarantor_phone || null,
      guarantor_id_number: data.guarantor_id_number || null,
    })
    .eq("id", tenantId);

  if (error) return { error: error.message };
  return { tenantId };
}
