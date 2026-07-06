"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  TopNav,
  Button,
  DropdownMenu,
  DropdownMenuItem,
} from "@astryxdesign/core";
import {
  ArrowLeft,
  User,
  Settings,
  LogOut,
  Save,
  Loader2,
  Check,
  Trash2,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { signOutAction } from "@/server/auth";
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
                  <Check size={20} />
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
              className={
                editorState.saveStatus === "saved" ? "text-green-500" : undefined
              }
            />
            <Button
              variant="ghost"
              isIconOnly
              icon={<Trash2 size={20} />}
              label="Delete note"
              tooltip="Delete note"
              onClick={() => editorState.onDeleteDialogOpen(true)}
            />
            <div className="w-px h-4 bg-border/40 mx-0.5" />
            <FocusModeToggle />
            <ThemeToggle />
            <DropdownMenu
              button={{
                variant: "ghost",
                isIconOnly: true,
                icon: <User size={20} />,
                label: "User menu",
              }}
              placement="below"
            >
              <DropdownMenuItem
                icon={Settings}
                label="Settings"
                onClick={() => router.push("/settings")}
              />
              <DropdownMenuItem
                icon={LogOut}
                label="Sign out"
                onClick={() => editorState.signOutAction()}
              />
            </DropdownMenu>
          </div>
        }
      />
    );
  }

  return (
    <TopNav
      label="Main navigation"
      endContent={
        <>
          <ThemeToggle />
          <DropdownMenu
            button={{
              variant: "ghost",
              isIconOnly: true,
              icon: <User size={20} />,
              label: "User menu",
            }}
            placement="below"
          >
            <DropdownMenuItem
              icon={Settings}
              label="Settings"
              onClick={() => router.push("/settings")}
            />
            <DropdownMenuItem
              icon={LogOut}
              label="Sign out"
              onClick={() => signOutAction()}
            />
          </DropdownMenu>
        </>
      }
    />
  );
}
