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
  Code2,
  RemoveFormatting,
  FileUp,
  Merge,
  Split,
  Sigma,
  FileDown,
  ArrowUpFromLine,
  ArrowDownToLine,
  ArrowLeftFromLine,
  ArrowRightToLine,
  Trash2,
  Hash,
  Search,
  NotebookText,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
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
import { useEditorSelection } from "./hooks/use-editor-selection";

interface ToolbarProps {
  editor: Editor | null;
  onFindReplace?: () => void;
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
  SEP(11), S("merge-cells", 64), S("split-cell", 63),
  S("table-row-before", 60), S("table-row-after", 59), S("table-row-delete", 58),
  S("table-col-before", 57), S("table-col-after", 56), S("table-col-delete", 55),
  S("valign-top", 54), S("valign-middle", 53), S("valign-bottom", 52),
  S("table-caption", 51),
  SEP(12), S("table", 50), S("hr", 49), S("image", 48),
  SEP(13), S("math", 49), S("toc", 48),
  SEP(14), S("code-block", 48), S("inline-code", 48), S("clear-fmt", 47),
  SEP(15), S("page-break", 46),
  SEP(16), S("find-replace", 44), S("file-attach", 45),
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

export function EditorToolbar({ editor, onFindReplace }: ToolbarProps) {
  const { containerRef, overflowIds } = useToolbarCollapse(TOOLBAR_SECTIONS);
  useEditorSelection(editor);

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
        const src = e.target?.result as string;
        const caption = window.prompt("Image caption (optional):", "");
        const width = window.prompt("Image width (optional, e.g. 400px or 50%):", "");
        editor!.chain().focus().setImageFigure({ src, caption: caption || "", width: width || "" }).run();
      };
      reader.readAsDataURL(file);
    };
    input.click();
  }, [editor]);

  const mergeCells = useCallback(() => {
    editor!.chain().focus().mergeCells().run();
  }, [editor]);

  const splitCell = useCallback(() => {
    editor!.chain().focus().splitCell().run();
  }, [editor]);

  const addMath = useCallback(() => {
    const latex = window.prompt("LaTeX formula:", "x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}");
    if (latex) {
      editor!.chain().focus().setMathDisplay(latex).run();
    }
  }, [editor]);

  const addPageBreak = useCallback(() => {
    editor!.chain().focus().setPageBreak().run();
  }, [editor]);

  const addTableRowBefore = useCallback(() => {
    editor!.chain().focus().addRowBefore().run();
  }, [editor]);

  const addTableRowAfter = useCallback(() => {
    editor!.chain().focus().addRowAfter().run();
  }, [editor]);

  const deleteTableRow = useCallback(() => {
    editor!.chain().focus().deleteRow().run();
  }, [editor]);

  const addTableColBefore = useCallback(() => {
    editor!.chain().focus().addColumnBefore().run();
  }, [editor]);

  const addTableColAfter = useCallback(() => {
    editor!.chain().focus().addColumnAfter().run();
  }, [editor]);

  const deleteTableCol = useCallback(() => {
    editor!.chain().focus().deleteColumn().run();
  }, [editor]);

  const addTableCaption = useCallback(() => {
    const caption = window.prompt("Table caption:", "");
    if (caption) {
      editor!.chain().focus().insertContent(`<p class="table-caption"></p>`).insertContent(caption).run();
    }
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
        case "merge-cells":
          return (
            <DropdownMenuItem key="merge-cells" icon={<Merge size={14} />} label="Merge cells" onClick={() => e.chain().focus().mergeCells().run()} isActive={false} />
          );
        case "split-cell":
          return (
            <DropdownMenuItem key="split-cell" icon={<Split size={14} />} label="Split cell" onClick={() => e.chain().focus().splitCell().run()} isActive={false} />
          );
        case "table-row-before":
          return (
            <DropdownMenuItem key="table-row-before" icon={<ArrowUpFromLine size={14} />} label="Insert row above" onClick={() => e.chain().focus().addRowBefore().run()} />
          );
        case "table-row-after":
          return (
            <DropdownMenuItem key="table-row-after" icon={<ArrowDownToLine size={14} />} label="Insert row below" onClick={() => e.chain().focus().addRowAfter().run()} />
          );
        case "table-row-delete":
          return (
            <DropdownMenuItem key="table-row-delete" icon={<Trash2 size={14} />} label="Delete row" onClick={() => e.chain().focus().deleteRow().run()} />
          );
        case "table-col-before":
          return (
            <DropdownMenuItem key="table-col-before" icon={<ArrowLeftFromLine size={14} />} label="Insert column left" onClick={() => e.chain().focus().addColumnBefore().run()} />
          );
        case "table-col-after":
          return (
            <DropdownMenuItem key="table-col-after" icon={<ArrowRightToLine size={14} />} label="Insert column right" onClick={() => e.chain().focus().addColumnAfter().run()} />
          );
        case "table-col-delete":
          return (
            <DropdownMenuItem key="table-col-delete" icon={<Trash2 size={14} />} label="Delete column" onClick={() => e.chain().focus().deleteColumn().run()} />
          );
        case "valign-top":
          return (
            <DropdownMenuItem key="valign-top" icon={<AlignVerticalJustifyStart size={14} />} label="Top" onClick={() => e.chain().focus().setCellVerticalAlign("top").run()} isActive={false} />
          );
        case "valign-middle":
          return (
            <DropdownMenuItem key="valign-middle" icon={<AlignVerticalJustifyCenter size={14} />} label="Middle" onClick={() => e.chain().focus().setCellVerticalAlign("middle").run()} isActive={false} />
          );
        case "valign-bottom":
          return (
            <DropdownMenuItem key="valign-bottom" icon={<AlignVerticalJustifyEnd size={14} />} label="Bottom" onClick={() => e.chain().focus().setCellVerticalAlign("bottom").run()} isActive={false} />
          );
        case "table-caption":
          return (
            <DropdownMenuItem key="table-caption" icon={<Hash size={14} />} label="Table caption" onClick={() => { const cap = window.prompt("Table caption:"); if (cap) e.chain().focus().insertContent(`<p class="table-caption"></p>`).insertContent(cap).run(); }} />
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
            <DropdownMenuItem key="image" icon={<Image size={14} />} label="Image" onClick={() => { const input = document.createElement("input"); input.type = "file"; input.accept = "image/*"; input.onchange = () => { const file = input.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = (ev) => { e.chain().focus().setImageFigure({ src: ev.target?.result as string }).run(); }; reader.readAsDataURL(file); }; input.click(); }} />
          );
        case "math":
          return (
            <DropdownMenuItem key="math" icon={<Sigma size={14} />} label="Math formula" onClick={() => { const latex = window.prompt("LaTeX:", "x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}"); if (latex) e.chain().focus().setMathDisplay(latex).run(); }} />
          );
        case "toc":
          return (
            <DropdownMenuItem key="toc" icon={<NotebookText size={14} />} label="Table of Contents" onClick={() => e.chain().focus().insertTableOfContents().run()} />
          );
        case "page-break":
          return (
            <DropdownMenuItem key="page-break" icon={<FileDown size={14} />} label="Page break" onClick={() => e.chain().focus().setPageBreak().run()} />
          );
        case "code-block":
          return (
            <DropdownMenuItem key="code-block" icon={<Code2 size={14} />} label="Code block" onClick={() => e.chain().focus().toggleCodeBlock().run()} isActive={e.isActive("codeBlock")} />
          );
        case "inline-code":
          return (
            <DropdownMenuItem key="inline-code" icon={<Code size={14} />} label="Inline code" onClick={() => e.chain().focus().toggleCode().run()} isActive={e.isActive("code")} />
          );
        case "clear-fmt":
          return (
            <DropdownMenuItem key="clear-fmt" icon={<RemoveFormatting size={14} />} label="Clear formatting" onClick={() => e.chain().focus().unsetAllMarks().clearNodes().run()} />
          );
        case "find-replace":
          return (
            <DropdownMenuItem key="find-replace" icon={<Search size={14} />} label="Find & Replace" onClick={() => { onFindReplace ? onFindReplace() : window.dispatchEvent(new CustomEvent('knot:toggle-find')); }} />
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
      <div data-toolbar-id="merge-cells" style={overflowIds.has("merge-cells") ? { display: "none" } : undefined}>
        <ToolbarBtn icon={<Merge size={16} />} label="Merge cells" onClick={mergeCells} isDisabled={!editor!.can().chain().mergeCells().run()} />
      </div>
      <div data-toolbar-id="split-cell" style={overflowIds.has("split-cell") ? { display: "none" } : undefined}>
        <ToolbarBtn icon={<Split size={16} />} label="Split cell" onClick={splitCell} isDisabled={!editor!.can().chain().splitCell().run()} />
      </div>
      <div data-toolbar-id="table-row-before" style={overflowIds.has("table-row-before") ? { display: "none" } : undefined}>
        <ToolbarBtn icon={<ArrowUpFromLine size={16} />} label="Insert row above" onClick={addTableRowBefore} isDisabled={!editor!.can().chain().addRowBefore().run()} />
      </div>
      <div data-toolbar-id="table-row-after" style={overflowIds.has("table-row-after") ? { display: "none" } : undefined}>
        <ToolbarBtn icon={<ArrowDownToLine size={16} />} label="Insert row below" onClick={addTableRowAfter} isDisabled={!editor!.can().chain().addRowAfter().run()} />
      </div>
      <div data-toolbar-id="table-row-delete" style={overflowIds.has("table-row-delete") ? { display: "none" } : undefined}>
        <ToolbarBtn icon={<Trash2 size={16} />} label="Delete row" onClick={deleteTableRow} isDisabled={!editor!.can().chain().deleteRow().run()} />
      </div>
      <div data-toolbar-id="table-col-before" style={overflowIds.has("table-col-before") ? { display: "none" } : undefined}>
        <ToolbarBtn icon={<ArrowLeftFromLine size={16} />} label="Insert column left" onClick={addTableColBefore} isDisabled={!editor!.can().chain().addColumnBefore().run()} />
      </div>
      <div data-toolbar-id="table-col-after" style={overflowIds.has("table-col-after") ? { display: "none" } : undefined}>
        <ToolbarBtn icon={<ArrowRightToLine size={16} />} label="Insert column right" onClick={addTableColAfter} isDisabled={!editor!.can().chain().addColumnAfter().run()} />
      </div>
      <div data-toolbar-id="table-col-delete" style={overflowIds.has("table-col-delete") ? { display: "none" } : undefined}>
        <ToolbarBtn icon={<Trash2 size={16} />} label="Delete column" onClick={deleteTableCol} isDisabled={!editor!.can().chain().deleteColumn().run()} />
      </div>
      <div className="editor-toolbar-separator" />
      <div data-toolbar-id="valign-top" style={overflowIds.has("valign-top") ? { display: "none" } : undefined}>
        <ToolbarBtn icon={<AlignVerticalJustifyStart size={16} />} label="Top" onClick={() => editor!.chain().focus().setCellVerticalAlign("top").run()} />
      </div>
      <div data-toolbar-id="valign-middle" style={overflowIds.has("valign-middle") ? { display: "none" } : undefined}>
        <ToolbarBtn icon={<AlignVerticalJustifyCenter size={16} />} label="Middle" onClick={() => editor!.chain().focus().setCellVerticalAlign("middle").run()} />
      </div>
      <div data-toolbar-id="valign-bottom" style={overflowIds.has("valign-bottom") ? { display: "none" } : undefined}>
        <ToolbarBtn icon={<AlignVerticalJustifyEnd size={16} />} label="Bottom" onClick={() => editor!.chain().focus().setCellVerticalAlign("bottom").run()} />
      </div>
      <div data-toolbar-id="table-caption" style={overflowIds.has("table-caption") ? { display: "none" } : undefined}>
        <ToolbarBtn icon={<Hash size={16} />} label="Table caption" onClick={addTableCaption} />
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
      <div data-toolbar-id="math" style={overflowIds.has("math") ? { display: "none" } : undefined}>
        <ToolbarBtn icon={<Sigma size={16} />} label="Math formula" onClick={addMath} />
      </div>
      <div data-toolbar-id="toc" style={overflowIds.has("toc") ? { display: "none" } : undefined}>
        <ToolbarBtn icon={<NotebookText size={16} />} label="Table of Contents" onClick={() => editor!.chain().focus().insertTableOfContents().run()} />
      </div>

      <div data-toolbar-id="s13" style={overflowIds.has("s13") ? { display: "none" } : undefined}>
        <div className="editor-toolbar-separator" />
      </div>
      <div data-toolbar-id="code-block" style={overflowIds.has("code-block") ? { display: "none" } : undefined}>
        <ToolbarBtn icon={<Code2 size={16} />} label="Code block" onClick={() => editor!.chain().focus().toggleCodeBlock().run()} isActive={editor!.isActive("codeBlock")} />
      </div>
      <div data-toolbar-id="inline-code" style={overflowIds.has("inline-code") ? { display: "none" } : undefined}>
        <ToolbarBtn icon={<Code size={16} />} label="Inline code" onClick={() => editor!.chain().focus().toggleCode().run()} isActive={editor!.isActive("code")} />
      </div>
      <div data-toolbar-id="clear-fmt" style={overflowIds.has("clear-fmt") ? { display: "none" } : undefined}>
        <ToolbarBtn icon={<RemoveFormatting size={16} />} label="Clear formatting" onClick={() => editor!.chain().focus().unsetAllMarks().clearNodes().run()} />
      </div>

      <div data-toolbar-id="s14" style={overflowIds.has("s14") ? { display: "none" } : undefined}>
        <div className="editor-toolbar-separator" />
      </div>
      <div data-toolbar-id="page-break" style={overflowIds.has("page-break") ? { display: "none" } : undefined}>
        <ToolbarBtn icon={<FileDown size={16} />} label="Page break" onClick={addPageBreak} />
      </div>

      <div data-toolbar-id="s15" style={overflowIds.has("s15") ? { display: "none" } : undefined}>
        <div className="editor-toolbar-separator" />
      </div>
      <div data-toolbar-id="find-replace" style={overflowIds.has("find-replace") ? { display: "none" } : undefined}>
        <ToolbarBtn icon={<Search size={16} />} label="Find & Replace" onClick={() => { onFindReplace ? onFindReplace() : window.dispatchEvent(new CustomEvent('knot:toggle-find')); }} />
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
