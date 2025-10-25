"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Tables } from "@/types/database.types";

interface SidebarProps {
  documents: Tables<"documents">[];
  selectedDocumentId: string | null;
  onSelectDocument: (id: string) => void;
  onCreateDocument: () => Promise<void>;
  onDeleteDocument: (id: string) => Promise<void>;
  isOpen: boolean;
  canEdit: boolean;
}

export function Sidebar({
  documents,
  selectedDocumentId,
  onSelectDocument,
  onCreateDocument,
  onDeleteDocument,
  isOpen,
  canEdit
}: SidebarProps) {
  return (
    <aside
      className={cn(
        "scrollbar-thin flex h-full w-72 flex-col border-r border-slate-200 bg-white/80 backdrop-blur transition-all duration-200",
        !isOpen && "-ml-72 lg:ml-0"
      )}
    >
      <div className="flex items-center justify-between px-4 py-4">
        <span className="text-sm font-semibold uppercase tracking-wide text-slate-500">Pages</span>
        <Button
          variant="outline"
          size="sm"
          onClick={onCreateDocument}
          disabled={!canEdit}
          title={canEdit ? "Create a new page" : "You have read-only access"}
        >
          + New page
        </Button>
      </div>
      <nav className="flex-1 overflow-y-auto px-2 pb-4">
        {documents.length === 0 && (
          <div className="px-2 text-sm text-slate-500">No pages yet. Create your first page.</div>
        )}
        <ul className="space-y-1">
          {documents.map((doc) => {
            const isSelected = selectedDocumentId === doc.id;
            return (
              <li key={doc.id}>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelectDocument(doc.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onSelectDocument(doc.id);
                    }
                  }}
                  className={cn(
                    "group flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2",
                    isSelected && "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span>{doc.icon ?? "📄"}</span>
                    <span className="truncate">{doc.title || "Untitled"}</span>
                  </span>
                  {canEdit && (
                    <button
                      type="button"
                      onClick={async (event) => {
                        event.stopPropagation();
                        await onDeleteDocument(doc.id);
                      }}
                      className="hidden rounded-md px-2 py-1 text-xs text-slate-400 hover:bg-rose-50 hover:text-rose-500 group-hover:block"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
