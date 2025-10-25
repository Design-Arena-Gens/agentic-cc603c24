"use client";

import { useEffect, useMemo, useState } from "react";
import { BlockEditor } from "@/components/document/block-editor";
import { Button } from "@/components/ui/button";
import type { Tables } from "@/types/database.types";
import { cn } from "@/lib/utils";

interface DocumentEditorProps {
  document: Tables<"documents">;
  blocks: Tables<"blocks">[];
  onUpdateDocumentTitle: (documentId: string, title: string) => void;
  onUpdateDocumentIcon: (documentId: string, icon: string) => void;
  onUpdateBlock: (blockId: string, payload: Partial<Tables<"blocks">>) => void;
  onCreateBlock: (documentId: string, position: number) => void;
  onDeleteBlock: (blockId: string) => void;
  isSaving: boolean;
  canEdit: boolean;
}

export function DocumentEditor({
  document,
  blocks,
  onUpdateDocumentTitle,
  onUpdateDocumentIcon,
  onUpdateBlock,
  onCreateBlock,
  onDeleteBlock,
  isSaving,
  canEdit
}: DocumentEditorProps) {
  const [title, setTitle] = useState(document.title ?? "");
  const [icon, setIcon] = useState(document.icon ?? "📄");

  useEffect(() => {
    setTitle(document.title ?? "");
    setIcon(document.icon ?? "📄");
  }, [document.id, document.title, document.icon]);

  const blockList = useMemo(
    () => [...blocks].sort((a, b) => Number(a.position) - Number(b.position)),
    [blocks]
  );

  const handleTitleBlur = () => {
    if (!canEdit) return;
    const normalizedTitle = title.trim() || "Untitled";
    setTitle(normalizedTitle);
    onUpdateDocumentTitle(document.id, normalizedTitle);
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-10">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <input
              value={icon}
              readOnly={!canEdit}
              onChange={(event) => setIcon(event.target.value)}
              onBlur={() => {
                if (!canEdit) return;
                const normalizedIcon = icon.trim() || "📄";
                setIcon(normalizedIcon);
                onUpdateDocumentIcon(document.id, normalizedIcon);
              }}
              className="h-16 w-16 rounded-lg border border-slate-200 bg-white text-center text-4xl"
              maxLength={2}
            />
            <div className="flex flex-1 flex-col gap-2">
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                onBlur={handleTitleBlur}
                readOnly={!canEdit}
                placeholder="Untitled"
                className={cn(
                  "w-full border-none bg-transparent text-4xl font-semibold text-slate-900 focus:outline-none",
                  !canEdit && "cursor-default"
                )}
              />
              <span className="text-sm text-slate-500">
                {isSaving ? "Saving changes..." : "All changes saved"}
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-4">
          {blockList.length === 0 && (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white/50 p-6 text-sm text-slate-500">
              This page is empty. {canEdit ? "Add your first block to begin." : "Waiting for collaborators to contribute."}
            </div>
          )}
          {blockList.map((block) => (
            <BlockEditor
              key={block.id}
              block={block}
              canEdit={canEdit}
              onChange={(update) => onUpdateBlock(block.id, update)}
              onDelete={() => onDeleteBlock(block.id)}
            />
          ))}
          {canEdit && (
            <Button
              variant="ghost"
              size="sm"
              className="self-start text-indigo-600"
              onClick={() => {
                const maxPosition = blockList.reduce(
                  (acc, block) => Math.max(acc, Number(block.position)),
                  0
                );
                onCreateBlock(document.id, maxPosition + 1);
              }}
            >
              + Add block
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
