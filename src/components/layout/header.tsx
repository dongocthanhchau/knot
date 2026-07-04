"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Menu, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FocusModeToggle } from "@/components/editor/focus-mode-toggle";
import { useNoteHeader } from "@/contexts/note-header-context";
import { signOutAction } from "@/server/auth";

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { data } = useNoteHeader();
  const showNoteBar = data && !data.focusMode;

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:px-6">
      {/* Mobile menu toggle — hide when note title bar is shown */}
      <Button
        variant="ghost"
        size="icon"
        className={showNoteBar ? "hidden" : "h-8 w-8 md:hidden"}
        onClick={onMenuClick}
      >
        <Menu className="h-4 w-4" />
        <span className="sr-only">Toggle menu</span>
      </Button>

      {/* Note title bar */}
      {showNoteBar ? (
        <div className="flex flex-1 items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
            <Link href="/notes">
              <ArrowLeft className="size-4" />
              <span className="sr-only">Back to notes</span>
            </Link>
          </Button>

          <input
            id="note-title"
            name="title"
            value={data.title}
            onChange={data.onTitleChange}
            onBlur={data.onTitleBlur}
            placeholder="Untitled"
            className="flex-1 border-none bg-transparent text-xl font-semibold tracking-tight placeholder:text-muted-foreground/40 focus:outline-none"
          />

          <FocusModeToggle />

          <Dialog
            open={data.deleteDialogOpen}
            onOpenChange={data.setDeleteDialogOpen}
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
                  onClick={() => data.setDeleteDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={data.onDelete}
                  disabled={data.isDeleting}
                >
                  {data.isDeleting ? "Deleting..." : "Delete"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      ) : (
        <div className="flex-1" />
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                  K
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings">Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOutAction()}>
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
