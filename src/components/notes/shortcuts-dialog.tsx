"use client";

import { useState, useEffect } from "react";
import { Keyboard } from "lucide-react";
import { Button, Dialog, DialogHeader } from "@astryxdesign/core";

const SHORTCUTS = [
  { keys: "Ctrl/Cmd + S", label: "Save note" },
  { keys: "Ctrl/Cmd + K", label: "Toggle outline sidebar" },
  { keys: "Ctrl/Cmd + P", label: "Toggle focus mode" },
  { keys: "Ctrl/Cmd + F", label: "Find & Replace" },
  { keys: "Ctrl/Cmd + Z", label: "Undo" },
  { keys: "Ctrl/Cmd + Shift + Z", label: "Redo" },
  { keys: "Ctrl/Cmd + B", label: "Bold" },
  { keys: "Ctrl/Cmd + I", label: "Italic" },
  { keys: "Ctrl/Cmd + U", label: "Underline" },
  { keys: "Ctrl/Cmd + Shift + S", label: "Strikethrough" },
  { keys: "Tab", label: "Indent list item" },
  { keys: "Shift + Tab", label: "Outdent list item" },
  { keys: "Enter", label: "New paragraph / split block" },
  { keys: "/", label: "Slash menu (inline)" },
  { keys: "?", label: "Show this shortcuts panel" },
];

export function ShortcutsDialog() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "?" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        setOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md border border-input bg-background hover:bg-accent/50 transition-colors"
      >
        <Keyboard size={14} />
        Shortcuts
      </button>

      <Dialog isOpen={open} onOpenChange={setOpen} purpose="required">
        <DialogHeader title="Keyboard Shortcuts" subtitle="Available shortcuts in the editor" />
        <div className="space-y-0.5 max-h-60 overflow-y-auto">
          {SHORTCUTS.map((s) => (
            <div key={s.keys} className="flex items-center justify-between px-1 py-1.5 text-sm">
              <span className="text-muted-foreground">{s.label}</span>
              <kbd className="px-1.5 py-0.5 text-[11px] font-mono rounded border bg-muted text-muted-foreground">
                {s.keys}
              </kbd>
            </div>
          ))}
        </div>
        <div className="flex justify-end">
          <Button variant="secondary" label="Close" onClick={() => setOpen(false)} />
        </div>
      </Dialog>
    </>
  );
}
