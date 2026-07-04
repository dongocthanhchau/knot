"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MainContent } from "@/components/layout/main-content";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Sidebar as MobileSidebar } from "@/components/layout/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  FocusModeProvider,
  useFocusMode,
} from "@/contexts/focus-mode-context";
import { NoteHeaderProvider } from "@/contexts/note-header-context";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <TooltipProvider>
      <FocusModeProvider>
        <NoteHeaderProvider>
          <AppShellInner>{children}</AppShellInner>
        </NoteHeaderProvider>
      </FocusModeProvider>
    </TooltipProvider>
  );
}

function AppShellInner({ children }: AppShellProps) {
  const { focusMode } = useFocusMode();
  const pathname = usePathname();
  const isNoteEditor = pathname?.startsWith("/notes/");
  const mainClassName = isNoteEditor ? "p-0 lg:p-0" : undefined;
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  if (focusMode) {
    return (
      <div className="flex h-screen overflow-hidden bg-background">
        <div className="flex flex-1 flex-col overflow-hidden">
          <MainContent className={mainClassName}>{children}</MainContent>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <div className="hidden md:flex">
        <Sidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed(!collapsed)}
        />
      </div>

      {/* Mobile sidebar (sheet) */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-60 p-0">
          <MobileSidebar collapsed={false} onToggle={() => {}} />
        </SheetContent>
      </Sheet>

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header onMenuClick={() => setMobileOpen(true)} />
        <MainContent className={mainClassName}>{children}</MainContent>
      </div>
    </div>
  );
}
