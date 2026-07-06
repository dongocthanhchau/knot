"use client";

import { useEffect, useState, useCallback } from "react";
import { Trash2, RotateCcw, AlertTriangle } from "lucide-react";
import { Button, Dialog, DialogHeader } from "@astryxdesign/core";
import { Skeleton } from "@astryxdesign/core";
import {
  listTrashNotesAction,
  restoreNoteAction,
  permanentlyDeleteNoteAction,
} from "@/server/notes";

type TrashNoteItem = {
  id: string;
  title: string;
  preview: string;
  createdAt: string;
  updatedAt: string;
};

function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "");
}

export function TrashList() {
  const [notes, setNotes] = useState<TrashNoteItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [noteToDelete, setNoteToDelete] = useState<TrashNoteItem | null>(null);

  const fetchNotes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await listTrashNotesAction();
      setNotes(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load trash");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleRestore = async (id: string) => {
    setActionId(id);
    try {
      await restoreNoteAction(id);
      await fetchNotes();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to restore note");
    } finally {
      setActionId(null);
    }
  };

  const handlePermanentDelete = async () => {
    if (!noteToDelete) return;
    const id = noteToDelete.id;
    setActionId(id);
    try {
      await permanentlyDeleteNoteAction(id);
      setNoteToDelete(null);
      await fetchNotes();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to permanently delete note",
      );
    } finally {
      setActionId(null);
    }
  };

  const isEmpty = !isLoading && notes.length === 0 && !error;

  return (
    <div className="space-y-4">
      {/* Loading state */}
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-lg border p-4 space-y-2">
              <Skeleton height={20} width="60%" radius={1} />
              <Skeleton height={16} width="100%" radius={1} />
              <Skeleton height={12} width="25%" radius={1} />
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="rounded-lg border border-destructive/50 p-6 text-center space-y-3">
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="secondary" size="sm" label="Try again" onClick={fetchNotes} />
        </div>
      )}

      {/* Empty state */}
      {isEmpty && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
          <Trash2 className="mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="mb-1 text-sm font-medium">Trash is empty</p>
          <p className="mb-4 text-xs text-muted-foreground">
            Deleted notes will appear here
          </p>
        </div>
      )}

      {/* Populated state */}
      {!isLoading && !error && notes.length > 0 && (
        <div className="space-y-2">
          {notes.map((note) => (
            <div
              key={note.id}
              className="flex items-start justify-between gap-4 rounded-lg border p-4 transition-colors hover:bg-accent/50"
            >
              <div className="min-w-0 flex-1 space-y-1">
                <h3 className="truncate text-sm font-semibold">
                  {note.title}
                </h3>
                {note.preview && (
                  <p className="line-clamp-2 text-xs text-muted-foreground">
                    {stripHtml(note.preview)}
                  </p>
                )}
                <p className="pt-1 text-[11px] text-muted-foreground/70">
                  Deleted {formatRelativeTime(note.updatedAt)}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  label="Restore"
                  icon={<RotateCcw size={14} />}
                  isDisabled={actionId === note.id}
                  onClick={() => handleRestore(note.id)}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  label="Delete"
                  icon={<AlertTriangle size={14} />}
                  isDisabled={actionId === note.id}
                  onClick={() => setNoteToDelete(note)}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Permanent delete confirmation dialog */}
      <Dialog
        isOpen={noteToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setNoteToDelete(null);
        }}
        purpose="required"
      >
        <DialogHeader
          title="Permanently delete note"
          subtitle={
            noteToDelete
              ? `This action cannot be undone. This will permanently delete ${noteToDelete.title}.`
              : undefined
          }
        />
        <div className="flex justify-end gap-2">
          <Button
            variant="secondary"
            label="Cancel"
            onClick={() => setNoteToDelete(null)}
            isDisabled={actionId !== null}
          />
          <Button
            variant="destructive"
            label={actionId !== null ? "Deleting\u2026" : "Permanently delete"}
            isDisabled={actionId !== null}
            onClick={handlePermanentDelete}
          />
        </div>
      </Dialog>
    </div>
  );
}
