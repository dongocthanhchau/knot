"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FileText, Save, Trash2 } from "lucide-react";
import { Button, Dialog, DialogHeader } from "@astryxdesign/core";
import { listTemplatesAction, saveTemplateAction, deleteTemplateAction } from "@/server/templates";
import { createNoteAction } from "@/server/notes";

interface Template {
  id: string;
  name: string;
  content: string;
  createdAt: string;
}

export function SaveAsTemplateDialog({ currentContent }: { currentContent: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || !currentContent.trim()) return;
    setSaving(true);
    try {
      await saveTemplateAction(name.trim(), currentContent);
      setOpen(false);
      setName("");
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md border border-input bg-background hover:bg-accent/50 transition-colors"
      >
        <Save size={14} />
        Save as Template
      </button>

      <Dialog isOpen={open} onOpenChange={setOpen} purpose="required">
        <DialogHeader title="Save as Template" subtitle="Save current content as a reusable template" />
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Template name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My template..."
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" label="Cancel" onClick={() => setOpen(false)} />
            <Button
              variant="primary"
              label={saving ? "Saving..." : "Save"}
              onClick={handleSave}
              isDisabled={!name.trim() || saving}
            />
          </div>
        </div>
      </Dialog>
    </>
  );
}

export function CreateFromTemplateButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);

  useEffect(() => {
    if (open) listTemplatesAction().then(setTemplates);
  }, [open]);

  const handleCreateFromTemplate = async (template: Template) => {
    try {
      const { id } = await createNoteAction(template.content);
      router.push(`/notes/${id}`);
    } catch {
      // ignore
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md border border-input bg-background hover:bg-accent/50 transition-colors"
      >
        <FileText size={14} />
        Templates
      </button>

      <Dialog isOpen={open} onOpenChange={setOpen} purpose="required">
        <DialogHeader title="Templates" subtitle="Create a new note from a template" />
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {templates.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No templates yet</p>
          )}
          {templates.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => handleCreateFromTemplate(t)}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md hover:bg-accent/50 transition-colors text-left"
            >
              <FileText size={14} className="shrink-0 text-muted-foreground" />
              <span className="truncate">{t.name}</span>
            </button>
          ))}
        </div>
        <div className="flex justify-end">
          <Button variant="secondary" label="Close" onClick={() => setOpen(false)} />
        </div>
      </Dialog>
    </>
  );
}
