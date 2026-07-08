"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, Plus, Trash2, Clock, Search, Pin, PinOff, Upload, CheckSquare, Square, Tag } from "lucide-react";
import { ImportDialog } from "@/components/notes/import-dialog";
import { CreateFromTemplateButton } from "@/components/notes/template-picker";
import { Button, Dialog, DialogHeader } from "@astryxdesign/core";
import { Skeleton } from "@astryxdesign/core";
import {
  listNotesWithTagsAction,
  createNoteAction,
  deleteNoteAction,
  searchNotesAction,
  togglePinAction,
  bulkDeleteAction,
} from "@/server/notes";
import { TagBadge } from "./tag-badge";
import { listTagsAction } from "@/server/tags";

type TagInfo = { id: string; name: string; color: string | null };

type NoteListItem = {
  id: string;
  title: string;
  preview: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  tags: TagInfo[];
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
  const [tagsByNote, setTagsByNote] = useState<Record<string, TagInfo[]>>({});
  const [allTags, setAllTags] = useState<TagInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [noteToDelete, setNoteToDelete] = useState<NoteListItem | null>(null);
  const [filterTagId, setFilterTagId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    try {
      await bulkDeleteAction(Array.from(selectedIds));
      setSelectedIds(new Set());
      await fetchNotes();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete notes");
    }
  };

  const fetchNotes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [result, tagsResult] = await Promise.all([
        listNotesWithTagsAction(),
        listTagsAction(),
      ]);
      setNotes(result);
      setAllTags(tagsResult);

      const tagMap: Record<string, TagInfo[]> = {};
      for (const note of result) {
        tagMap[note.id] = note.tags;
      }
      setTagsByNote(tagMap);
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

  const handleTogglePin = async (noteId: string) => {
    try {
      const { isPinned } = await togglePinAction(noteId);
      setNotes((prev) =>
        prev.map((n) => (n.id === noteId ? { ...n, isPinned } : n)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to toggle pin");
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

  // Filter notes by tag
  const filteredNotes = filterTagId
    ? notes.filter((n) => tagsByNote[n.id]?.some((t) => t.id === filterTagId))
    : notes;

  const hasNoNotes = !isLoading && !isSearching && notes.length === 0 && !error && !query.trim();
  const hasNoResults = !isLoading && !isSearching && filteredNotes.length === 0 && !error && !!query.trim();
  const hasNoFiltered = !isLoading && !isSearching && filteredNotes.length === 0 && notes.length > 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">All Notes</h2>
        <div className="flex items-center gap-2">
          <CreateFromTemplateButton />
          <ImportDialog />
          <Button onClick={handleCreate} variant="primary" size="sm" label="New Note" icon={<Plus size={16} />} />
        </div>
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

      {/* Tag filter bar */}
      {allTags.length > 0 && !query.trim() && (
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setFilterTagId(null)}
            className={`text-xs px-2 py-1 rounded-md transition-colors ${
              filterTagId === null
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-accent"
            }`}
          >
            All
          </button>
          {allTags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => setFilterTagId(tag.id === filterTagId ? null : tag.id)}
            >
              <TagBadge
                name={tag.name}
                color={tag.color}
                size="md"
              />
            </button>
          ))}
        </div>
      )}

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

      {/* Filtered empty */}
      {hasNoFiltered && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
          <p className="mb-1 text-sm font-medium">No matching notes</p>
          <p className="text-xs text-muted-foreground">
            No notes with the selected tag
          </p>
        </div>
      )}

      {/* Bulk actions bar */}
      {selectedIds.size > 0 && (
        <div className="sticky top-0 z-10 -mx-4 -mt-4 mb-2 flex items-center gap-2 rounded-lg border bg-background px-4 py-2 shadow-sm">
          <CheckSquare size={16} className="text-primary" />
          <span className="text-sm font-medium">{selectedIds.size} selected</span>
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="destructive"
              size="sm"
              label={`Delete (${selectedIds.size})`}
              icon={<Trash2 size={14} />}
              onClick={handleBulkDelete}
            />
            <Button
              variant="secondary"
              size="sm"
              label="Clear"
              onClick={() => setSelectedIds(new Set())}
            />
          </div>
        </div>
      )}

      {/* Populated state */}
      {!isLoading && !error && filteredNotes.length > 0 && (
        <div className="space-y-2">
          {filteredNotes.map((note) => {
            const tags = tagsByNote[note.id] ?? [];
            const isSelected = selectedIds.has(note.id);
            return (
              <div
                key={note.id}
                className={`group relative rounded-lg border p-4 transition-colors hover:bg-accent/50 ${
                  isSelected ? "border-primary/50 bg-primary/[0.03]" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Selection checkbox */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      const next = new Set(selectedIds);
                      if (isSelected) next.delete(note.id);
                      else next.add(note.id);
                      setSelectedIds(next);
                    }}
                    className="mt-1 shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                  </button>

                  <Link
                    href={`/notes/${note.id}`}
                    className="flex flex-1 items-start justify-between gap-4"
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
                      {tags.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1 pt-1">
                          {tags.map((tag) => (
                            <TagBadge key={tag.id} name={tag.name} color={tag.color} />
                          ))}
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Pin & delete buttons — outside Link to avoid navigation */}
                  <div className="flex items-center gap-0.5">
                    <div className="opacity-0 transition-opacity group-hover:opacity-100 flex items-center gap-0.5">
                      <Button
                        variant="ghost"
                        isIconOnly
                        icon={note.isPinned ? <PinOff size={14} /> : <Pin size={14} />}
                        label={note.isPinned ? "Unpin note" : "Pin note"}
                        tooltip={note.isPinned ? "Unpin" : "Pin"}
                        onClick={() => handleTogglePin(note.id)}
                      />
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
                </div>
              </div>
            );
          })}
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
