"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Check } from "lucide-react";
import { TagBadge } from "./tag-badge";
import { listTagsAction, getNoteTagsAction, addNoteTagAction, removeNoteTagAction } from "@/server/tags";

interface TagInfo {
  id: string;
  name: string;
  color: string | null;
}

interface TagPickerProps {
  noteId: string;
}

export function TagPicker({ noteId }: TagPickerProps) {
  const [allTags, setAllTags] = useState<TagInfo[]>([]);
  const [noteTags, setNoteTags] = useState<TagInfo[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  const fetchTags = async () => {
    setLoading(true);
    try {
      const [all, note] = await Promise.all([
        listTagsAction(),
        getNoteTagsAction(noteId),
      ]);
      setAllTags(all);
      setNoteTags(note);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, [noteId]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const noteTagIds = new Set(noteTags.map((t) => t.id));

  const handleToggle = async (tagId: string) => {
    if (noteTagIds.has(tagId)) {
      await removeNoteTagAction(noteId, tagId);
    } else {
      await addNoteTagAction(noteId, tagId);
    }
    await fetchTags();
  };

  const availableTags = allTags.filter((t) => !noteTagIds.has(t.id));

  return (
    <div ref={ref} className="relative">
      <div className="flex flex-wrap items-center gap-1.5">
        {noteTags.map((tag) => (
          <TagBadge
            key={tag.id}
            name={tag.name}
            color={tag.color}
            onRemove={() => handleToggle(tag.id)}
          />
        ))}
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium text-muted-foreground hover:bg-accent/50 transition-colors border border-dashed border-muted-foreground/30"
        >
          <Plus size={10} />
          Tag
        </button>
      </div>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 w-56 rounded-lg border bg-popover p-1.5 shadow-md">
          <p className="px-2 py-1 text-[11px] font-medium text-muted-foreground">
            {loading ? "Loading..." : noteTags.length > 0 ? "Assigned tags" : "No tags assigned"}
          </p>

          {noteTags.length > 0 && (
            <div className="mb-1 border-b pb-1">
              {noteTags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => handleToggle(tag.id)}
                  className="flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded-md hover:bg-accent/50 transition-colors text-left"
                >
                  <Check size={14} className="text-primary shrink-0" />
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: tag.color ?? "#6b7280" }}
                  />
                  {tag.name}
                </button>
              ))}
            </div>
          )}

          <p className="px-2 py-1 text-[11px] font-medium text-muted-foreground">
            {availableTags.length > 0 ? "Add tags" : "No more tags available"}
          </p>

          {availableTags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => handleToggle(tag.id)}
              className="flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded-md hover:bg-accent/50 transition-colors text-left"
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: tag.color ?? "#6b7280" }}
              />
              {tag.name}
            </button>
          ))}

          {!loading && allTags.length === 0 && (
            <p className="px-2 py-2 text-xs text-muted-foreground text-center">
              Create tags in the Tags page first
            </p>
          )}
        </div>
      )}
    </div>
  );
}
