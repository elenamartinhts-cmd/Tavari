"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const BUCKET = "contract-documents";

export async function uploadContractDocument(
  contractId: string,
  formData: FormData
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autorizado" };

  const admin = createAdminClient();

  // Verify ownership
  const { data: contract } = await admin
    .from("contracts")
    .select("id")
    .eq("id", contractId)
    .eq("landlord_id", user.id)
    .single();
  if (!contract) return { error: "Contrato no encontrado" };

  const file = formData.get("file") as File | null;
  if (!file) return { error: "No se recibió ningún archivo" };
  if (file.size > 10 * 1024 * 1024) return { error: "El archivo no puede superar 10 MB." };

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const path = `${user.id}/${contractId}/contrato.${ext}`;

  const bytes = await file.arrayBuffer();
  const { error: uploadError } = await admin.storage
    .from(BUCKET)
    .upload(path, bytes, { contentType: file.type, upsert: true });

  if (uploadError) return { error: uploadError.message };

  const { error: updateError } = await admin
    .from("contracts")
    .update({ document_url: path })
    .eq("id", contractId);

  if (updateError) return { error: updateError.message };

  revalidatePath(`/contracts/${contractId}`);
  return {};
}

export async function getContractDocumentUrl(
  contractId: string,
  path: string
): Promise<{ url?: string; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autorizado" };

  const admin = createAdminClient();

  // Verify ownership before generating URL
  const { data: contract } = await admin
    .from("contracts")
    .select("id")
    .eq("id", contractId)
    .eq("landlord_id", user.id)
    .single();
  if (!contract) return { error: "No autorizado" };

  const { data, error } = await admin.storage
    .from(BUCKET)
    .createSignedUrl(path, 3600);

  if (error || !data) return { error: error?.message ?? "Error al generar enlace" };
  return { url: data.signedUrl };
}
