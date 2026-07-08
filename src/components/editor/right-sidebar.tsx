"use client";

import { cn } from "@/lib/utils";
import { FileText, Tags, AlignLeft } from "lucide-react";
import type { HeadingItem } from "@/lib/editor-utils";

export type SidebarTab = "outline" | "tags" | "description";

export interface RightSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
  headings: HeadingItem[];
  noteId: string;
}

export function RightSidebar({
  isOpen,
  onToggle,
  activeTab,
  onTabChange,
  headings,
  noteId,
}: RightSidebarProps) {
  const tabs: { key: SidebarTab; label: string; icon: React.ReactNode }[] = [
    { key: "outline", label: "Outline", icon: <FileText size={14} /> },
    { key: "tags", label: "Tags", icon: <Tags size={14} /> },
    { key: "description", label: "Description", icon: <AlignLeft size={14} /> },
  ];

  return (
    <div
      className={cn(
        "relative border-l border-border bg-background flex flex-col transition-all duration-200",
        isOpen ? "w-64" : "w-0 overflow-hidden border-l-0",
      )}
    >
      {isOpen && (
        <>
          {/* Tab bar */}
          <div className="flex items-center border-b border-border shrink-0 px-3 pt-[11px] pb-1.5 gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => onTabChange(tab.key)}
                className={cn(
                  "flex items-center justify-center p-2 rounded-md transition-colors",
                  activeTab === tab.key
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
                )}
              >
                {tab.icon}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto p-3">
            {activeTab === "outline" && <OutlinePanel headings={headings} />}
            {activeTab === "tags" && <TagsPanel noteId={noteId} />}
            {activeTab === "description" && <DescriptionPanel />}
          </div>
        </>
      )}
    </div>
  );
}

/* ── Outline tab ── */

function OutlinePanel({ headings }: { headings: HeadingItem[] }) {
  if (headings.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        No headings found. Apply heading styles (Heading 1, 2, …) in the document to build an outline.
      </p>
    );
  }

  return (
    <nav className="space-y-0.5">
      {headings.map((h) => (
        <div
          key={h.id}
          className={cn(
            "text-sm py-0.5 px-1 rounded hover:bg-accent/50 cursor-pointer truncate transition-colors",
            "text-muted-foreground hover:text-foreground",
          )}
          style={{ paddingLeft: `${(h.level - 1) * 12 + 4}px` }}
          title={h.text}
        >
          {h.text || "(untitled)"}
        </div>
      ))}
    </nav>
  );
}

/* ── Tags tab ── */

function TagsPanel({ noteId }: { noteId: string }) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Manage tags for this note.
      </p>
      {/* TODO: fetch & render existing tags, add/remove UI */}
      <div className="flex flex-wrap gap-1">
        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-secondary text-xs text-secondary-foreground">
          placeholder-tag
        </span>
      </div>
      {/* TODO: tag input */}
    </div>
  );
}

/* ── Description tab ── */

function DescriptionPanel() {
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Add a description for this file.
      </p>
      <textarea
        className="w-full min-h-[100px] resize-y rounded border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        placeholder="Write a description…"
      />
      {/* TODO: persist description (needs schema migration) */}
    </div>
  );
}
