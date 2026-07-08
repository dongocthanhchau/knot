"use client";

import { useEffect, useState } from "react";
import { Tags, Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { Button } from "@astryxdesign/core";
import {
  listTagsAction,
  createTagAction,
  updateTagAction,
  deleteTagAction,
} from "@/server/tags";
import { useRouter } from "next/navigation";

interface TagItem {
  id: string;
  name: string;
  color: string | null;
  parentId: string | null;
  noteCount: number;
}

const PRESET_COLORS = [
  "#6b7280", "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#14b8a6", "#3b82f6", "#8b5cf6", "#ec4899", "#6366f1",
];

function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {PRESET_COLORS.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className={`w-5 h-5 rounded-full border-2 transition-all ${
            value === c ? "border-foreground scale-110" : "border-transparent"
          }`}
          style={{ backgroundColor: c }}
        />
      ))}
    </div>
  );
}

export function TagsManager() {
  const router = useRouter();
  const [tags, setTags] = useState<TagItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#6b7280");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");

  const fetchTags = async () => {
    setLoading(true);
    try {
      const result = await listTagsAction();
      setTags(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tags");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      await createTagAction(newName.trim(), newColor);
      setNewName("");
      setNewColor("#6b7280");
      setCreating(false);
      await fetchTags();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create tag");
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return;
    try {
      await updateTagAction(id, editName.trim(), editColor);
      setEditingId(null);
      await fetchTags();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update tag");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTagAction(id);
      await fetchTags();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete tag");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tags</h1>
          <p className="text-sm text-muted-foreground">
            Manage your note tags.
          </p>
        </div>
        <Button
          onClick={() => setCreating(true)}
          variant="primary"
          size="sm"
          label="New Tag"
          icon={<Plus size={16} />}
        />
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 p-4 text-sm text-destructive">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline">Dismiss</button>
        </div>
      )}

      {/* Create form */}
      {creating && (
        <div className="rounded-lg border bg-card p-4 space-y-3">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Tag name..."
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            autoFocus
          />
          <ColorPicker value={newColor} onChange={setNewColor} />
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" size="sm" label="Cancel" onClick={() => { setCreating(false); setNewName(""); }} />
            <Button variant="primary" size="sm" label="Create" onClick={handleCreate} isDisabled={!newName.trim()} />
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-lg border p-4 h-14 animate-pulse bg-muted/30" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && tags.length === 0 && !creating && (
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-8 flex flex-col items-center justify-center gap-3 text-center">
          <Tags className="h-8 w-8 text-muted-foreground" />
          <div>
            <h2 className="text-lg font-semibold">No tags yet</h2>
            <p className="text-sm text-muted-foreground">
              Create your first tag to start organizing notes.
            </p>
          </div>
        </div>
      )}

      {/* Tag list */}
      {!loading && tags.length > 0 && (
        <div className="space-y-2">
          {tags.map((tag) => (
            <div
              key={tag.id}
              className="rounded-lg border bg-card p-4 flex items-center justify-between gap-4"
            >
              {editingId === tag.id ? (
                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex h-8 w-full rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onKeyDown={(e) => e.key === "Enter" && handleUpdate(tag.id)}
                    autoFocus
                  />
                  <ColorPicker value={editColor} onChange={setEditColor} />
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleUpdate(tag.id)}
                      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      <Check size={12} /> Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                    >
                      <X size={12} /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: tag.color ?? "#6b7280" }}
                    />
                    <span className="text-sm font-medium truncate">{tag.name}</span>
                    <span className="text-[11px] text-muted-foreground shrink-0">
                      {tag.noteCount} note{tag.noteCount !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      isIconOnly
                      icon={<Pencil size={14} />}
                      label="Edit tag"
                      tooltip="Edit"
                      onClick={() => {
                        setEditingId(tag.id);
                        setEditName(tag.name);
                        setEditColor(tag.color ?? "#6b7280");
                      }}
                    />
                    <Button
                      variant="ghost"
                      isIconOnly
                      icon={<Trash2 size={14} />}
                      label="Delete tag"
                      tooltip="Delete"
                      onClick={() => handleDelete(tag.id)}
                    />
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
