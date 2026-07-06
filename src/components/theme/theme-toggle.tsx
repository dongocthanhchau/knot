"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { DropdownMenu, DropdownMenuItem } from "@astryxdesign/core";

interface ThemeToggleProps {
  isIconOnly?: boolean;
  style?: React.CSSProperties;
}

export function ThemeToggle({ isIconOnly = true, style: externalStyle }: ThemeToggleProps) {
  const { setTheme } = useTheme();

  return (
    <DropdownMenu
        button={{
          variant: "ghost",
          isIconOnly,
          label: "Toggle theme",
          className: "!justify-start w-full",
          style: { paddingInline: "8px", paddingBlock: "6px", ...externalStyle },
        icon: (
          <span className="relative">
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute inset-0 h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </span>
        ),
      }}
      placement="below"
    >
      <DropdownMenuItem label="Light" onClick={() => setTheme("light")} />
      <DropdownMenuItem label="Dark" onClick={() => setTheme("dark")} />
      <DropdownMenuItem label="System" onClick={() => setTheme("system")} />
    </DropdownMenu>
  );
}
