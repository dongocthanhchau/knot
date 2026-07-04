"use client";

import * as React from "react";
import { Maximize2, Minimize2 } from "lucide-react";
import { useFocusMode } from "@/contexts/focus-mode-context";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function FocusModeToggle() {
  const { focusMode, setFocusMode } = useFocusMode();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(focusMode && "bg-accent")}
          data-active={focusMode || undefined}
          onClick={() => setFocusMode(!focusMode)}
        >
          {focusMode ? (
            <Minimize2 className="h-4 w-4" />
          ) : (
            <Maximize2 className="h-4 w-4" />
          )}
          <span className="sr-only">
            {focusMode ? "Exit focus mode" : "Focus mode"}
          </span>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        {focusMode ? "Exit focus mode" : "Focus mode"}
      </TooltipContent>
    </Tooltip>
  );
}
