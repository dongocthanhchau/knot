"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  FileText,
  Tags,
  AlignLeft,
  Search,
  ChevronDown,
  X,
  RefreshCw,
  Filter,
  Plus,
} from "lucide-react";
import type { HeadingItem } from "@/lib/editor-utils";
import type { NoteProperty } from "@/lib/property-types";
import { PropertiesPanel } from "@/components/editor/properties-panel";

/* ───────────────────────────────────────────
   SiYuan-style right sidebar
   ─────────────────────────────────────────── */

export type SidebarTab = "outline" | "tags" | "properties";

export interface RightSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
  headings: HeadingItem[];
  noteId: string;
  onScrollToHeading?: (paraId: string) => void;
  properties: NoteProperty[];
  onPropertiesChange: (properties: NoteProperty[]) => void;
}

export function RightSidebar({
  isOpen,
  onToggle,
  activeTab,
  onTabChange,
  headings,
  noteId,
  onScrollToHeading,
  properties,
  onPropertiesChange,
}: RightSidebarProps) {
  const tabs: { key: SidebarTab; label: string; icon: React.ReactNode }[] = [
    { key: "outline", label: "TOC", icon: <FileText size={16} /> },
    { key: "tags", label: "Tags", icon: <Tags size={16} /> },
    { key: "properties", label: "Properties", icon: <AlignLeft size={16} /> },
  ];

  // Dock icon click: open/close/toggle logic
  const handleDockClick = useCallback(
    (tab: SidebarTab) => {
      if (isOpen && activeTab === tab) {
        // Same tab → close
        onToggle();
      } else {
        // Different tab or closed → switch (open if needed)
        onTabChange(tab);
        if (!isOpen) onToggle();
      }
    },
    [isOpen, activeTab, onToggle, onTabChange],
  );

  return (
    <div className="flex shrink-0">
      {/* ── Panel — slides in/out from the left of the dock ── */}
      <div
        className={cn(
          "overflow-hidden transition-[width] duration-150 ease-out bg-background",
          isOpen ? "w-72" : "w-0",
        )}
      >
        <div className="w-72 h-full bg-background flex flex-col border-l border-border">
          {/* Panel header — title + close */}
          <div className="flex items-center justify-between px-3 h-[42px] shrink-0 border-b border-border">
            <span className="text-xs font-medium text-muted-foreground">
              {tabs.find((t) => t.key === activeTab)?.label}
            </span>
            <button
              onClick={onToggle}
              title="Close panel"
              className="flex items-center justify-center w-6 h-6 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          {/* Panel body */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === "outline" && (
              <TOCPanel headings={headings} onScrollToHeading={onScrollToHeading} />
            )}
            {activeTab === "tags" && <TagsPanel noteId={noteId} />}
            {activeTab === "properties" && (
              <PropertiesPanel
                noteId={noteId}
                properties={properties}
                onChange={onPropertiesChange}
              />
            )}
          </div>
        </div>
      </div>

      {/* ── Dock strip — always visible at right edge ── */}
      <div className="flex flex-col items-center gap-1 py-2 w-8 shrink-0 border-l border-border bg-background">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleDockClick(tab.key)}
            title={tab.label}
            className={cn(
              "flex items-center justify-center w-6 h-6 rounded-md transition-colors",
              isOpen && activeTab === tab.key
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-accent",
            )}
          >
            {tab.icon}
          </button>
        ))}
      </div>

    </div>
  );
}

/* ───────────────────────────────────────────
   TOC tab — numbered table of contents with tree lines
   ─────────────────────────────────────────── */

interface TOCItem {
  id: string;
  text: string;
  level: number;
  paraId?: string;
  number: string;
  children: TOCItem[];
}

/** Build a nested tree from flat headings, assigning section numbers. */
function buildTOC(headings: HeadingItem[]): TOCItem[] {
  const root: TOCItem[] = [];
  const stack: { item: TOCItem; level: number }[] = [];
  const counters: number[] = [];

  for (const h of headings) {
    // reset deeper counters
    counters.length = h.level;
    counters[h.level - 1] = (counters[h.level - 1] ?? 0) + 1;
    const number = counters.join(".");

    const node: TOCItem = {
      id: h.id,
      text: h.text,
      level: h.level,
      paraId: h.paraId,
      number,
      children: [],
    };

    // find parent in stack
    while (stack.length > 0 && stack[stack.length - 1].level >= h.level) {
      stack.pop();
    }

    if (stack.length === 0) {
      root.push(node);
    } else {
      stack[stack.length - 1].item.children.push(node);
    }

    stack.push({ item: node, level: h.level });
  }

  return root;
}

function TOCPanel({ headings, onScrollToHeading }: { headings: HeadingItem[]; onScrollToHeading?: (paraId: string) => void }) {
  const [filter, setFilter] = useState("");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const filtered = filter
    ? headings.filter((h) =>
        h.text.toLowerCase().includes(filter.toLowerCase()),
      )
    : headings;

  const tree = useMemo(() => buildTOC(filtered), [filtered]);

  const handleHeadingClick = useCallback((paraId: string | undefined) => {
    if (!paraId || !onScrollToHeading) return;
    onScrollToHeading(paraId);
  }, [onScrollToHeading]);

  const toggleCollapse = useCallback((id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 pt-1.5 pb-1 border-b border-border/40">
        <div className="flex items-center gap-1 flex-1 min-w-0">
          <Filter size={13} className="text-muted-foreground shrink-0" />
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter…"
            className="flex-1 min-w-0 bg-transparent text-xs outline-none placeholder:text-muted-foreground/50"
          />
          {filter && (
            <button
              onClick={() => setFilter("")}
              className="text-muted-foreground hover:text-foreground"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* TOC tree */}
      {tree.length === 0 ? (
        <p className="text-xs text-muted-foreground px-4 pt-4">
          {filter
            ? "No headings match filter."
            : "No headings found. Apply heading styles to build an outline."}
        </p>
      ) : (
        <nav className="overflow-y-auto flex-1 py-2">
          {tree.map((node) => (
            <TOCNode
              key={node.id}
              node={node}
              collapsed={collapsed}
              onToggle={toggleCollapse}
              onClick={handleHeadingClick}
              depth={0}
            />
          ))}
        </nav>
      )}
    </div>
  );
}

function TOCNode({
  node,
  collapsed,
  onToggle,
  onClick,
  depth,
}: {
  node: TOCItem;
  collapsed: Set<string>;
  onToggle: (id: string) => void;
  onClick: (paraId: string | undefined) => void;
  depth: number;
}) {
  const hasChildren = node.children.length > 0;
  const isCollapsed = collapsed.has(node.id);

  return (
    <>
      <div
        onClick={() => onClick(node.paraId)}
        className={cn(
          "group flex items-center gap-0.5 h-7 cursor-pointer text-xs transition-colors rounded-none",
          "text-muted-foreground hover:text-foreground hover:bg-accent/40",
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        title={node.text}
      >
        {/* Collapse toggle or spacer */}
        {hasChildren ? (
          <button
            onClick={(e) => { e.stopPropagation(); onToggle(node.id); }}
            className="flex items-center justify-center w-4 h-4 shrink-0 text-muted-foreground/50 hover:text-foreground"
          >
            <ChevronDown
              size={12}
              className={cn("transition-transform", isCollapsed && "-rotate-90")}
            />
          </button>
        ) : (
          <span className="w-4 shrink-0" />
        )}

        {/* Section number */}
        <span className="text-[10px] text-muted-foreground/35 tabular-nums shrink-0 w-[3ch] text-right mr-1">
          {node.number}
        </span>

        {/* Title */}
        <span className="truncate">
          {node.text || <span className="italic text-muted-foreground/50">(untitled)</span>}
        </span>
      </div>

      {/* Children */}
      {hasChildren && !isCollapsed && (
        <div>
          {node.children.map((child) => (
            <TOCNode
              key={child.id}
              node={child}
              collapsed={collapsed}
              onToggle={onToggle}
              onClick={onClick}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </>
  );
}

/* ───────────────────────────────────────────
   Tags tab — tag management (placeholder)
   ─────────────────────────────────────────── */

function TagsPanel({ noteId }: { noteId: string }) {
  const [tags, setTags] = useState<string[]>(["placeholder-tag"]);
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const addTag = useCallback(() => {
    const t = input.trim();
    if (!t || tags.includes(t)) return;
    setTags((prev) => [...prev, t]);
    setInput("");
  }, [input, tags]);

  const removeTag = useCallback((t: string) => {
    setTags((prev) => prev.filter((x) => x !== t));
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* SiYuan-style action icons row */}
      <div className="flex items-center gap-0.5 px-2 pt-1.5 pb-1 border-b border-border/40">
        <span className="text-xs font-medium text-muted-foreground flex-1">
          {tags.length} tag{tags.length !== 1 && "s"}
        </span>
        <button
          title="Refresh tags"
          className="block__icon flex items-center justify-center w-6 h-6 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Tag list */}
      <div className="flex flex-wrap gap-1.5 px-3 pt-3 pb-2">
        {tags.map((t) => (
          <span
            key={t}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary/60 text-xs text-secondary-foreground group"
          >
            {t}
            <button
              onClick={() => removeTag(t)}
              className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive"
            >
              <X size={10} />
            </button>
          </span>
        ))}
      </div>

      {/* Tag input */}
      <div className="flex items-center gap-1 px-3 pb-3">
        <Plus size={13} className="text-muted-foreground shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTag()}
          placeholder="Add tag…"
          className="flex-1 min-w-0 bg-transparent text-xs outline-none placeholder:text-muted-foreground/50"
        />
      </div>

      {/* TODO: fetch & persist real tags */}
      <p className="text-[11px] text-muted-foreground/50 px-3 pb-3">
        Tags are not yet persisted — this is a preview.
      </p>
    </div>
  );
}


