"use client";

import type { Editor } from "@tiptap/react";
import {
  TableCellsMerge, TableCellsSplit, CircleX,
  AlignLeft, AlignCenter, AlignRight,
  Trash2, Heading,
  ArrowUpToLine, ArrowDownToLine, ArrowUpDown,
  ArrowLeftFromLine, ArrowRightFromLine, ArrowUpFromLine, ArrowDownFromLine,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const BG_COLORS = [
  "#ffffff", "#f5f5f5", "#fce4ec", "#f3e5f5",
  "#e8eaf6", "#e3f2fd", "#e0f7fa", "#e0f2f1",
  "#f1f8e9", "#fff9c4", "#fff3e0", "#fbe9e7",
];

const TEXT_COLORS = [
  "#000000", "#434343", "#666666", "#999999",
  "#b71c1c", "#e65100", "#fdd835", "#7cb342",
  "#00897b", "#1e88e5", "#6a1b9a", "#ad1457",
];

const BORDER_COLORS = [
  "#000000", "#434343", "#757575", "#bdbdbd",
  "#1e88e5", "#43a047", "#e53935", "#fb8c00",
  "#8e24aa", "#00acc1", "#e91e63", "#6d4c41",
];

function getCellAttr(editor: Editor, attr: string) {
  return (
    editor.getAttributes("tableCell")[attr] ??
    editor.getAttributes("tableHeader")[attr] ??
    null
  );
}

interface ColorSwatchProps {
  color: string;
  active: boolean;
  onClick: () => void;
}

function ColorSwatch({ color, active, onClick }: ColorSwatchProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-7 w-7 rounded-sm border cursor-pointer",
        color === "#ffffff" && "border-muted-foreground/30",
        active && "ring-2 ring-offset-1 ring-primary",
      )}
      style={{ backgroundColor: color }}
      title={color}
    />
  );
}

interface TablePopupMenuProps {
  editor: Editor | null;
}

export function TablePopupMenu({ editor }: TablePopupMenuProps) {
  if (!editor) return null;

  const va = getCellAttr(editor, "verticalAlign");
  const bg = getCellAttr(editor, "background");
  const tc = editor.getAttributes("textStyle").color ?? null;
  const bc = getCellAttr(editor, "borderColor");
  const bs = getCellAttr(editor, "borderStyle");

  return (
    <div className="w-[220px] p-1.5 max-h-[70vh] overflow-y-auto overscroll-contain">
      {/* Insert section (merged Column + Row) */}
      <div className="px-1.5 py-0.5">
        <div className="mb-1 text-xs font-medium text-muted-foreground">
          Insert
        </div>
        <div className="grid grid-cols-3 gap-1">
          {/* Row 1: insert / delete column */}
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => editor.chain().focus().addColumnBefore().run()}
          >
            <ArrowLeftFromLine className="size-4 shrink-0" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => editor.chain().focus().addColumnAfter().run()}
          >
            <ArrowRightFromLine className="size-4 shrink-0" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => editor.chain().focus().deleteColumn().run()}
          >
            <Trash2 className="size-4 shrink-0" />
          </Button>

          {/* Row 2: insert / delete row */}
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => editor.chain().focus().addRowBefore().run()}
          >
            <ArrowUpFromLine className="size-4 shrink-0" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => editor.chain().focus().addRowAfter().run()}
          >
            <ArrowDownFromLine className="size-4 shrink-0" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => editor.chain().focus().deleteRow().run()}
          >
            <CircleX className="size-4 shrink-0" />
          </Button>
        </div>
      </div>

      <Separator />

      {/* Merge / Split section */}
      <div className="px-1.5 py-0.5">
        <div className="mb-1 text-xs font-medium text-muted-foreground">
          Merge
        </div>
        <div className="flex flex-row gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 justify-center gap-1.5"
            onClick={() => editor.chain().focus().mergeCells().run()}
          >
            <TableCellsMerge className="size-3 shrink-0" />
            <span className="truncate">Merge cells</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 justify-center gap-1.5"
            onClick={() => editor.chain().focus().splitCell().run()}
          >
            <TableCellsSplit className="size-3 shrink-0" />
            <span className="truncate">Split cell</span>
          </Button>
        </div>
      </div>

      <Separator />

      {/* Horizontal align section */}
      <div className="px-1.5 py-0.5">
        <div className="mb-1 text-xs font-medium text-muted-foreground">
          Align
        </div>
        <div className="flex gap-0.5">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "flex-1",
              editor.isActive({ textAlign: "left" }) && "bg-accent",
            )}
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
          >
            <AlignLeft className="size-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "flex-1",
              editor.isActive({ textAlign: "center" }) && "bg-accent",
            )}
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
          >
            <AlignCenter className="size-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "flex-1",
              editor.isActive({ textAlign: "right" }) && "bg-accent",
            )}
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
          >
            <AlignRight className="size-3" />
          </Button>
        </div>
      </div>

      <Separator />

      {/* Vertical align section */}
      <div className="px-1.5 py-0.5">
        <div className="mb-1 text-xs font-medium text-muted-foreground">
          Vertical align
        </div>
        <div className="flex gap-0.5">
          <Button
            variant="ghost"
            size="sm"
            className={cn("flex-1", va === "top" && "bg-accent")}
            onClick={() =>
              editor
                .chain()
                .focus()
                .setCellAttribute("verticalAlign", "top")
                .run()
            }
          >
            <ArrowUpToLine className="size-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn("flex-1", va === "middle" && "bg-accent")}
            onClick={() =>
              editor
                .chain()
                .focus()
                .setCellAttribute("verticalAlign", "middle")
                .run()
            }
          >
            <ArrowUpDown className="size-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn("flex-1", va === "bottom" && "bg-accent")}
            onClick={() =>
              editor
                .chain()
                .focus()
                .setCellAttribute("verticalAlign", "bottom")
                .run()
            }
          >
            <ArrowDownToLine className="size-3" />
          </Button>
        </div>
      </div>

      <Separator />

      {/* Colors section — combined Fill, Text, Border */}
      <div className="px-1.5 py-0.5 space-y-2">
        <div className="mb-0.5 text-xs font-medium text-muted-foreground">
          Colors
        </div>

        {/* Background / Fill */}
        <div>
          <div className="mb-0.5 text-xs font-medium text-muted-foreground">
            Fill
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {BG_COLORS.map((color) => (
              <ColorSwatch
                key={color}
                color={color}
                active={bg === color}
                onClick={() =>
                  editor
                    .chain()
                    .focus()
                    .setCellAttribute("background", color)
                    .run()
                }
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() =>
              editor
                .chain()
                .focus()
                .setCellAttribute("background", null)
                .run()
            }
            className="mt-0.5 text-xs text-muted-foreground hover:text-foreground"
          >
            None
          </button>
        </div>

        {/* Text color */}
        <div>
          <div className="mb-0.5 text-xs font-medium text-muted-foreground">
            Text
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {TEXT_COLORS.map((color) => (
              <ColorSwatch
                key={color}
                color={color}
                active={tc === color}
                onClick={() =>
                  editor.chain().focus().setColor(color).run()
                }
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => editor.chain().focus().unsetColor().run()}
            className="mt-0.5 text-xs text-muted-foreground hover:text-foreground"
          >
            None
          </button>
        </div>

        {/* Border color */}
        <div>
          <div className="mb-0.5 text-xs font-medium text-muted-foreground">
            Border
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {BORDER_COLORS.map((color) => (
              <ColorSwatch
                key={color}
                color={color}
                active={bc === color}
                onClick={() =>
                  editor
                    .chain()
                    .focus()
                    .setCellAttribute("borderColor", color)
                    .run()
                }
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() =>
              editor
                .chain()
                .focus()
                .setCellAttribute("borderColor", null)
                .run()
            }
            className="mt-0.5 text-xs text-muted-foreground hover:text-foreground"
          >
            None
          </button>
        </div>
      </div>

      <Separator />

      {/* Border style section */}
      <div className="px-1.5 py-0.5">
        <div className="mb-1 text-xs font-medium text-muted-foreground">
          Border style
        </div>
        <div className="flex gap-0.5">
          {(["solid", "dashed", "dotted", "double"] as const).map((style) => (
            <Button
              key={style}
              variant="ghost"
              size="sm"
              className={cn("flex-1", bs === style && "bg-accent")}
              onClick={() =>
                editor
                  .chain()
                  .focus()
                  .setCellAttribute("borderStyle", style)
                  .run()
              }
            >
              <span
                className="block w-4 h-3 rounded-[1px]"
                style={{ border: `1.5px ${style} currentColor` }}
              />
            </Button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Toggle header */}
      <div className="px-1.5 py-0.5">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-1.5"
          onClick={() => editor.chain().focus().toggleHeaderCell().run()}
        >
          <Heading className="size-3 shrink-0" />
          <span className="truncate">Toggle header</span>
        </Button>
      </div>

      <Separator />

      {/* Delete table */}
      <div className="px-1.5 py-0.5">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => {
            editor.chain().focus().deleteTable().run();
          }}
        >
          <Trash2 className="size-3 shrink-0" />
          <span className="truncate">Delete table</span>
        </Button>
      </div>
    </div>
  );
}
