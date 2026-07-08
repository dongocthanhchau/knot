"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, ChevronRight, ChevronDown } from "lucide-react";
import { getNoteTreeAction } from "@/server/notes";

interface TreeNode {
  id: string;
  title: string;
  parentId: string | null;
}

export function NoteTree() {
  const pathname = usePathname();
  const [notes, setNotes] = useState<TreeNode[]>([]);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    getNoteTreeAction().then(setNotes).catch(() => {});
  }, []);

  const rootNotes = notes.filter((n) => !n.parentId);
  const getChildren = (parentId: string) => notes.filter((n) => n.parentId === parentId);

  return (
    <div className="px-2 py-1">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 w-full px-2 py-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md"
      >
        {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        Note Tree
      </button>

      {expanded && (
        <div className="mt-1 space-y-0.5">
          {rootNotes.map((note) => (
            <TreeItem
              key={note.id}
              note={note}
              children={getChildren(note.id)}
              getChildren={getChildren}
              pathname={pathname}
              depth={0}
            />
          ))}
          {notes.length === 0 && (
            <p className="px-2 py-2 text-[11px] text-muted-foreground text-center">
              No notes yet
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function TreeItem({
  note,
  children,
  getChildren,
  pathname,
  depth,
}: {
  note: TreeNode;
  children: TreeNode[];
  getChildren: (parentId: string) => TreeNode[];
  pathname: string;
  depth: number;
}) {
  const [open, setOpen] = useState(false);
  const isActive = pathname === `/notes/${note.id}`;
  const hasChildren = children.length > 0;

  return (
    <div>
      <Link
        href={`/notes/${note.id}`}
        className={`flex items-center gap-1.5 w-full px-2 py-1 rounded-md text-xs transition-colors ${
          isActive
            ? "bg-accent text-accent-foreground font-medium"
            : "hover:bg-accent/50 text-muted-foreground hover:text-foreground"
        }`}
        style={{ paddingLeft: `${8 + depth * 14}px` }}
        onClick={(e) => {
          if (hasChildren) e.stopPropagation();
        }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setOpen(!open);
            }}
            className="shrink-0"
          >
            {open ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
          </button>
        ) : (
          <span className="w-[10px] shrink-0" />
        )}
        <FileText size={12} className="shrink-0" />
        <span className="truncate">{note.title || "Untitled"}</span>
      </Link>

      {open && hasChildren && (
        <div>
          {children.map((child) => (
            <TreeItem
              key={child.id}
              note={child}
              children={getChildren(child.id)}
              getChildren={getChildren}
              pathname={pathname}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
