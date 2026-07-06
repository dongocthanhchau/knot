"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2, Check, Trash2, PanelRight, PanelRightClose } from "lucide-react";

import { cn } from "@/lib/utils";
import { Editor } from "@/components/editor/editor";
import { EditorToolbar } from "@/components/editor/editor-toolbar";
import { OutlineSidebar } from "@/components/editor/outline-sidebar";
import type { Editor as EditorType } from "@tiptap/react";
import { updateNoteAction, deleteNoteAction } from "@/server/notes";
import { type SaveStatus } from "@/components/layout/editor-header-store";
import { signOutAction } from "@/server/auth";
import { FocusModeToggle } from "@/components/editor/focus-mode-toggle";
import { useFocusMode } from "@/contexts/focus-mode-context";
import { Button, Dialog, DialogHeader } from "@astryxdesign/core";
import { editorHeaderStore } from "@/components/layout/editor-header-store";


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
  const [content, setContent] = useState(note.content ?? "");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(
    note.updatedAt ? new Date(note.updatedAt) : null,
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editor, setEditor] = useState<EditorType | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showOutline, setShowOutline] = useState(true);

  // Keep refs in sync to avoid stale closures in saveNote
  const titleRef = useRef(title);
  const contentRef = useRef(content);

  useEffect(() => {
    titleRef.current = title;
    contentRef.current = content;
  }, [title, content]);

  const hasUnsavedRef = useRef(false);

  const saveNote = useCallback(async () => {
    setSaveStatus("saving");
    try {
      const result = await updateNoteAction(
        note.id,
        titleRef.current,
        contentRef.current,
      );
      setSaveStatus("saved");
      hasUnsavedRef.current = false;
      setLastSavedAt(new Date(result.updatedAt));
    } catch {
      setSaveStatus("unsaved");
      hasUnsavedRef.current = true;
    }
  }, [note.id]);

  const saveNoteRef = useRef(saveNote);

  useEffect(() => {
    saveNoteRef.current = saveNote;
  }, [saveNote]);

  // Debounced auto-save: restarts on every change, fires after 2s
  useEffect(() => {
    if (saveStatus !== "unsaved") return;

    const timer = setTimeout(() => {
      saveNote();
    }, 2000);

    return () => clearTimeout(timer);
  }, [title, content, saveStatus, saveNote]);

  useEffect(() => {
    return () => {
      if (hasUnsavedRef.current) {
        saveNoteRef.current();
      }
    };
  }, []);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!hasUnsavedRef.current) return;
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setTitle(e.target.value);
      setSaveStatus("unsaved");
      hasUnsavedRef.current = true;
    },
    [],
  );

  const handleTitleBlur = useCallback(() => {
    if (saveStatus === "unsaved") {
      saveNote();
    }
  }, [saveStatus, saveNote]);

  const handleEditorUpdate = useCallback((html: string) => {
    setContent(html);
    setSaveStatus("unsaved");
    hasUnsavedRef.current = true;
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

  // Publish editor state to the header slot via module-level store
  useEffect(() => {
    editorHeaderStore.setState({
      title,
      isDeleting,
      saveStatus,
      deleteDialogOpen,
      onTitleChange: handleTitleChange,
      onTitleBlur: handleTitleBlur,
      onSave: handleSaveNow,
      onDeleteDialogOpen: setDeleteDialogOpen,
      onDelete: handleDelete,
      signOutAction,
    });
    return () => editorHeaderStore.setState(null);
  }, [
    title,
    isDeleting,
    saveStatus,
    deleteDialogOpen,
    handleTitleChange,
    handleTitleBlur,
    handleSaveNow,
    handleDelete,
  ]);

  return (
    <div
      className={cn(
        "flex flex-col",
        focusMode ? "min-h-screen" : "h-full",
      )}
    >
      {/* Full-width toolbar — sticky */}
      <div className={cn("editor-toolbar-area", focusMode && "bg-background/95 backdrop-blur-sm")}>
        <EditorToolbar editor={editor} />
        <div className="ml-auto flex items-center gap-0.5">
          {focusMode && (
            <>
              <Button
                variant="ghost"
                isIconOnly
                icon={
                  saveStatus === "saving" ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : saveStatus === "saved" ? (
                    <Check size={18} />
                  ) : (
                    <Save size={18} />
                  )
                }
                label="Save"
                tooltip={
                  saveStatus === "saving"
                    ? "Saving\u2026"
                    : saveStatus === "saved" || saveStatus === "idle"
                      ? "Saved"
                      : "Save"
                }
                onClick={handleSaveNow}
                isDisabled={saveStatus !== "unsaved"}
              />
              <Button
                variant="ghost"
                isIconOnly
                icon={<Trash2 size={18} />}
                label="Delete note"
                tooltip="Delete note"
                onClick={() => setDeleteDialogOpen(true)}
              />
            </>
          )}
          <FocusModeToggle />
          <button
            className="editor-outline-toggle"
            onClick={() => setShowOutline((v) => !v)}
            title={showOutline ? "Hide outline" : "Show outline"}
          >
            {showOutline ? <PanelRightClose size={18} /> : <PanelRight size={18} />}
          </button>
        </div>
      </div>

      {/* Editor area — Google Docs style */}
      <div className="editor-gdocs-scroll-container">
        <div className="editor-gdocs-layout">
          <div className="editor-gdocs-wrapper" data-focus={focusMode || undefined}>
            <Editor
              content={content}
              onUpdate={handleEditorUpdate}
              onEditorReady={setEditor}
              pageLayout
            />
          </div>
          {showOutline && <OutlineSidebar editor={editor} />}
        </div>
      </div>

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
