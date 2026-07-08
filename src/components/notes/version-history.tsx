"use client";

import { useState, useEffect } from "react";
import { History, RotateCcw, Clock } from "lucide-react";
import { Button, Dialog, DialogHeader } from "@astryxdesign/core";
import { listVersionsAction, createVersionAction, restoreVersionAction } from "@/server/notes";

interface Version {
  id: string;
  versionNumber: number;
  content: string | null;
  createdAt: string;
}

interface VersionHistoryProps {
  noteId: string;
  onRestore: (content: string) => void;
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").slice(0, 200);
}

export function VersionHistory({ noteId, onRestore }: VersionHistoryProps) {
  const [open, setOpen] = useState(false);
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [previewContent, setPreviewContent] = useState<string | null>(null);

  const fetchVersions = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listVersionsAction(noteId);
      setVersions(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load versions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) fetchVersions();
  }, [open, noteId]);

  const handleSaveVersion = async () => {
    try {
      await createVersionAction(noteId);
      await fetchVersions();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create version");
    }
  };

  const handleRestore = async (version: Version) => {
    if (!version.content) return;
    setRestoring(version.id);
    try {
      await restoreVersionAction(noteId, version.id);
      onRestore(version.content);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to restore version");
    } finally {
      setRestoring(null);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md border border-input bg-background hover:bg-accent/50 transition-colors"
      >
        <History size={14} />
        History
      </button>

      <Dialog isOpen={open} onOpenChange={setOpen} purpose="required">
        <DialogHeader
          title="Version History"
          subtitle={versions.length > 0 ? `${versions.length} version${versions.length !== 1 ? "s" : ""}` : undefined}
        />

        <div className="space-y-3 min-h-[200px] max-h-[400px] overflow-y-auto">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-xs text-destructive">{error}</div>
          )}

          {!loading && versions.length === 0 && !error && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <History className="h-8 w-8 text-muted-foreground/50 mb-2" />
              <p className="text-sm font-medium">No versions yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Save a snapshot to track changes
              </p>
              <Button
                variant="secondary"
                size="sm"
                label="Save Current Version"
                onClick={handleSaveVersion}
                className="mt-3"
              />
            </div>
          )}

          {loading && (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-lg border p-3 h-16 animate-pulse bg-muted/30" />
              ))}
            </div>
          )}

          {versions.length > 0 && (
            <>
              <div className="flex justify-end">
                <Button
                  variant="secondary"
                  size="sm"
                  label="Save Current Version"
                  onClick={handleSaveVersion}
                />
              </div>

              <div className="space-y-2">
                {versions.map((version) => (
                  <div
                    key={version.id}
                    className="rounded-lg border p-3 space-y-2 hover:bg-accent/30 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm">
                        <Clock size={14} className="text-muted-foreground" />
                        <span className="font-medium">v{version.versionNumber}</span>
                        <span className="text-muted-foreground">
                          {formatTime(version.createdAt)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            setPreviewContent(
                              previewContent === version.id ? null : version.id,
                            )
                          }
                          className="text-xs px-2 py-1 rounded-md hover:bg-accent/50 transition-colors"
                        >
                          {previewContent === version.id ? "Hide" : "Preview"}
                        </button>
                        <Button
                          variant="ghost"
                          size="sm"
                          label="Restore"
                          icon={<RotateCcw size={12} />}
                          isDisabled={restoring === version.id}
                          onClick={() => handleRestore(version)}
                        />
                      </div>
                    </div>

                    {previewContent === version.id && version.content && (
                      <div className="rounded-md bg-muted/30 p-2 text-xs text-muted-foreground max-h-24 overflow-y-auto">
                        {stripHtml(version.content) || "(empty)"}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </Dialog>
    </>
  );
}
