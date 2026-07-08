"use client";

import { useState, useRef } from "react";
import { Upload, FileText } from "lucide-react";
import { Button, Dialog, DialogHeader } from "@astryxdesign/core";
import { importNoteAction } from "@/server/notes";
import { useRouter } from "next/navigation";

export function ImportDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImport = async () => {
    if (!content.trim()) return;
    setImporting(true);
    setError(null);
    try {
      const { id } = await importNoteAction(title.trim(), content);
      setOpen(false);
      setTitle("");
      setContent("");
      router.push(`/notes/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImporting(false);
    }
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      setContent(text);
      if (!title.trim()) {
        const name = file.name.replace(/\.[^/.]+$/, "");
        setTitle(name);
      }
    } catch {
      setError("Failed to read file");
    }
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant="secondary"
        size="sm"
        label="Import"
        icon={<Upload size={16} />}
      />

      <Dialog isOpen={open} onOpenChange={setOpen} purpose="required">
        <DialogHeader title="Import Note" subtitle="Paste HTML or upload a file" />

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Title (optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Note title..."
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Content (HTML)
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste HTML content here..."
              rows={10}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".html,.htm,.md,.txt"
              onChange={handleFile}
              className="hidden"
            />
            <Button
              variant="secondary"
              size="sm"
              label="Browse File..."
              icon={<FileText size={14} />}
              onClick={() => fileInputRef.current?.click()}
            />
            <span className="text-xs text-muted-foreground">
              .html, .htm, .md, .txt
            </span>
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-xs text-destructive">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="secondary" label="Cancel" onClick={() => setOpen(false)} />
            <Button
              variant="primary"
              label={importing ? "Importing..." : "Import"}
              onClick={handleImport}
              isDisabled={!content.trim() || importing}
            />
          </div>
        </div>
      </Dialog>
    </>
  );
}
