import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { bootstrapWorkspace } from "@/lib/bootstrap";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import type { Role, Tables } from "@/types/database.types";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const user = session.user;

  const workspace = await bootstrapWorkspace(
    supabase,
    user.id,
    user.email,
    (user.user_metadata?.full_name as string | undefined) ??
      (user.user_metadata?.name as string | undefined)
  );

  const { data: membership } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspace.id)
    .eq("user_id", user.id)
    .maybeSingle<{ role: Role }>();

  const { data: documentsData } = await supabase
    .from("documents")
    .select("*")
    .eq("workspace_id", workspace.id)
    .order("updated_at", { ascending: false });

  const documents: Tables<"documents">[] = documentsData ?? [];

  const activeDocumentId = documents.length > 0 ? documents[0].id : null;

  let blocksData: Tables<"blocks">[] = [];
  if (activeDocumentId) {
    const { data } = await supabase
      .from("blocks")
      .select("*")
      .eq("document_id", activeDocumentId)
      .order("position", { ascending: true });
    blocksData = data ?? [];
  }

  return (
    <DashboardShell
      user={user}
      workspace={workspace}
      role={membership?.role ?? "editor"}
      documents={documents}
      initialDocumentId={activeDocumentId}
      initialBlocks={blocksData}
    />
  );
}
