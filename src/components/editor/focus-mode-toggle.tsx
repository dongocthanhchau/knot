"use client";

import { Maximize2, Minimize2 } from "lucide-react";
import { useFocusMode } from "@/contexts/focus-mode-context";
import { Button } from "@astryxdesign/core";

export function FocusModeToggle() {
  const { focusMode, setFocusMode } = useFocusMode();

  return (
    <Button
      variant="ghost"
      isIconOnly
      icon={focusMode ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
      label={focusMode ? "Exit focus mode" : "Focus mode"}
      tooltip={focusMode ? "Exit focus mode" : "Focus mode"}
      data-active={focusMode || undefined}
      onClick={() => setFocusMode(!focusMode)}
    />
  );
}
