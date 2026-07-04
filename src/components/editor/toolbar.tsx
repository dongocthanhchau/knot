"use client";

import { useState, useRef, useLayoutEffect, useEffect } from "react";
import type { Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Table as TableIcon,
  Undo,
  Redo,
  Highlighter,
  Palette,
  RemoveFormatting,
  Subscript,
  Superscript,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator as DropdownMenuSep,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";

const FONT_FAMILIES = [
  { label: "Default", value: "" },
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Helvetica", value: "Helvetica, Arial, sans-serif" },
  { label: "Times New Roman", value: "'Times New Roman', serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Courier New", value: "'Courier New', monospace" },
  { label: "Verdana", value: "Verdana, sans-serif" },
  { label: "Trebuchet MS", value: "'Trebuchet MS', sans-serif" },
  { label: "Impact", value: "Impact, sans-serif" },
];

const FONT_SIZES = [
  "8", "9", "10", "11", "12", "14", "16", "18", "20", "24", "28", "32",
  "36", "42", "48", "54", "60", "66", "72",
];

const TEXT_COLORS = [
  "#000000", "#434343", "#666666", "#999999", "#b7b7b7", "#cccccc",
  "#ff0000", "#e69138", "#f1c232", "#6aa84f", "#45818e", "#3d85c6",
  "#674ea7", "#a64d79", "#d5a6bd",
];

function ToolbarButton({
  onClick,
  isActive,
  disabled,
  title,
  icon: Icon,
}: {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  title: string;
  icon: React.ElementType;
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(isActive && "bg-accent text-accent-foreground")}
    >
      <Icon className="size-4" />
    </Button>
  );
}

function OverflowMenuContent({
  editor,
  groupIdx,
}: {
  editor: Editor;
  groupIdx: number;
}) {
  switch (groupIdx) {
    case 0:
      return (
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Font Family</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {FONT_FAMILIES.map((f) => (
              <DropdownMenuItem
                key={f.value}
                onClick={() => {
                  if (f.value) {
                    editor.chain().focus().setFontFamily(f.value).run();
                  } else {
                    editor.chain().focus().unsetFontFamily().run();
                  }
                }}
              >
                {f.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      );
    case 1:
      return (
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Font Size</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {FONT_SIZES.map((s) => (
              <DropdownMenuItem
                key={s}
                onClick={() => {
                  if (s) {
                    editor.chain().focus().setFontSize(s + "px").run();
                  } else {
                    editor.chain().focus().unsetFontSize().run();
                  }
                }}
              >
                {s}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      );
    case 2:
      return (
        <>
          <DropdownMenuItem
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold className="size-4" /> Bold
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic className="size-4" /> Italic
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => editor.chain().focus().toggleUnderline().run()}
          >
            <UnderlineIcon className="size-4" /> Underline
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => editor.chain().focus().toggleStrike().run()}
          >
            <Strikethrough className="size-4" /> Strikethrough
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => editor.chain().focus().toggleSubscript().run()}
          >
            <Subscript className="size-4" /> Subscript
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => editor.chain().focus().toggleSuperscript().run()}
          >
            <Superscript className="size-4" /> Superscript
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => editor.chain().focus().toggleCode().run()}
          >
            <Code className="size-4" /> Inline Code
          </DropdownMenuItem>
        </>
      );
    case 3:
      return (
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Palette className="size-4" /> Text Color
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <div className="grid grid-cols-5 gap-1 p-2">
              {TEXT_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => {
                    editor.chain().focus().setColor(color).run();
                  }}
                  className="h-6 w-6 rounded border border-border"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().unsetColor().run()}
            >
              Remove color
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      );
    case 4:
      return (
        <DropdownMenuItem
          onClick={() => editor.chain().focus().toggleHighlight().run()}
        >
          <Highlighter className="size-4" /> Highlight
        </DropdownMenuItem>
      );
    case 5:
      return (
        <>
          <DropdownMenuItem
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
          >
            <AlignLeft className="size-4" /> Align Left
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
          >
            <AlignCenter className="size-4" /> Align Center
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
          >
            <AlignRight className="size-4" /> Align Right
          </DropdownMenuItem>
        </>
      );
    case 6:
      return (
        <>
          <DropdownMenuItem
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <List className="size-4" /> Bullet List
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered className="size-4" /> Ordered List
          </DropdownMenuItem>
        </>
      );
    case 7:
      return (
        <DropdownMenuItem
          onClick={() =>
            editor
              .chain()
              .focus()
              .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
              .run()
          }
        >
          <TableIcon className="size-4" /> Table
        </DropdownMenuItem>
      );
    case 8:
      return (
        <DropdownMenuItem
          onClick={() =>
            editor.chain().focus().clearNodes().unsetAllMarks().run()
          }
        >
          <RemoveFormatting className="size-4" /> Clear Formatting
        </DropdownMenuItem>
      );
    default:
      return null;
  }
}

export function Toolbar({ editor }: { editor: Editor | null }) {
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const colorPickerRef = useRef<HTMLDivElement>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const [hiddenGroups, setHiddenGroups] = useState<number[]>([]);
  const groupEndsRef = useRef<number[]>([]);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const calculate = () => {
      const containerRect = container.getBoundingClientRect();
      const containerWidth = containerRect.width;

      const groups = Array.from(
        container.querySelectorAll<HTMLElement>("[data-group]")
      );
      if (groups.length === 0) return;

      if (groupEndsRef.current.length === 0) {
        const containerLeft = containerRect.left;
        groups.forEach((g) => {
          const idx = parseInt(g.dataset.group!);
          const rect = g.getBoundingClientRect();
          groupEndsRef.current[idx] = rect.right - containerLeft;
        });
      }

      const newHidden: number[] = [];
      for (let i = 0; i < groups.length; i++) {
        const rightEdge = groupEndsRef.current[i];
        if (rightEdge > containerWidth) {
          newHidden.push(i);
        }
      }

      const prevStr = JSON.stringify(hiddenGroups);
      const newStr = JSON.stringify(newHidden);
      if (newStr !== prevStr) {
        setHiddenGroups(newHidden);
      }
    };

    calculate();

    const ro = new ResizeObserver(calculate);
    ro.observe(container);
    return () => ro.disconnect();
  });

  useEffect(() => {
    if (!colorPickerOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        colorPickerRef.current &&
        !colorPickerRef.current.contains(e.target as Node)
      ) {
        setColorPickerOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [colorPickerOpen]);

  if (!editor) return null;

  const currentFontFamily =
    editor.getAttributes("textStyle").fontFamily || "";
  const currentFontSize =
    (editor.getAttributes("textStyle").fontSize || "").replace("px", "");

  const isGroupHidden = (idx: number) => hiddenGroups.includes(idx);
  const isSepHidden = (idx: number) =>
    hiddenGroups.includes(idx) || hiddenGroups.includes(idx + 1);

  return (
    <div
      ref={containerRef}
      className="flex flex-nowrap overflow-hidden items-center gap-0.5 px-2 py-1.5 bg-background"
    >
      {/* Group 0: Font Family */}
      <div data-group="0" className={cn(isGroupHidden(0) && "hidden")}>
        <select
          value={currentFontFamily}
          onChange={(e) => {
            const val = e.target.value;
            if (val) {
              editor.chain().focus().setFontFamily(val).run();
            } else {
              editor.chain().focus().unsetFontFamily().run();
            }
          }}
          className="h-7 rounded border bg-transparent px-1 text-xs"
        >
          {FONT_FAMILIES.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </div>

      <div className={cn(isSepHidden(0) && "hidden")}>
        <Separator orientation="vertical" className="mx-1 h-6" />
      </div>

      {/* Group 1: Font Size */}
      <div data-group="1" className={cn(isGroupHidden(1) && "hidden")}>
        <select
          value={currentFontSize}
          onChange={(e) => {
            const val = e.target.value;
            if (val) {
              editor.chain().focus().setFontSize(val + "px").run();
            } else {
              editor.chain().focus().unsetFontSize().run();
            }
          }}
          className="h-7 rounded border bg-transparent px-1 text-xs"
        >
          <option value="">Size</option>
          {FONT_SIZES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className={cn(isSepHidden(1) && "hidden")}>
        <Separator orientation="vertical" className="mx-1 h-6" />
      </div>

      {/* Group 2: Bold / Italic / Underline / Strikethrough / Subscript / Superscript / Code */}
      <div
        data-group="2"
        className={cn(
          "inline-flex items-center gap-0.5",
          isGroupHidden(2) && "hidden"
        )}
      >
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive("bold")}
          disabled={!editor.can().toggleBold()}
          title="Bold"
          icon={Bold}
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive("italic")}
          disabled={!editor.can().toggleItalic()}
          title="Italic"
          icon={Italic}
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive("underline")}
          disabled={!editor.can().toggleUnderline()}
          title="Underline"
          icon={UnderlineIcon}
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive("strike")}
          disabled={!editor.can().toggleStrike()}
          title="Strikethrough"
          icon={Strikethrough}
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleSubscript().run()}
          isActive={editor.isActive("subscript")}
          disabled={!editor.can().toggleSubscript()}
          title="Subscript"
          icon={Subscript}
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleSuperscript().run()}
          isActive={editor.isActive("superscript")}
          disabled={!editor.can().toggleSuperscript()}
          title="Superscript"
          icon={Superscript}
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          isActive={editor.isActive("code")}
          disabled={!editor.can().toggleCode()}
          title="Inline Code"
          icon={Code}
        />
      </div>

      <div className={cn(isSepHidden(2) && "hidden")}>
        <Separator orientation="vertical" className="mx-1 h-6" />
      </div>

      {/* Group 3: Text Color */}
      <div data-group="3" className={cn(isGroupHidden(3) && "hidden")}>
        <div className="relative" ref={colorPickerRef}>
          <ToolbarButton
            onClick={() => setColorPickerOpen((v) => !v)}
            isActive={colorPickerOpen}
            title="Text Color"
            icon={Palette}
          />
          {colorPickerOpen && (
            <div
              style={{ position: "absolute", zIndex: 50 }}
              className="left-0 top-full mt-1 rounded-lg border bg-popover p-2 shadow-lg"
            >
              <div className="grid grid-cols-5 gap-1">
                {TEXT_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => {
                      editor.chain().focus().setColor(color).run();
                      setColorPickerOpen(false);
                    }}
                    className="h-6 w-6 rounded border border-border"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().unsetColor().run();
                  setColorPickerOpen(false);
                }}
                className="mt-2 w-full rounded px-2 py-1 text-xs text-muted-foreground hover:bg-accent"
              >
                Remove color
              </button>
            </div>
          )}
        </div>
      </div>

      <div className={cn(isSepHidden(3) && "hidden")}>
        <Separator orientation="vertical" className="mx-1 h-6" />
      </div>

      {/* Group 4: Highlight */}
      <div data-group="4" className={cn(isGroupHidden(4) && "hidden")}>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          isActive={editor.isActive("highlight")}
          disabled={!editor.can().toggleHighlight()}
          title="Highlight"
          icon={Highlighter}
        />
      </div>

      <div className={cn(isSepHidden(4) && "hidden")}>
        <Separator orientation="vertical" className="mx-1 h-6" />
      </div>

      {/* Group 5: Align */}
      <div
        data-group="5"
        className={cn(
          "inline-flex items-center gap-0.5",
          isGroupHidden(5) && "hidden"
        )}
      >
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          isActive={editor.isActive({ textAlign: "left" })}
          disabled={!editor.can().setTextAlign("left")}
          title="Align Left"
          icon={AlignLeft}
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          isActive={editor.isActive({ textAlign: "center" })}
          disabled={!editor.can().setTextAlign("center")}
          title="Align Center"
          icon={AlignCenter}
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          isActive={editor.isActive({ textAlign: "right" })}
          disabled={!editor.can().setTextAlign("right")}
          title="Align Right"
          icon={AlignRight}
        />
      </div>

      <div className={cn(isSepHidden(5) && "hidden")}>
        <Separator orientation="vertical" className="mx-1 h-6" />
      </div>

      {/* Group 6: Lists */}
      <div
        data-group="6"
        className={cn(
          "inline-flex items-center gap-0.5",
          isGroupHidden(6) && "hidden"
        )}
      >
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive("bulletList")}
          disabled={!editor.can().toggleBulletList()}
          title="Bullet List"
          icon={List}
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive("orderedList")}
          disabled={!editor.can().toggleOrderedList()}
          title="Ordered List"
          icon={ListOrdered}
        />
      </div>

      <div className={cn(isSepHidden(6) && "hidden")}>
        <Separator orientation="vertical" className="mx-1 h-6" />
      </div>

      {/* Group 7: Table */}
      <div data-group="7" className={cn(isGroupHidden(7) && "hidden")}>
        <ToolbarButton
          onClick={() =>
            editor
              .chain()
              .focus()
              .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
              .run()
          }
          isActive={editor.isActive("table")}
          title="Table"
          icon={TableIcon}
        />
      </div>

      <div className={cn(isSepHidden(7) && "hidden")}>
        <Separator orientation="vertical" className="mx-1 h-6" />
      </div>

      {/* Group 8: Clear Formatting */}
      <div data-group="8" className={cn(isGroupHidden(8) && "hidden")}>
        <ToolbarButton
          onClick={() =>
            editor.chain().focus().clearNodes().unsetAllMarks().run()
          }
          title="Clear Formatting"
          icon={RemoveFormatting}
        />
      </div>

      {/* Overflow "More" button */}
      {hiddenGroups.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <ChevronDown className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {hiddenGroups.map((groupIdx, i) => (
              <div key={groupIdx}>
                {i > 0 && (
                  <DropdownMenuSep />
                )}
                <OverflowMenuContent
                  editor={editor}
                  groupIdx={groupIdx}
                />
              </div>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Right side: Undo / Redo */}
      <div className="ml-auto flex items-center gap-0.5">
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo"
          icon={Undo}
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Redo"
          icon={Redo}
        />
      </div>
    </div>
  );
}
