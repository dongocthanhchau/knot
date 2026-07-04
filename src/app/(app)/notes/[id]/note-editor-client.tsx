"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { Editor } from "@/components/editor/editor";
import { type SaveStatus } from "@/components/editor/status-bar";
import { updateNoteAction, deleteNoteAction } from "@/server/notes";
import { useFocusMode } from "@/contexts/focus-mode-context";
import { useNoteHeader } from "@/contexts/note-header-context";

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
  const [isDeleting, setIsDeleting] = useState(false);

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

  // Debounced auto-save: restarts on every change, fires after 2s of inactivity
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

  const { setData } = useNoteHeader();

  // Push title bar state up to the Header via context
  useEffect(() => {
    setData({
      noteId: note.id,
      title,
      onTitleChange: handleTitleChange,
      onTitleBlur: handleTitleBlur,
      deleteDialogOpen,
      setDeleteDialogOpen,
      onDelete: handleDelete,
      isDeleting,
      focusMode,
    });
    return () => setData(null);
  }, [
    note.id,
    title,
    handleTitleChange,
    handleTitleBlur,
    deleteDialogOpen,
    setDeleteDialogOpen,
    handleDelete,
    isDeleting,
    focusMode,
    setData,
  ]);

  return (
    <div
      className={cn(
        "mx-auto flex flex-col max-w-4xl",
        focusMode ? "min-h-screen" : "h-full",
      )}
    >
      {/* Editor area */}
      <div className={cn("flex-1 min-h-0", focusMode && "mx-auto w-full max-w-4xl")}>
        <Editor
          content={content}
          onUpdate={handleEditorUpdate}
          pageLayout
          saveStatus={saveStatus}
          lastSavedAt={lastSavedAt}
          className="border-0 rounded-none shadow-none"
        />
      </div>
    </div>
  );
}
