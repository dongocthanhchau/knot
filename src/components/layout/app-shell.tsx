"use client";

import { usePathname } from "next/navigation";
import {
  AppShell as AstryxAppShell,
  LayerProvider,
} from "@astryxdesign/core";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MainContent } from "@/components/layout/main-content";
import {
  FocusModeProvider,
  useFocusMode,
} from "@/contexts/focus-mode-context";
interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <LayerProvider>
      <FocusModeProvider>
        <AppShellInner>{children}</AppShellInner>
      </FocusModeProvider>
    </LayerProvider>
  );
}

function AppShellInner({ children }: AppShellProps) {
  const { focusMode } = useFocusMode();
  const pathname = usePathname();
  const isNoteEditor = pathname?.startsWith("/notes/");
  const mainClassName = isNoteEditor ? "p-0 lg:p-0" : undefined;

  if (focusMode) {
    return (
      <AstryxAppShell height="fill">
        <MainContent className={mainClassName}>{children}</MainContent>
      </AstryxAppShell>
    );
  }

  return (
    <AstryxAppShell
      height="fill"
      variant="surface"
      sideNav={<Sidebar />}
    >
      <div className="flex flex-col h-full">
        <Header />
        <MainContent className={mainClassName}>{children}</MainContent>
      </div>
    </AstryxAppShell>
  );
}
