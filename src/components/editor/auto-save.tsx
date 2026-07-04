"use client";

import { Cloud, Check, Pencil, Dot } from "lucide-react";
import { cn } from "@/lib/utils";

export type SaveStatus = "idle" | "saving" | "saved" | "unsaved";

interface AutoSaveProps {
  status: SaveStatus;
  lastSavedAt: Date | null;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function AutoSave({ status, lastSavedAt }: AutoSaveProps) {
  if (status === "idle") {
    return (
      <div className="flex h-8 items-center justify-end border-t px-4">
        <Dot className="size-3.5 text-muted-foreground/40" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex h-8 items-center justify-end gap-1.5 border-t px-4 text-xs",
        status === "saving" && "text-muted-foreground",
        status === "saved" && "text-green-600 dark:text-green-500",
        status === "unsaved" && "text-amber-600 dark:text-amber-500",
      )}
    >
      {status === "saving" && (
        <>
          <Cloud className="size-3.5 animate-pulse" />
          <span>Saving...</span>
        </>
      )}

      {status === "saved" && (
        <>
          <Check className="size-3.5" />
          <span>
            Saved at{" "}
            {lastSavedAt
              ? formatTime(lastSavedAt)
              : "—"}
          </span>
        </>
      )}

      {status === "unsaved" && (
        <>
          <Pencil className="size-3.5" />
          <span>Unsaved changes</span>
        </>
      )}
    </div>
  );
}
