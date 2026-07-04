"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Editor } from "@/components/editor/editor";
import { AutoSave, type SaveStatus } from "@/components/editor/auto-save";
import { FocusModeToggle } from "@/components/editor/focus-mode-toggle";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { updateNoteAction, deleteNoteAction } from "@/server/notes";
import { useFocusMode } from "@/contexts/focus-mode-context";

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

  return (
    <div
      className={cn(
        "mx-auto flex flex-col",
        focusMode
          ? "min-h-screen"
          : "min-h-[calc(100vh-8rem)] max-w-4xl",
      )}
    >
      {/* Top bar — hidden in focus mode */}
      {!focusMode && (
        <div className="flex items-center gap-2 border-b px-2 py-2.5">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/notes">
              <ArrowLeft className="size-4" />
              <span className="sr-only">Back to notes</span>
            </Link>
          </Button>

          <input
            id="note-title"
            name="title"
            value={title}
            onChange={handleTitleChange}
            onBlur={handleTitleBlur}
            placeholder="Untitled"
            className="flex-1 border-none bg-transparent text-2xl font-semibold tracking-tight placeholder:text-muted-foreground/40 focus:outline-none"
          />

          <FocusModeToggle />

          <Dialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
          >
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon">
                <Trash2 className="size-4" />
                <span className="sr-only">Delete note</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete note</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this note? This action
                  cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDeleteDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Editor area */}
      <div className={cn("flex-1", focusMode && "mx-auto w-full max-w-4xl")}>
        <Editor
          content={content}
          onUpdate={handleEditorUpdate}
          className="border-0 rounded-none shadow-none"
        />
      </div>

      {/* Auto-save bar — hidden in focus mode */}
      {!focusMode && (
        <AutoSave status={saveStatus} lastSavedAt={lastSavedAt} />
      )}
    </div>
  );
}
