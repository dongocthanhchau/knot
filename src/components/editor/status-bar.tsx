"use client";

import type { Editor } from "@tiptap/react";

export type SaveStatus = "idle" | "saving" | "saved" | "unsaved";

interface StatusBarProps {
  editor: Editor | null;
  saveStatus: SaveStatus;
  lastSavedAt: Date | null;
}

export function StatusBar({ editor, saveStatus, lastSavedAt }: StatusBarProps) {
  if (!editor) return null;

  const { doc } = editor.state;
  const text = doc.textContent;
  const wordCount = text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;
  const charCount = text.length;
  const pageCount = Math.max(1, Math.ceil(wordCount / 250));

  return (
    <div className="flex items-center justify-between border-t px-4 py-1.5 text-xs text-muted-foreground">
      <div className="flex items-center gap-4">
        <span>{wordCount} words</span>
        <span>{charCount} characters</span>
        <span>~{pageCount} page{pageCount !== 1 ? "s" : ""}</span>
      </div>
      <div>
        {saveStatus === "saving" && <span className="text-amber-500">Saving...</span>}
        {saveStatus === "saved" && lastSavedAt && (
          <span>Saved at {lastSavedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
        )}
        {saveStatus === "saved" && !lastSavedAt && <span>Saved</span>}
        {saveStatus === "unsaved" && <span>Unsaved changes</span>}
      </div>
    </div>
  );
}
