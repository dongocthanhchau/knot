"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { DropdownMenu, DropdownMenuItem } from "@astryxdesign/core";

export function ThemeToggle() {
  const { setTheme } = useTheme();

  return (
    <DropdownMenu
      button={{
        variant: "ghost",
        isIconOnly: true,
        label: "Toggle theme",
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
