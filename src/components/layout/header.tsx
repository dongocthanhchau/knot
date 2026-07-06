"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { TopNav, Button } from "@astryxdesign/core";
import { ArrowLeft, Save, Loader2, Check, Trash2, PanelRight, PanelRightClose, ZoomIn, ZoomOut } from "lucide-react";
import { useFocusMode } from "@/contexts/focus-mode-context";
import {
  editorHeaderStore,
  type EditorHeaderState,
} from "@/components/layout/editor-header-store";
import { FocusModeToggle } from "@/components/editor/focus-mode-toggle";

export function Header() {
  const { focusMode } = useFocusMode();
  const pathname = usePathname();
  const router = useRouter();
  const isNoteEditor = pathname?.startsWith("/notes/") && pathname !== "/notes";
  const [editorState, setEditorState] = useState<EditorHeaderState | null>(
    null,
  );

  useEffect(() => {
    return editorHeaderStore.subscribe(setEditorState);
  }, []);

  if (focusMode) return null;

  if (isNoteEditor && editorState) {
    return (
      <TopNav
        label="Main navigation"
        startContent={
          <Button
            variant="ghost"
            isIconOnly
            icon={<ArrowLeft size={20} />}
            label="Back to notes"
            tooltip="Back to notes"
            onClick={() => router.push("/notes")}
          />
        }
        centerContent={
          <input
            id="note-title"
            name="title"
            value={editorState.title}
            onChange={editorState.onTitleChange}
            onBlur={editorState.onTitleBlur}
            placeholder="Untitled"
            aria-label="Note title"
            className="w-full max-w-lg border-none bg-transparent text-lg font-semibold tracking-tight text-center placeholder:text-muted-foreground/30 focus:outline-none focus:ring-0"
          />
        }
        endContent={
          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              isIconOnly
              icon={
                editorState.saveStatus === "saving" ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : editorState.saveStatus === "saved" ? (
                  <Check size={20} className="text-green-500" />
                ) : (
                  <Save size={20} />
                )
              }
              label="Save"
              tooltip={
                editorState.saveStatus === "saving"
                  ? "Saving\u2026"
                  : editorState.saveStatus === "saved"
                    ? "Saved"
                    : "Save"
              }
              onClick={editorState.onSave}
              isDisabled={editorState.saveStatus !== "unsaved"}
            />
            <Button
              variant="ghost"
              isIconOnly
              icon={<Trash2 size={20} className="text-red-500" />}
              label="Delete note"
              tooltip="Delete note"
              onClick={() => editorState.onDeleteDialogOpen(true)}
            />
            <div className="w-px h-4 bg-border/40 mx-0.5" />
            <FocusModeToggle />
            <div className="w-px h-4 bg-border/40 mx-0.5" />
            <Button
              variant="ghost"
              isIconOnly
              size="sm"
              icon={<ZoomOut size={16} />}
              label="Zoom out"
              tooltip="Zoom out"
              onClick={() => {
                const idx = editorState.ZOOM_OPTIONS.indexOf(editorState.zoomLevel);
                editorState.onZoomChange(editorState.ZOOM_OPTIONS[Math.max(0, idx - 1)]);
              }}
              isDisabled={editorState.zoomLevel <= editorState.ZOOM_OPTIONS[0]}
            />
            <select
              value={editorState.zoomLevel}
              onChange={(e) => editorState.onZoomChange(Number(e.target.value))}
              className="text-xs w-14 text-center bg-transparent border-none outline-none cursor-pointer text-gray-700 dark:text-gray-300"
            >
              {editorState.ZOOM_OPTIONS.map((z: number) => (
                <option key={z} value={z}>
                  {z}%
                </option>
              ))}
            </select>
            <Button
              variant="ghost"
              isIconOnly
              size="sm"
              icon={<ZoomIn size={16} />}
              label="Zoom in"
              tooltip="Zoom in"
              onClick={() => {
                const idx = editorState.ZOOM_OPTIONS.indexOf(editorState.zoomLevel);
                editorState.onZoomChange(editorState.ZOOM_OPTIONS[Math.min(editorState.ZOOM_OPTIONS.length - 1, idx + 1)]);
              }}
              isDisabled={editorState.zoomLevel >= editorState.ZOOM_OPTIONS[editorState.ZOOM_OPTIONS.length - 1]}
            />
            <div className="w-px h-4 bg-border/40 mx-0.5" />
            <Button
              variant="ghost"
              isIconOnly
              icon={editorState.showOutline ? <PanelRightClose size={20} /> : <PanelRight size={20} />}
              label={editorState.showOutline ? "Hide sidebar" : "Show sidebar"}
              tooltip={editorState.showOutline ? "Hide sidebar" : "Show sidebar"}
              onClick={editorState.onToggleOutline}
            />
          </div>
        }
      />
    );
  }

  return null;
}
