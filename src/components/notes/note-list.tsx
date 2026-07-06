"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, Plus, Trash2, Clock, Search } from "lucide-react";
import { Button, Dialog, DialogHeader } from "@astryxdesign/core";
import { Skeleton } from "@astryxdesign/core";
import {
  listNotesAction,
  createNoteAction,
  deleteNoteAction,
  searchNotesAction,
} from "@/server/notes";

type NoteListItem = {
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

export function NoteList() {
  const router = useRouter();
  const [notes, setNotes] = useState<NoteListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [noteToDelete, setNoteToDelete] = useState<NoteListItem | null>(null);

  const fetchNotes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await listNotesAction();
      setNotes(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load notes");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (!value.trim()) {
      fetchNotes();
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        setError(null);
        const result = await searchNotesAction(value.trim());
        setNotes(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Search failed");
      } finally {
        setIsSearching(false);
      }
    }, 300);
  };

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, []);

  const handleCreate = async () => {
    try {
      const { id } = await createNoteAction();
      router.push(`/notes/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create note");
    }
  };

  const handleDelete = async () => {
    if (!noteToDelete) return;
    const id = noteToDelete.id;
    setDeletingId(id);
    try {
      await deleteNoteAction(id);
      setNoteToDelete(null);
      await fetchNotes();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete note");
    } finally {
      setDeletingId(null);
    }
  };

  const hasNoNotes = !isLoading && !isSearching && notes.length === 0 && !error && !query.trim();
  const hasNoResults = !isLoading && !isSearching && notes.length === 0 && !error && !!query.trim();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">Notes</h2>
        <Button onClick={handleCreate} variant="primary" size="sm" label="New Note" icon={<Plus size={16} />} />
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          id="search-notes"
          name="search"
          type="text"
          placeholder="Search notes..."
          value={query}
          onChange={handleSearchInput}
          className="flex h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

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
      {hasNoNotes && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
          <FileText className="mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="mb-1 text-sm font-medium">No notes yet</p>
          <p className="mb-4 text-xs text-muted-foreground">
            Create your first note to get started
          </p>
          <Button onClick={handleCreate} variant="secondary" size="sm" label="Create Note" icon={<Plus size={16} />} />
        </div>
      )}

      {/* No results state */}
      {hasNoResults && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
          <Search className="mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="mb-1 text-sm font-medium">No results</p>
          <p className="text-xs text-muted-foreground">
            No notes match &ldquo;{query}&rdquo;
          </p>
        </div>
      )}

      {/* Populated state */}
      {!isLoading && !error && notes.length > 0 && (
        <div className="space-y-2">
          {notes.map((note) => (
            <div
              key={note.id}
              className="group relative rounded-lg border p-4 transition-colors hover:bg-accent/50"
            >
              <Link
                href={`/notes/${note.id}`}
                className="flex items-start justify-between gap-4"
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
                  <div className="flex items-center gap-1.5 pt-1 text-[11px] text-muted-foreground/70">
                    <Clock className="h-3 w-3" />
                    <span>{formatRelativeTime(note.updatedAt)}</span>
                  </div>
                </div>
              </Link>

              {/* Delete button — outside Link to avoid navigation */}
              <div className="absolute right-3 top-3 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  variant="ghost"
                  isIconOnly
                  icon={<Trash2 size={14} />}
                  label="Delete note"
                  tooltip="Delete note"
                  onClick={() => setNoteToDelete(note)}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation dialog */}
      <Dialog
        isOpen={noteToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setNoteToDelete(null);
        }}
        purpose="required"
      >
        <DialogHeader
          title="Delete note"
          subtitle={
            noteToDelete
              ? `Are you sure you want to delete ${noteToDelete.title}? This action cannot be undone.`
              : undefined
          }
        />
        <div className="flex justify-end gap-2">
          <Button
            variant="secondary"
            label="Cancel"
            onClick={() => setNoteToDelete(null)}
            isDisabled={deletingId !== null}
          />
          <Button
            variant="destructive"
            label={deletingId !== null ? "Deleting\u2026" : "Delete"}
            isDisabled={deletingId !== null}
            onClick={handleDelete}
          />
        </div>
      </Dialog>
    </div>
  );
}
