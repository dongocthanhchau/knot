"use client";

import { Fragment, useCallback, useState, type ReactNode } from "react";
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
  Link,
  IndentIncrease,
  IndentDecrease,
  Image,
  SeparatorHorizontal,
  Table2,
  Code,
  RemoveFormatting,
  FileUp,
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

const S = (id: string, priority: number): ToolbarSection => ({ id, priority });
const SEP = (n: number) => S(`s${n}`, 5);

const TOOLBAR_SECTIONS: ToolbarSection[] = [
  S("undo", 80), SEP(1), S("redo", 79),
  SEP(2), S("font-family", 78), S("font-size", 77),
  SEP(3), S("bold", 76), S("italic", 75), S("underline", 74), S("strikethrough", 73),
  SEP(4), S("text-color", 72), S("highlight", 71),
  SEP(5), S("heading", 70),
  SEP(6), S("align-left", 69), S("align-center", 68), S("align-right", 67), S("justify", 66),
  SEP(7), S("bullet-list", 65), S("ordered-list", 64),
  SEP(8), S("line-height", 63),
  SEP(9), S("insert-link", 62),
  SEP(10), S("outdent", 60), S("indent", 61),
  SEP(11), S("table", 59), S("hr", 58), S("image", 57),
  SEP(12), S("inline-code", 56), S("clear-fmt", 55),
  SEP(13), S("file-attach", 54),
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

  const addLink = useCallback(() => {
    const url = window.prompt("URL:");
    if (url) {
      editor!.chain().focus().setLink({ href: url }).run();
    }
  }, [editor]);

  const addTable = useCallback(() => {
    editor!.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }, [editor]);

  const addImage = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        editor!.chain().focus().setImage({ src: e.target?.result as string }).run();
      };
      reader.readAsDataURL(file);
    };
    input.click();
  }, [editor]);

  const addFile = useCallback(() => {
    const url = window.prompt("File URL:");
    if (!url) return;
    const name = window.prompt("File name:", url.split("/").pop() || "file");
    if (name) {
      editor!.chain().focus().insertContent(`<a href="${url}" target="_blank" download>${name}</a>`).run();
    }
  }, [editor]);

  const renderOverflowItem = useCallback(
    (id: string): ReactNode => {
      const e = editor!;

      if (id.startsWith("s") && /^\d+$/.test(id.replace("s", ""))) {
        return null;
      }

      switch (id) {
        case "undo":
          return (
            <DropdownMenuItem key="undo" icon={<Undo2 size={14} />} label="Undo" onClick={() => e.chain().focus().undo().run()} />
          );
        case "redo":
          return (
            <DropdownMenuItem key="redo" icon={<Redo2 size={14} />} label="Redo" onClick={() => e.chain().focus().redo().run()} />
          );
        case "bold":
          return (
            <DropdownMenuItem key="bold" icon={<Bold size={14} />} label="Bold" onClick={() => e.chain().focus().toggleBold().run()} isActive={e.isActive("bold")} />
          );
        case "italic":
          return (
            <DropdownMenuItem key="italic" icon={<Italic size={14} />} label="Italic" onClick={() => e.chain().focus().toggleItalic().run()} isActive={e.isActive("italic")} />
          );
        case "underline":
          return (
            <DropdownMenuItem key="underline" icon={<Underline size={14} />} label="Underline" onClick={() => e.chain().focus().toggleUnderline().run()} isActive={e.isActive("underline")} />
          );
        case "strikethrough":
          return (
            <DropdownMenuItem key="strikethrough" icon={<Strikethrough size={14} />} label="Strikethrough" onClick={() => e.chain().focus().toggleStrike().run()} isActive={e.isActive("strike")} />
          );
        case "align-left":
          return (
            <DropdownMenuItem key="align-left" icon={<AlignLeft size={14} />} label="Align left" onClick={() => e.chain().focus().setTextAlign("left").run()} isActive={e.isActive({ textAlign: "left" })} />
          );
        case "align-center":
          return (
            <DropdownMenuItem key="align-center" icon={<AlignCenter size={14} />} label="Align center" onClick={() => e.chain().focus().setTextAlign("center").run()} isActive={e.isActive({ textAlign: "center" })} />
          );
        case "align-right":
          return (
            <DropdownMenuItem key="align-right" icon={<AlignRight size={14} />} label="Align right" onClick={() => e.chain().focus().setTextAlign("right").run()} isActive={e.isActive({ textAlign: "right" })} />
          );
        case "justify":
          return (
            <DropdownMenuItem key="justify" icon={<AlignJustify size={14} />} label="Justify" onClick={() => e.chain().focus().setTextAlign("justify").run()} isActive={e.isActive({ textAlign: "justify" })} />
          );
        case "bullet-list":
          return (
            <DropdownMenuItem key="bullet-list" icon={<List size={14} />} label="Bullet list" onClick={() => e.chain().focus().toggleBulletList().run()} isActive={e.isActive("bulletList")} />
          );
        case "ordered-list":
          return (
            <DropdownMenuItem key="ordered-list" icon={<ListOrdered size={14} />} label="Ordered list" onClick={() => e.chain().focus().toggleOrderedList().run()} isActive={e.isActive("orderedList")} />
          );
        case "outdent":
          return (
            <DropdownMenuItem key="outdent" icon={<IndentDecrease size={14} />} label="Outdent" onClick={() => e.chain().focus().indentLess().run()} />
          );
        case "indent":
          return (
            <DropdownMenuItem key="indent" icon={<IndentIncrease size={14} />} label="Indent" onClick={() => e.chain().focus().indentMore().run()} />
          );
        case "insert-link":
          return (
            <DropdownMenuItem key="insert-link" icon={<Link size={14} />} label="Insert link" onClick={() => { const url = window.prompt("URL:"); if (url) e.chain().focus().setLink({ href: url }).run(); }} isActive={e.isActive("link")} />
          );
        case "table":
          return (
            <DropdownMenuItem key="table" icon={<Table2 size={14} />} label="Table" onClick={() => e.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} />
          );
        case "hr":
          return (
            <DropdownMenuItem key="hr" icon={<SeparatorHorizontal size={14} />} label="Horizontal rule" onClick={() => e.chain().focus().setHorizontalRule().run()} />
          );
        case "image":
          return (
            <DropdownMenuItem key="image" icon={<Image size={14} />} label="Image" onClick={() => { const input = document.createElement("input"); input.type = "file"; input.accept = "image/*"; input.onchange = () => { const file = input.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = (ev) => { e.chain().focus().setImage({ src: ev.target?.result as string }).run(); }; reader.readAsDataURL(file); }; input.click(); }} />
          );
        case "inline-code":
          return (
            <DropdownMenuItem key="inline-code" icon={<Code size={14} />} label="Inline code" onClick={() => e.chain().focus().toggleCode().run()} isActive={e.isActive("code")} />
          );
        case "clear-fmt":
          return (
            <DropdownMenuItem key="clear-fmt" icon={<RemoveFormatting size={14} />} label="Clear formatting" onClick={() => e.chain().focus().unsetAllMarks().clearNodes().run()} />
          );
        case "file-attach":
          return (
            <DropdownMenuItem key="file-attach" icon={<FileUp size={14} />} label="File attachment" onClick={() => { const url = window.prompt("File URL:"); if (!url) return; const name = window.prompt("File name:", url.split("/").pop() || "file"); if (name) { e.chain().focus().insertContent(`<a href="${url}" target="_blank" download>${name}</a>`).run(); }}} />
          );

        case "font-family":
          return (
            <Fragment key="font-family-overflow">
              <DropdownMenuItem icon={<Type size={14} />} label={`Font: ${e.getAttributes("textStyle").fontFamily || "Arial"}`} onClick={() => {}} />
            </Fragment>
          );
        case "font-size":
          return (
            <Fragment key="font-size-overflow">
              <DropdownMenuItem icon={<Type size={14} />} label={`Size: ${e.getAttributes("textStyle").fontSize || "16px"}`} onClick={() => {}} />
              {FONT_SIZES.slice(0, 8).map((s) => (
                <DropdownMenuItem key={`fs-${s}`} icon={<Type size={14} />} label={`${s}px`} onClick={() => e.chain().focus().setFontSize(`${s}px`).run()} />
              ))}
            </Fragment>
          );
        case "text-color":
          return (
            <Fragment key="text-color-overflow">
              <DropdownMenuItem icon={<Palette size={14} />} label="Text color" onClick={() => {}} />
              {TEXT_COLORS.slice(0, 10).map((c) => (
                <DropdownMenu.Item key={`tc-${c}`} className="flex items-center gap-2 px-2 py-1.5 text-sm rounded cursor-pointer outline-none text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => e.chain().focus().setColor(c).run()}>
                  <span className="w-4 h-4 rounded border border-gray-300 dark:border-gray-600 inline-block" style={{ backgroundColor: c }} />
                  {c}
                </DropdownMenu.Item>
              ))}
            </Fragment>
          );
        case "highlight":
          return (
            <Fragment key="highlight-overflow">
              <DropdownMenuItem icon={<Palette size={14} />} label="Highlight" onClick={() => {}} />
              {TEXT_COLORS.slice(0, 10).map((c) => (
                <DropdownMenu.Item key={`hl-${c}`} className="flex items-center gap-2 px-2 py-1.5 text-sm rounded cursor-pointer outline-none text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => e.chain().focus().toggleHighlight({ color: c }).run()}>
                  <span className="w-4 h-4 rounded border border-gray-300 dark:border-gray-600 inline-block" style={{ backgroundColor: c }} />
                  {c}
                </DropdownMenu.Item>
              ))}
            </Fragment>
          );
        case "heading":
          return (
            <Fragment key="heading-overflow">
              <DropdownMenuItem label="Paragraph" onClick={() => e.chain().focus().setParagraph().run()} isActive={e.isActive("paragraph")} />
              {([1, 2, 3, 4, 5, 6] as const).map((level) => (
                <DropdownMenuItem key={`h${level}`} label={`Heading ${level}`} onClick={() => e.chain().focus().toggleHeading({ level }).run()} isActive={e.isActive("heading", { level })} />
              ))}
              <DropdownMenuItem label="Blockquote" onClick={() => e.chain().focus().toggleBlockquote().run()} isActive={e.isActive("blockquote")} />
            </Fragment>
          );
        case "line-height":
          return (
            <Fragment key="line-height-overflow">
              <DropdownMenuItem icon={<Space size={14} />} label="Line height" onClick={() => {}} />
              {LINE_HEIGHTS.map((h) => (
                <DropdownMenuItem key={`lh-${h}`} label={h} onClick={() => e.chain().focus().setLineHeight(h).run()} />
              ))}
            </Fragment>
          );
        default:
          return null;
      }
    },
    [editor, overflowIds]
  );

  if (!editor) {
    return (
      <div ref={containerRef} className="editor-toolbar">
        <div data-toolbar-end />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="editor-toolbar">
      <div data-toolbar-id="undo" style={overflowIds.has("undo") ? { display: "none" } : undefined}>
        <ToolbarBtn icon={<Undo2 size={16} />} label="Undo" onClick={() => editor.chain().focus().undo().run()} isDisabled={!editor.can().chain().undo().run()} />
      </div>
      <div data-toolbar-id="s1" style={overflowIds.has("s1") ? { display: "none" } : undefined}>
        <div className="editor-toolbar-separator" />
      </div>
      <div data-toolbar-id="redo" style={overflowIds.has("redo") ? { display: "none" } : undefined}>
        <ToolbarBtn icon={<Redo2 size={16} />} label="Redo" onClick={() => editor.chain().focus().redo().run()} isDisabled={!editor.can().chain().redo().run()} />
      </div>
      <div data-toolbar-id="s2" style={overflowIds.has("s2") ? { display: "none" } : undefined}>
        <div className="editor-toolbar-separator" />
      </div>
      <div data-toolbar-id="font-family" style={overflowIds.has("font-family") ? { display: "none" } : undefined}>
        <FontFamilyDropdown editor={editor} />
      </div>
      <div data-toolbar-id="font-size" style={overflowIds.has("font-size") ? { display: "none" } : undefined}>
        <FontSizeDropdown editor={editor} />
      </div>

      <div data-toolbar-id="s3" style={overflowIds.has("s3") ? { display: "none" } : undefined}>
        <div className="editor-toolbar-separator" />
      </div>
      <div data-toolbar-id="bold" style={overflowIds.has("bold") ? { display: "none" } : undefined}>
        <ToolbarBtn icon={<Bold size={16} />} label="Bold" onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive("bold")} />
      </div>
      <div data-toolbar-id="italic" style={overflowIds.has("italic") ? { display: "none" } : undefined}>
        <ToolbarBtn icon={<Italic size={16} />} label="Italic" onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive("italic")} />
      </div>
      <div data-toolbar-id="underline" style={overflowIds.has("underline") ? { display: "none" } : undefined}>
        <ToolbarBtn icon={<Underline size={16} />} label="Underline" onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive("underline")} />
      </div>
      <div data-toolbar-id="strikethrough" style={overflowIds.has("strikethrough") ? { display: "none" } : undefined}>
        <ToolbarBtn icon={<Strikethrough size={16} />} label="Strikethrough" onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive("strike")} />
      </div>

      <div data-toolbar-id="s4" style={overflowIds.has("s4") ? { display: "none" } : undefined}>
        <div className="editor-toolbar-separator" />
      </div>
      <div data-toolbar-id="text-color" style={overflowIds.has("text-color") ? { display: "none" } : undefined}>
        <TextColorDropdown editor={editor} />
      </div>
      <div data-toolbar-id="highlight" style={overflowIds.has("highlight") ? { display: "none" } : undefined}>
        <HighlightColorDropdown editor={editor} />
      </div>

      <div data-toolbar-id="s5" style={overflowIds.has("s5") ? { display: "none" } : undefined}>
        <div className="editor-toolbar-separator" />
      </div>
      <div data-toolbar-id="heading" style={overflowIds.has("heading") ? { display: "none" } : undefined}>
        <HeadingStyleDropdown editor={editor} />
      </div>

      <div data-toolbar-id="s6" style={overflowIds.has("s6") ? { display: "none" } : undefined}>
        <div className="editor-toolbar-separator" />
      </div>
      <div data-toolbar-id="align-left" style={overflowIds.has("align-left") ? { display: "none" } : undefined}>
        <ToolbarBtn icon={<AlignLeft size={16} />} label="Align left" onClick={() => editor.chain().focus().setTextAlign("left").run()} isActive={editor.isActive({ textAlign: "left" })} />
      </div>
      <div data-toolbar-id="align-center" style={overflowIds.has("align-center") ? { display: "none" } : undefined}>
        <ToolbarBtn icon={<AlignCenter size={16} />} label="Align center" onClick={() => editor.chain().focus().setTextAlign("center").run()} isActive={editor.isActive({ textAlign: "center" })} />
      </div>
      <div data-toolbar-id="align-right" style={overflowIds.has("align-right") ? { display: "none" } : undefined}>
        <ToolbarBtn icon={<AlignRight size={16} />} label="Align right" onClick={() => editor.chain().focus().setTextAlign("right").run()} isActive={editor.isActive({ textAlign: "right" })} />
      </div>
      <div data-toolbar-id="justify" style={overflowIds.has("justify") ? { display: "none" } : undefined}>
        <ToolbarBtn icon={<AlignJustify size={16} />} label="Justify" onClick={() => editor.chain().focus().setTextAlign("justify").run()} isActive={editor.isActive({ textAlign: "justify" })} />
      </div>

      <div data-toolbar-id="s7" style={overflowIds.has("s7") ? { display: "none" } : undefined}>
        <div className="editor-toolbar-separator" />
      </div>
      <div data-toolbar-id="bullet-list" style={overflowIds.has("bullet-list") ? { display: "none" } : undefined}>
        <ToolbarBtn icon={<List size={16} />} label="Bullet list" onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive("bulletList")} />
      </div>
      <div data-toolbar-id="ordered-list" style={overflowIds.has("ordered-list") ? { display: "none" } : undefined}>
        <ToolbarBtn icon={<ListOrdered size={16} />} label="Ordered list" onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive("orderedList")} />
      </div>

      <div data-toolbar-id="s8" style={overflowIds.has("s8") ? { display: "none" } : undefined}>
        <div className="editor-toolbar-separator" />
      </div>
      <div data-toolbar-id="line-height" style={overflowIds.has("line-height") ? { display: "none" } : undefined}>
        <LineHeightDropdown editor={editor} />
      </div>

      <div data-toolbar-id="s9" style={overflowIds.has("s9") ? { display: "none" } : undefined}>
        <div className="editor-toolbar-separator" />
      </div>
      <div data-toolbar-id="insert-link" style={overflowIds.has("insert-link") ? { display: "none" } : undefined}>
        <ToolbarBtn icon={<Link size={16} />} label="Link" onClick={addLink} isActive={editor.isActive("link")} />
      </div>

      <div data-toolbar-id="s10" style={overflowIds.has("s10") ? { display: "none" } : undefined}>
        <div className="editor-toolbar-separator" />
      </div>
      <div data-toolbar-id="outdent" style={overflowIds.has("outdent") ? { display: "none" } : undefined}>
        <ToolbarBtn icon={<IndentDecrease size={16} />} label="Outdent" onClick={() => editor.chain().focus().indentLess().run()} isDisabled={!editor.can().chain().indentLess().run()} />
      </div>
      <div data-toolbar-id="indent" style={overflowIds.has("indent") ? { display: "none" } : undefined}>
        <ToolbarBtn icon={<IndentIncrease size={16} />} label="Indent" onClick={() => editor.chain().focus().indentMore().run()} isDisabled={!editor.can().chain().indentMore().run()} />
      </div>

      <div data-toolbar-id="s11" style={overflowIds.has("s11") ? { display: "none" } : undefined}>
        <div className="editor-toolbar-separator" />
      </div>
      <div data-toolbar-id="table" style={overflowIds.has("table") ? { display: "none" } : undefined}>
        <ToolbarBtn icon={<Table2 size={16} />} label="Table" onClick={addTable} />
      </div>
      <div data-toolbar-id="hr" style={overflowIds.has("hr") ? { display: "none" } : undefined}>
        <ToolbarBtn icon={<SeparatorHorizontal size={16} />} label="Horizontal rule" onClick={() => editor!.chain().focus().setHorizontalRule().run()} />
      </div>
      <div data-toolbar-id="image" style={overflowIds.has("image") ? { display: "none" } : undefined}>
        <ToolbarBtn icon={<Image size={16} />} label="Insert image" onClick={addImage} />
      </div>

      <div data-toolbar-id="s12" style={overflowIds.has("s12") ? { display: "none" } : undefined}>
        <div className="editor-toolbar-separator" />
      </div>
      <div data-toolbar-id="inline-code" style={overflowIds.has("inline-code") ? { display: "none" } : undefined}>
        <ToolbarBtn icon={<Code size={16} />} label="Inline code" onClick={() => editor!.chain().focus().toggleCode().run()} isActive={editor!.isActive("code")} />
      </div>
      <div data-toolbar-id="clear-fmt" style={overflowIds.has("clear-fmt") ? { display: "none" } : undefined}>
        <ToolbarBtn icon={<RemoveFormatting size={16} />} label="Clear formatting" onClick={() => editor!.chain().focus().unsetAllMarks().clearNodes().run()} />
      </div>

      <div data-toolbar-id="s13" style={overflowIds.has("s13") ? { display: "none" } : undefined}>
        <div className="editor-toolbar-separator" />
      </div>
      <div data-toolbar-id="file-attach" style={overflowIds.has("file-attach") ? { display: "none" } : undefined}>
        <ToolbarBtn icon={<FileUp size={16} />} label="File attachment" onClick={addFile} />
      </div>

      <div data-toolbar-end>
        <div className="editor-toolbar-separator" />
        <div className="editor-toolbar-group">
          <MoreToolsDropdown
            editor={editor}
            overflowIds={overflowIds}
            renderOverflowItem={renderOverflowItem}
          />
        </div>
      </div>

    </div>
  );
}
