"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Link2,
  ArrowLeft,
  Save,
  Loader2,
  Check,
  Trash2,
  PanelRightOpen,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { DocxEditorWrapper } from "@/components/editor/docx-editor-wrapper";
import { RightSidebar, type SidebarTab } from "@/components/editor/right-sidebar";
import { extractHeadingsFromDoc, type HeadingItem } from "@/lib/editor-utils";
import type { Document } from "@eigenpal/docx-editor-core";
import { updateNoteAction, deleteNoteAction, getBacklinksAction, scanAndUpdateLinksAction } from "@/server/notes";
import { type SaveStatus } from "@/components/layout/editor-header-store";
import { useFocusMode } from "@/contexts/focus-mode-context";
import { Button, Dialog, DialogHeader } from "@astryxdesign/core";


interface NoteData {
  id: string;
  title: string;
  content: string | null;
  createdAt: string;
  updatedAt: string;
}

export function NoteEditorClient({ note }: { note: NoteData }) {
  const router = useRouter();
  const { focusMode } = useFocusMode();

  const [title, setTitle] = useState(note.title);
  const [extractedText, setExtractedText] = useState(note.content ?? "");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [backlinks, setBacklinks] = useState<Array<{ id: string; title: string }>>([]);

  // Right sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSidebarTab, setActiveSidebarTab] = useState<SidebarTab>("outline");
  const [headings, setHeadings] = useState<HeadingItem[]>([]);

  // Debounce ref for heading extraction
  const extractTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep refs in sync to avoid stale closures in saveNote
  const titleRef = useRef(title);
  const extractedTextRef = useRef(extractedText);

  useEffect(() => {
    titleRef.current = title;
    extractedTextRef.current = extractedText;
  }, [title, extractedText]);

  const hasUnsavedRef = useRef(false);

  // Title-only save — content is saved by DocxEditorWrapper via API route
  const saveNote = useCallback(async () => {
    setSaveStatus("saving");
    try {
      await updateNoteAction(note.id, titleRef.current, extractedTextRef.current);
      setSaveStatus("saved");
      hasUnsavedRef.current = false;
    } catch {
      setSaveStatus("unsaved");
      hasUnsavedRef.current = true;
    }
  }, [note.id]);

  const saveNoteRef = useRef(saveNote);

  useEffect(() => {
    saveNoteRef.current = saveNote;
  }, [saveNote]);

  // Debounced auto-save for title: restarts on every title change, fires after 2s
  useEffect(() => {
    if (saveStatus !== "unsaved") return;

    const timer = setTimeout(() => {
      saveNote();
    }, 2000);

    return () => clearTimeout(timer);
  }, [title, saveStatus, saveNote]);

  // Save on unmount if unsaved
  useEffect(() => {
    return () => {
      if (hasUnsavedRef.current) {
        saveNoteRef.current();
      }
    };
  }, []);

  // Warn on unsaved beforeunload
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!hasUnsavedRef.current) return;
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  // Load backlinks on mount
  useEffect(() => {
    getBacklinksAction(note.id).then(setBacklinks).catch(() => {});
  }, [note.id]);

  // Content change callback from DocxEditorWrapper — fires after API save
  const handleContentChange = useCallback(
    (text: string) => {
      setExtractedText(text);
      // Fire-and-forget link scanning on extracted text
      scanAndUpdateLinksAction(note.id, text).catch(() => {});
    },
    [note.id],
  );

  // DocxEditorWrapper save callback — content was saved via API
  const handleDocxEditorSave = useCallback(() => {
    // no-op: content save is handled by DocxEditorWrapper
  }, []);

  const handleDelete = useCallback(async () => {
    setIsDeleting(true);
    try {
      await deleteNoteAction(note.id);
      router.push("/notes");
    } catch {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  }, [note.id, router]);

  const handleSaveNow = useCallback(() => {
    if (saveStatus === "unsaved") {
      saveNote();
    }
  }, [saveStatus, saveNote]);

  // documentName callback — triggered by DocxEditor title bar edit
  const handleDocumentNameChange = useCallback(
    (name: string) => {
      setTitle(name);
      setSaveStatus("unsaved");
      hasUnsavedRef.current = true;
    },
    [],
  );

  // Document change callback — extract headings for outline sidebar
  const handleDocumentChange = useCallback(
    (document: Document) => {
      if (extractTimerRef.current) {
        clearTimeout(extractTimerRef.current);
      }
      extractTimerRef.current = setTimeout(() => {
        setHeadings(extractHeadingsFromDoc(document));
      }, 500);
    },
    [],
  );

  // Toggle sidebar
  const handleToggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  const handleSidebarTabChange = useCallback((tab: SidebarTab) => {
    setActiveSidebarTab(tab);
  }, []);

  return (
    <div
      className={cn(
        "flex flex-col",
        focusMode ? "min-h-screen" : "h-full",
      )}
    >
      {/* Editor + Sidebar row */}
      <div className="flex flex-1 overflow-hidden">
        {/* Editor */}
        <div className="flex-1 overflow-hidden min-w-0">
          <DocxEditorWrapper
            noteId={note.id}
            documentName={title}
            onDocumentNameChange={handleDocumentNameChange}
            onContentChange={handleContentChange}
            onDocumentChange={handleDocumentChange}
            onSave={handleDocxEditorSave}
            renderLogo={() => (
              <Button
                variant="ghost"
                isIconOnly
                icon={<ArrowLeft size={16} />}
                label="Back"
                tooltip="Back to notes"
                onClick={() => router.push("/notes")}
              />
            )}
            renderTitleBarRight={() => (
              <div className="flex items-center gap-0.5">
                <Button
                  variant="ghost"
                  isIconOnly
                  size="sm"
                  icon={<PanelRightOpen size={14} />}
                  label="Toggle sidebar"
                  tooltip={sidebarOpen ? "Close sidebar" : "Open sidebar"}
                  onClick={handleToggleSidebar}
                />
                <Button
                  variant="ghost"
                  isIconOnly
                  size="sm"
                  icon={
                    saveStatus === "saving" ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : saveStatus === "saved" ? (
                      <Check size={14} className="text-green-500" />
                    ) : (
                      <Save size={14} />
                    )
                  }
                  label="Save"
                  tooltip={saveStatus === "saving" ? "Saving…" : saveStatus === "saved" ? "Saved" : "Save"}
                  onClick={handleSaveNow}
                  isDisabled={saveStatus !== "unsaved"}
                />
                <Button
                  variant="ghost"
                  isIconOnly
                  size="sm"
                  icon={<Trash2 size={14} className="text-red-500" />}
                  label="Delete note"
                  tooltip="Delete note"
                  onClick={() => setDeleteDialogOpen(true)}
                />
              </div>
            )}
          />
        </div>

        {/* Right Sidebar */}
        <RightSidebar
          isOpen={sidebarOpen}
          onToggle={handleToggleSidebar}
          activeTab={activeSidebarTab}
          onTabChange={handleSidebarTabChange}
          headings={headings}
          noteId={note.id}
        />
      </div>

      {/* Backlinks */}
      {backlinks.length > 0 && (
        <div className="px-6 py-3 border-t border-border">
          <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
            <Link2 size={12} />
            Linked from ({backlinks.length})
          </p>
          <div className="space-y-1">
            {backlinks.map((bl) => (
              <a
                key={bl.id}
                href={`/notes/${bl.id}`}
                className="block text-sm text-primary hover:underline truncate"
              >
                {bl.title || "Untitled"}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <Dialog
        isOpen={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        purpose="required"
      >
        <DialogHeader title="Delete note" />
        <p>Are you sure you want to delete this note? This action cannot be undone.</p>
        <div className="flex justify-end gap-2 mt-4">
          <Button
            variant="secondary"
            label="Cancel"
            onClick={() => setDeleteDialogOpen(false)}
            isDisabled={isDeleting}
          />
          <Button
            variant="destructive"
            label={isDeleting ? "Deleting\u2026" : "Delete"}
            onClick={handleDelete}
            isDisabled={isDeleting}
          />
        </div>
      </Dialog>
    </div>
  );
}
