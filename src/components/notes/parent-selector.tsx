"use client";

import { useState, useEffect, useRef } from "react";
import { FolderTree, X } from "lucide-react";
import { getNoteTreeAction, setNoteParentAction } from "@/server/notes";

interface NoteNode {
  id: string;
  title: string;
  parentId: string | null;
}

interface ParentSelectorProps {
  noteId: string;
  currentParentId?: string | null;
}

export function ParentSelector({ noteId, currentParentId }: ParentSelectorProps) {
  const [notes, setNotes] = useState<NoteNode[]>([]);
  const [open, setOpen] = useState(false);
  const [parentTitle, setParentTitle] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getNoteTreeAction().then((result) => {
      setNotes(result.filter((n) => n.id !== noteId));
      const parent = result.find((n) => n.id === currentParentId);
      if (parent) setParentTitle(parent.title);
    });
  }, [noteId, currentParentId]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleSetParent = async (parentId: string | null, parentTitle?: string) => {
    await setNoteParentAction(noteId, parentId);
    setParentTitle(parentTitle ?? "");
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md border border-input bg-background hover:bg-accent/50 transition-colors"
      >
        <FolderTree size={14} />
        {parentTitle ? `In: ${parentTitle}` : "Move..."}
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 w-56 rounded-lg border bg-popover p-1.5 shadow-md max-h-60 overflow-y-auto">
          <p className="px-2 py-1 text-[11px] font-medium text-muted-foreground">
            Move to parent
          </p>

          {currentParentId && (
            <button
              type="button"
              onClick={() => handleSetParent(null)}
              className="flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded-md hover:bg-accent/50 transition-colors text-left"
            >
              <X size={14} className="shrink-0" />
              <span>Remove parent (root)</span>
            </button>
          )}

          {notes
            .filter((n) => n.id !== noteId)
            .map((note) => (
              <button
                key={note.id}
                type="button"
                onClick={() => handleSetParent(note.id, note.title)}
                className={`flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded-md hover:bg-accent/50 transition-colors text-left ${
                  currentParentId === note.id ? "bg-accent" : ""
                }`}
              >
                <FolderTree size={14} className="shrink-0 text-muted-foreground" />
                <span className="truncate">{note.title || "Untitled"}</span>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
