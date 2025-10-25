"use client";

import { useEffect, useState } from "react";
import type { Tables } from "@/types/database.types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const typeOptions = [
  { value: "paragraph", label: "Text" },
  { value: "heading", label: "Heading" },
  { value: "todo", label: "To-do" }
] as const;

type Block = Tables<"blocks">;

type BlockUpdate = Partial<Block>;

interface BlockEditorProps {
  block: Block;
  canEdit: boolean;
  onChange: (update: BlockUpdate) => void;
  onDelete: () => void;
}

export function BlockEditor({ block, canEdit, onChange, onDelete }: BlockEditorProps) {
  const initialContent = (block.content as { text?: string; checked?: boolean }) ?? { text: "" };
  const [value, setValue] = useState(initialContent.text ?? "");
  const [checked, setChecked] = useState(initialContent.checked ?? false);

  useEffect(() => {
    setValue(initialContent.text ?? "");
    setChecked(initialContent.checked ?? false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [block.id]);

  const handleBlur = () => {
    if (!canEdit) return;
    onChange({
      content: {
        text: value,
        checked: checked
      }
    });
  };

  const handleTypeChange = (nextType: Block["type"]) => {
    if (!canEdit) return;
    onChange({
      type: nextType,
      content:
        nextType === "todo"
          ? { text: value, checked }
          : nextType === "heading"
          ? { text: value }
          : { text: value }
    });
  };

  return (
    <div className="group relative flex w-full flex-col rounded-lg border border-transparent bg-white/70 p-3 transition hover:border-indigo-200 hover:shadow-sm">
      <div className="flex items-center justify-between pb-2">
        <select
          value={block.type}
          disabled={!canEdit}
          onChange={(event) => handleTypeChange(event.target.value as Block["type"])}
          className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-600 shadow-sm focus:outline-none"
        >
          {typeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {canEdit && (
          <Button variant="ghost" size="sm" onClick={onDelete} className="text-xs text-rose-500">
            Delete
          </Button>
        )}
      </div>
      <div className="flex w-full items-start gap-3">
        {block.type === "todo" && (
          <input
            type="checkbox"
            className="mt-2 h-4 w-4 rounded border-slate-300 text-indigo-500 focus:ring-indigo-500"
            checked={checked}
            disabled={!canEdit}
            onChange={(event) => {
              setChecked(event.target.checked);
              onChange({
                content: {
                  text: value,
                  checked: event.target.checked
                }
              });
            }}
          />
        )}
        {block.type === "heading" ? (
          <textarea
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onBlur={handleBlur}
            readOnly={!canEdit}
            placeholder="Heading"
            rows={1}
            className={cn(
              "w-full resize-none bg-transparent text-2xl font-semibold text-slate-900 focus:outline-none",
              !canEdit && "cursor-default"
            )}
          />
        ) : (
          <textarea
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onBlur={handleBlur}
            readOnly={!canEdit}
            placeholder="Start typing..."
            rows={block.type === "todo" ? 1 : 3}
            className={cn(
              "w-full resize-none bg-transparent text-base text-slate-800 focus:outline-none",
              !canEdit && "cursor-default"
            )}
          />
        )}
      </div>
    </div>
  );
}
