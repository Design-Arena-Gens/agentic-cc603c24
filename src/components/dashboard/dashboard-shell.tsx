"use client";

import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { DocumentEditor } from "@/components/document/document-editor";
import type { Tables, Database, Role } from "@/types/database.types";
import type { Session } from "@supabase/supabase-js";

interface DashboardShellProps {
  user: Session["user"];
  workspace: Tables<"workspaces">;
  role: Role;
  documents: Tables<"documents">[];
  initialDocumentId: string | null;
  initialBlocks: Tables<"blocks">[];
}

type BlockRecord = Tables<"blocks">;

type BlocksMap = Record<string, BlockRecord[]>;

export function DashboardShell({
  user,
  workspace,
  role,
  documents,
  initialDocumentId,
  initialBlocks
}: DashboardShellProps) {
  const supabase = useSupabaseClient<Database>();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [documentList, setDocumentList] = useState<Tables<"documents">[]>(documents);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(
    initialDocumentId ?? documents[0]?.id ?? null
  );
  const [blocksByDocument, setBlocksByDocument] = useState<BlocksMap>(() => {
    if (initialDocumentId) {
      return { [initialDocumentId]: initialBlocks };
    }
    return {};
  });
  const [isSaving, setIsSaving] = useState(false);
  const canEdit = role === "owner" || role === "editor";

  useEffect(() => {
    if (initialDocumentId) {
      setBlocksByDocument((prev) => ({
        ...prev,
        [initialDocumentId]: initialBlocks
      }));
    }
  }, [initialDocumentId, initialBlocks]);

  const selectedDocument = useMemo(
    () => documentList.find((doc) => doc.id === selectedDocumentId) ?? null,
    [documentList, selectedDocumentId]
  );

  const selectedBlocks = selectedDocument
    ? blocksByDocument[selectedDocument.id] ?? []
    : ([] as BlockRecord[]);

  const fetchBlocks = useCallback(
    async (documentId: string) => {
      const { data, error } = await supabase
        .from("blocks")
        .select("*")
        .eq("document_id", documentId)
        .order("position", { ascending: true });

      if (error) {
        console.error("Failed to load blocks", error.message);
        return;
      }

      setBlocksByDocument((prev) => ({
        ...prev,
        [documentId]: data ?? []
      }));
    },
    [supabase]
  );

  const handleSelectDocument = useCallback(
    async (documentId: string) => {
      setSelectedDocumentId(documentId);
      if (!blocksByDocument[documentId]) {
        await fetchBlocks(documentId);
      }
    },
    [blocksByDocument, fetchBlocks]
  );

  const handleCreateDocument = useCallback(async () => {
    if (!canEdit) return;
    setIsSaving(true);
    const { data: document, error } = await supabase
      .from("documents")
      .insert({
        workspace_id: workspace.id,
        title: "Untitled",
        icon: "📝"
      })
      .select("*")
      .single();

    if (error) {
      console.error("Failed to create document", error.message);
      setIsSaving(false);
      return;
    }

    setDocumentList((prev) => [document, ...prev]);
    setSelectedDocumentId(document.id);

    const { data: blockData, error: blockError } = await supabase
      .from("blocks")
      .insert({
        document_id: document.id,
        type: "paragraph",
        content: { text: "New block" },
        position: 1
      })
      .select("*")
      .single();

    if (blockError) {
      console.error("Failed to create default block", blockError.message);
      setBlocksByDocument((prev) => ({
        ...prev,
        [document.id]: []
      }));
    } else {
      setBlocksByDocument((prev) => ({
        ...prev,
        [document.id]: blockData ? [blockData] : []
      }));
    }

    setIsSaving(false);
  }, [canEdit, supabase, workspace.id]);

  const handleDeleteDocument = useCallback(
    async (documentId: string) => {
      if (!canEdit) return;
      setIsSaving(true);
      const { error } = await supabase.from("documents").delete().eq("id", documentId);

      if (error) {
        console.error("Failed to delete document", error.message);
        setIsSaving(false);
        return;
      }

      setDocumentList((prev) => {
        const next = prev.filter((doc) => doc.id !== documentId);
        if (selectedDocumentId === documentId) {
          setSelectedDocumentId(next[0]?.id ?? null);
        }
        return next;
      });

      setBlocksByDocument((prev) => {
        const nextMap = { ...prev };
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete nextMap[documentId];
        return nextMap;
      });

      setIsSaving(false);
    },
    [canEdit, selectedDocumentId, supabase]
  );

  const handleUpdateDocumentTitle = useCallback(
    async (documentId: string, title: string) => {
      if (!canEdit) return;
      setDocumentList((prev) =>
        prev.map((doc) => (doc.id === documentId ? { ...doc, title, updated_at: new Date().toISOString() } : doc))
      );

      const { error } = await supabase
        .from("documents")
        .update({ title, updated_at: new Date().toISOString() })
        .eq("id", documentId);

      if (error) {
        console.error("Failed to update document title", error.message);
      }
    },
    [canEdit, supabase]
  );

  const handleUpdateDocumentIcon = useCallback(
    async (documentId: string, icon: string) => {
      if (!canEdit) return;
      setDocumentList((prev) =>
        prev.map((doc) => (doc.id === documentId ? { ...doc, icon, updated_at: new Date().toISOString() } : doc))
      );

      const { error } = await supabase
        .from("documents")
        .update({ icon, updated_at: new Date().toISOString() })
        .eq("id", documentId);

      if (error) {
        console.error("Failed to update document icon", error.message);
      }
    },
    [canEdit, supabase]
  );

  const upsertBlockState = useCallback((block: BlockRecord) => {
    setBlocksByDocument((prev) => {
      const current = prev[block.document_id] ?? [];
      const existingIndex = current.findIndex((item) => item.id === block.id);
      if (existingIndex >= 0) {
        const next = [...current];
        next[existingIndex] = block;
        return { ...prev, [block.document_id]: next };
      }
      return {
        ...prev,
        [block.document_id]: [...current, block].sort((a, b) => Number(a.position) - Number(b.position))
      };
    });
  }, []);

  const handleUpdateBlock = useCallback(
    async (blockId: string, payload: Partial<BlockRecord>) => {
      const targetDocumentId = selectedDocumentId;
      if (!targetDocumentId) return;
      if (!canEdit) return;

      setIsSaving(true);
      setBlocksByDocument((prev) => {
        const current = prev[targetDocumentId] ?? [];
        const updated = current.map((block) =>
          block.id === blockId ? { ...block, ...payload, updated_at: new Date().toISOString() } : block
        );
        return {
          ...prev,
          [targetDocumentId]: updated
        };
      });

      const { error, data } = await supabase
        .from("blocks")
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq("id", blockId)
        .select("*")
        .single();

      if (error) {
        console.error("Failed to update block", error.message);
        await fetchBlocks(targetDocumentId);
      } else if (data) {
        upsertBlockState(data);
      }
      setIsSaving(false);
    },
    [canEdit, fetchBlocks, selectedDocumentId, supabase, upsertBlockState]
  );

  const handleCreateBlock = useCallback(
    async (documentId: string, position: number) => {
      if (!canEdit) return;
      setIsSaving(true);
      const { data, error } = await supabase
        .from("blocks")
        .insert({
          document_id: documentId,
          type: "paragraph",
          content: { text: "" },
          position
        })
        .select("*")
        .single();

      if (error) {
        console.error("Failed to create block", error.message);
        setIsSaving(false);
        return;
      }

      setBlocksByDocument((prev) => {
        const current = prev[documentId] ?? [];
        return {
          ...prev,
          [documentId]: [...current, data].sort((a, b) => Number(a.position) - Number(b.position))
        };
      });
      setIsSaving(false);
    },
    [canEdit, supabase]
  );

  const handleDeleteBlock = useCallback(
    async (blockId: string) => {
      const documentId = selectedDocumentId;
      if (!documentId) return;
      if (!canEdit) return;

      setIsSaving(true);
      setBlocksByDocument((prev) => {
        const current = prev[documentId] ?? [];
        return {
          ...prev,
          [documentId]: current.filter((block) => block.id !== blockId)
        };
      });

      const { error } = await supabase.from("blocks").delete().eq("id", blockId);

      if (error) {
        console.error("Failed to delete block", error.message);
        await fetchBlocks(documentId);
      }
      setIsSaving(false);
    },
    [canEdit, fetchBlocks, selectedDocumentId, supabase]
  );

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      <Sidebar
        documents={documentList}
        selectedDocumentId={selectedDocumentId}
        onSelectDocument={handleSelectDocument}
        onCreateDocument={canEdit ? handleCreateDocument : async () => undefined}
        onDeleteDocument={canEdit ? handleDeleteDocument : async () => undefined}
        isOpen={isSidebarOpen}
        canEdit={canEdit}
      />
      <div className="flex flex-1 flex-col">
        {selectedDocument ? (
          <>
            <Topbar
              workspace={workspace}
              user={user}
              onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
              isSidebarOpen={isSidebarOpen}
            />
            <DocumentEditor
              document={selectedDocument}
              blocks={selectedBlocks}
              onUpdateDocumentTitle={handleUpdateDocumentTitle}
              onUpdateDocumentIcon={handleUpdateDocumentIcon}
              onUpdateBlock={handleUpdateBlock}
              onCreateBlock={handleCreateBlock}
              onDeleteBlock={handleDeleteBlock}
              canEdit={canEdit}
              isSaving={isSaving}
            />
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-slate-500">
            <div className="rounded-lg border border-dashed border-slate-300 bg-white/60 p-10 text-center shadow-sm">
              <p className="text-lg font-medium">No page selected</p>
              <p className="mt-2 text-sm text-slate-500">
                Create a new page from the sidebar to start taking notes.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
