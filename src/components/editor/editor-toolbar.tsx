"use client";

import { Fragment, useCallback, type ReactNode } from "react";
import { Button } from "@astryxdesign/core";
import type { Editor } from "@tiptap/react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Undo2,
  Redo2,
  Type,
  Palette,
  Heading,
  Space,
} from "lucide-react";
import { FocusModeToggle } from "./focus-mode-toggle";
import { FontFamilyDropdown } from "./dropdowns/font-family";
import { FontSizeDropdown } from "./dropdowns/font-size";
import { TextColorDropdown } from "./dropdowns/text-color";
import { HighlightColorDropdown } from "./dropdowns/highlight-color";
import { HeadingStyleDropdown } from "./dropdowns/heading-style";
import { LineHeightDropdown } from "./dropdowns/line-height";
import { MoreToolsDropdown, DropdownMenuItem } from "./dropdowns/more-tools";
import { useToolbarCollapse } from "./hooks/use-toolbar-collapse";
import type { ToolbarSection } from "./hooks/use-toolbar-collapse";

interface ToolbarProps {
  editor: Editor | null;
}

type ToolbarButtonProps = {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  isActive?: boolean;
  isDisabled?: boolean;
};

const TOOLBAR_SECTIONS: ToolbarSection[] = [
  { id: "undo-redo", priority: 100 },
  { id: "font", priority: 95 },
  { id: "format", priority: 90 },
  { id: "color", priority: 85 },
  { id: "heading", priority: 80 },
  { id: "align", priority: 75 },
  { id: "list", priority: 70 },
  { id: "line-height", priority: 65 },
];

const TEXT_COLORS = [
  "#000000", "#434343", "#666666", "#999999", "#b7b7b7", "#cccccc", "#d9d9d9", "#efefef", "#f3f3f3", "#ffffff",
  "#980000", "#ff0000", "#ff9900", "#ffff00", "#00ff00", "#00ffff", "#4a86e8", "#0000ff", "#9900ff", "#ff00ff",
  "#e6b8af", "#f4cccc", "#fce5cd", "#fff2cc", "#d9ead3", "#d0e0e3", "#c9daf8", "#cfe2f3", "#d9d2e9", "#ead1dc",
  "#dd7e6b", "#ea9999", "#f9cb9c", "#ffe599", "#b6d7a8", "#a2c4c9", "#a4c2f4", "#9fc5e8", "#b4a7d6", "#d5a6bd",
  "#cc4125", "#e06666", "#f6b26b", "#ffd966", "#93c47d", "#76a5af", "#6d9eeb", "#6fa8dc", "#8e7cc3", "#c27ba0",
  "#a61c00", "#cc0000", "#e69138", "#f1c232", "#6aa84f", "#45818e", "#3c78d8", "#3d85c6", "#674ea7", "#a64d79",
  "#85200c", "#990000", "#b45f06", "#bf9000", "#38761d", "#134f5c", "#1155cc", "#0b5394", "#351c75", "#741b47",
  "#5b0f00", "#660000", "#783f04", "#7f6000", "#274e13", "#0c343d", "#1c4587", "#073763", "#20124d", "#4c1130",
];

const LINE_HEIGHTS = ["1", "1.15", "1.5", "1.75", "2", "2.5", "3"];

const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 42, 48, 72];

function ToolbarBtn({ icon, label, onClick, isActive, isDisabled }: ToolbarButtonProps) {
  return (
    <Button
      variant={isActive ? "primary" : "ghost"}
      size="sm"
      isIconOnly
      icon={icon}
      label={label}
      tooltip={label}
      onClick={onClick}
      isDisabled={isDisabled}
    />
  );
}

export function EditorToolbar({ editor }: ToolbarProps) {
  const { containerRef, overflowIds } = useToolbarCollapse(TOOLBAR_SECTIONS);

  const renderOverflowItem = useCallback(
    (id: string): ReactNode => {
      const e = editor!;
      switch (id) {
        case "undo-redo":
          return (
            <Fragment key="undo-redo-overflow">
              <DropdownMenuItem
                icon={<Undo2 size={14} />}
                label="Undo"
                onClick={() => e.chain().focus().undo().run()}
                isActive={false}
              />
              <DropdownMenuItem
                icon={<Redo2 size={14} />}
                label="Redo"
                onClick={() => e.chain().focus().redo().run()}
                isActive={false}
              />
            </Fragment>
          );

        case "font":
          return (
            <Fragment key="font-overflow">
              <DropdownMenuItem
                icon={<Type size={14} />}
                label={`Font: ${e.getAttributes("textStyle").fontFamily || "Arial"}`}
                onClick={() => {}}
              />
              {FONT_SIZES.slice(0, 8).map((s) => (
                <DropdownMenuItem
                  key={`fs-${s}`}
                  icon={<Type size={14} />}
                  label={`${s}px`}
                  onClick={() => e.chain().focus().setFontSize(`${s}px`).run()}
                />
              ))}
            </Fragment>
          );

        case "format":
          return (
            <Fragment key="format-overflow">
              <DropdownMenuItem
                icon={<Bold size={14} />}
                label="Bold"
                onClick={() => e.chain().focus().toggleBold().run()}
                isActive={e.isActive("bold")}
              />
              <DropdownMenuItem
                icon={<Italic size={14} />}
                label="Italic"
                onClick={() => e.chain().focus().toggleItalic().run()}
                isActive={e.isActive("italic")}
              />
              <DropdownMenuItem
                icon={<Underline size={14} />}
                label="Underline"
                onClick={() => e.chain().focus().toggleUnderline().run()}
                isActive={e.isActive("underline")}
              />
              <DropdownMenuItem
                icon={<Strikethrough size={14} />}
                label="Strikethrough"
                onClick={() => e.chain().focus().toggleStrike().run()}
                isActive={e.isActive("strike")}
              />
            </Fragment>
          );

        case "color":
          return (
            <Fragment key="color-overflow">
              <DropdownMenuItem
                icon={<Palette size={14} />}
                label="Text color"
                onClick={() => {}}
              />
              {TEXT_COLORS.slice(0, 10).map((c) => (
                <DropdownMenu.Item
                  key={`tc-${c}`}
                  className="flex items-center gap-2 px-2 py-1.5 text-sm rounded cursor-pointer outline-none text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => e.chain().focus().setColor(c).run()}
                >
                  <span
                    className="w-4 h-4 rounded border border-gray-300 dark:border-gray-600 inline-block"
                    style={{ backgroundColor: c }}
                  />
                  {c}
                </DropdownMenu.Item>
              ))}
            </Fragment>
          );

        case "heading":
          return (
            <Fragment key="heading-overflow">
              <DropdownMenuItem
                label="Paragraph"
                onClick={() => e.chain().focus().setParagraph().run()}
                isActive={e.isActive("paragraph")}
              />
              {([1, 2, 3, 4, 5, 6] as const).map((level) => (
                <DropdownMenuItem
                  key={`h${level}`}
                  label={`Heading ${level}`}
                  onClick={() => e.chain().focus().toggleHeading({ level }).run()}
                  isActive={e.isActive("heading", { level })}
                />
              ))}
              <DropdownMenuItem
                icon={<Heading size={14} />}
                label="Blockquote"
                onClick={() => e.chain().focus().toggleBlockquote().run()}
                isActive={e.isActive("blockquote")}
              />
            </Fragment>
          );

        case "align":
          return (
            <Fragment key="align-overflow">
              <DropdownMenuItem
                icon={<AlignLeft size={14} />}
                label="Align left"
                onClick={() => e.chain().focus().setTextAlign("left").run()}
                isActive={e.isActive({ textAlign: "left" })}
              />
              <DropdownMenuItem
                icon={<AlignCenter size={14} />}
                label="Align center"
                onClick={() => e.chain().focus().setTextAlign("center").run()}
                isActive={e.isActive({ textAlign: "center" })}
              />
              <DropdownMenuItem
                icon={<AlignRight size={14} />}
                label="Align right"
                onClick={() => e.chain().focus().setTextAlign("right").run()}
                isActive={e.isActive({ textAlign: "right" })}
              />
              <DropdownMenuItem
                icon={<AlignJustify size={14} />}
                label="Justify"
                onClick={() => e.chain().focus().setTextAlign("justify").run()}
                isActive={e.isActive({ textAlign: "justify" })}
              />
            </Fragment>
          );

        case "list":
          return (
            <Fragment key="list-overflow">
              <DropdownMenuItem
                icon={<List size={14} />}
                label="Bullet list"
                onClick={() => e.chain().focus().toggleBulletList().run()}
                isActive={e.isActive("bulletList")}
              />
              <DropdownMenuItem
                icon={<ListOrdered size={14} />}
                label="Ordered list"
                onClick={() => e.chain().focus().toggleOrderedList().run()}
                isActive={e.isActive("orderedList")}
              />
            </Fragment>
          );

        case "line-height":
          return (
            <Fragment key="line-height-overflow">
              <DropdownMenuItem
                icon={<Space size={14} />}
                label="Line height"
                onClick={() => {}}
              />
              {LINE_HEIGHTS.map((h) => (
                <DropdownMenuItem
                  key={`lh-${h}`}
                  label={h}
                  onClick={() => e.chain().focus().setLineHeight(h).run()}
                />
              ))}
            </Fragment>
          );

        default:
          return null;
      }
    },
    [editor]
  );

  if (!editor) return null;

  return (
    <div ref={containerRef} className="editor-toolbar">
      <div
        data-toolbar-id="undo-redo"
        style={overflowIds.has("undo-redo") ? { display: "none" } : undefined}
      >
        <div className="editor-toolbar-group">
          <ToolbarBtn
            icon={<Undo2 size={16} />}
            label="Undo"
            onClick={() => editor.chain().focus().undo().run()}
            isDisabled={!editor.can().chain().undo().run()}
          />
          <ToolbarBtn
            icon={<Redo2 size={16} />}
            label="Redo"
            onClick={() => editor.chain().focus().redo().run()}
            isDisabled={!editor.can().chain().redo().run()}
          />
        </div>
      </div>

      <div
        data-toolbar-id="font"
        style={overflowIds.has("font") ? { display: "none" } : undefined}
      >
        <div className="editor-toolbar-separator" />
        <div className="editor-toolbar-group">
          <FontFamilyDropdown editor={editor} />
          <FontSizeDropdown editor={editor} />
        </div>
      </div>

      <div
        data-toolbar-id="format"
        style={overflowIds.has("format") ? { display: "none" } : undefined}
      >
        <div className="editor-toolbar-separator" />
        <div className="editor-toolbar-group">
          <ToolbarBtn
            icon={<Bold size={16} />}
            label="Bold"
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive("bold")}
          />
          <ToolbarBtn
            icon={<Italic size={16} />}
            label="Italic"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive("italic")}
          />
          <ToolbarBtn
            icon={<Underline size={16} />}
            label="Underline"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            isActive={editor.isActive("underline")}
          />
          <ToolbarBtn
            icon={<Strikethrough size={16} />}
            label="Strikethrough"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive("strike")}
          />
        </div>
      </div>

      <div
        data-toolbar-id="color"
        style={overflowIds.has("color") ? { display: "none" } : undefined}
      >
        <div className="editor-toolbar-separator" />
        <div className="editor-toolbar-group">
          <TextColorDropdown editor={editor} />
          <HighlightColorDropdown editor={editor} />
        </div>
      </div>

      <div
        data-toolbar-id="heading"
        style={overflowIds.has("heading") ? { display: "none" } : undefined}
      >
        <div className="editor-toolbar-separator" />
        <div className="editor-toolbar-group">
          <HeadingStyleDropdown editor={editor} />
        </div>
      </div>

      <div
        data-toolbar-id="align"
        style={overflowIds.has("align") ? { display: "none" } : undefined}
      >
        <div className="editor-toolbar-separator" />
        <div className="editor-toolbar-group">
          <ToolbarBtn
            icon={<AlignLeft size={16} />}
            label="Align left"
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            isActive={editor.isActive({ textAlign: "left" })}
          />
          <ToolbarBtn
            icon={<AlignCenter size={16} />}
            label="Align center"
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            isActive={editor.isActive({ textAlign: "center" })}
          />
          <ToolbarBtn
            icon={<AlignRight size={16} />}
            label="Align right"
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
            isActive={editor.isActive({ textAlign: "right" })}
          />
          <ToolbarBtn
            icon={<AlignJustify size={16} />}
            label="Justify"
            onClick={() => editor.chain().focus().setTextAlign("justify").run()}
            isActive={editor.isActive({ textAlign: "justify" })}
          />
        </div>
      </div>

      <div
        data-toolbar-id="list"
        style={overflowIds.has("list") ? { display: "none" } : undefined}
      >
        <div className="editor-toolbar-separator" />
        <div className="editor-toolbar-group">
          <ToolbarBtn
            icon={<List size={16} />}
            label="Bullet list"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive("bulletList")}
          />
          <ToolbarBtn
            icon={<ListOrdered size={16} />}
            label="Ordered list"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive("orderedList")}
          />
        </div>
      </div>

      <div
        data-toolbar-id="line-height"
        style={overflowIds.has("line-height") ? { display: "none" } : undefined}
      >
        <div className="editor-toolbar-separator" />
        <div className="editor-toolbar-group">
          <LineHeightDropdown editor={editor} />
        </div>
      </div>

      <div className="editor-toolbar-separator" />
      <div className="editor-toolbar-group">
        <MoreToolsDropdown
          editor={editor}
          overflowIds={overflowIds}
          renderOverflowItem={renderOverflowItem}
        />
      </div>

    </div>
  );
}
