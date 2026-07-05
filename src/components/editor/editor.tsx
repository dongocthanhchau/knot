"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import ImageExt from "@tiptap/extension-image";
import { CustomTable } from "./table-caption-ext";
import { CellSelection } from "@tiptap/pm/tables";

import TableRow from "@tiptap/extension-table-row";
import { CustomTableCell } from "./table-cell-ext";
import { CustomTableHeader } from "./table-cell-ext";
import LinkExt from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Highlight from "@tiptap/extension-highlight";
import { TextStyle } from "@tiptap/extension-text-style";
import FontSize from "@tiptap/extension-font-size";
import FontFamily from "@tiptap/extension-font-family";
import Color from "@tiptap/extension-color";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import { common, createLowlight } from "lowlight";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Minus,
  Link as LinkIcon,
  Image as ImageIcon,
  Table as TableIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo,
  Redo,
  Highlighter,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Toolbar } from "./toolbar";
import { TablePopupMenu } from "./table-popup-menu";
import { ImagePopupMenu } from "./image-popup-menu";
import { Figure, FigCaption } from "./figure-ext";
import { StatusBar, type SaveStatus } from "./status-bar";

const lowlight = createLowlight(common);

/**
 * Migrate legacy <caption>text</caption> inside <table> to data-caption="text".
 * Prevents ProseMirror from parsing caption text content as table rows.
 */
function migrateTableCaption(html: string): string {
  return html.replace(
    /<table([^>]*)>\s*<caption>([^<]*)<\/caption>/gi,
    (_match, tableAttrs, captionText) => {
      const escaped = captionText
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      return `<table${tableAttrs} data-caption="${escaped}">`;
    },
  );
}

interface EditorProps {
  content: string;
  onUpdate?: (html: string) => void;
  readOnly?: boolean;
  className?: string;
  pageLayout?: boolean;
  saveStatus?: SaveStatus;
  lastSavedAt?: Date | null;
}

type SlashAction =
  | "h1"
  | "h2"
  | "h3"
  | "bulletList"
  | "orderedList"
  | "blockquote"
  | "codeBlock"
  | "table"
  | "horizontalRule";

interface SlashOption {
  action: SlashAction;
  label: string;
  icon: React.ElementType;
}

const SLASH_OPTIONS: SlashOption[] = [
  { action: "h1", label: "Heading 1", icon: Heading1 },
  { action: "h2", label: "Heading 2", icon: Heading2 },
  { action: "h3", label: "Heading 3", icon: Heading3 },
  { action: "bulletList", label: "Bullet List", icon: List },
  { action: "orderedList", label: "Ordered List", icon: ListOrdered },
  { action: "blockquote", label: "Quote", icon: Quote },
  { action: "codeBlock", label: "Code Block", icon: Code },
  { action: "table", label: "Table", icon: TableIcon },
  { action: "horizontalRule", label: "Divider", icon: Minus },
];

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  title: string;
  icon: React.ElementType;
}

function ToolbarButton({
  onClick,
  isActive = false,
  disabled = false,
  title,
  icon: Icon,
}: ToolbarButtonProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      data-active={isActive}
      title={title}
      className={cn(isActive && "bg-accent text-accent-foreground")}
    >
      <Icon className="size-4" />
    </Button>
  );
}

export function Editor({
  content,
  onUpdate,
  readOnly = false,
  className,
  pageLayout = false,
  saveStatus = "idle",
  lastSavedAt = null,
}: EditorProps) {
  const [slashMenuOpen, setSlashMenuOpen] = useState(false);
  const [slashMenuPos, setSlashMenuPos] = useState<{ x: number; y: number } | null>(null);
  const slashMenuRef = useRef<HTMLDivElement>(null);
  const processingSlash = useRef(false);
  const [tableMenuPos, setTableMenuPos] = useState<{ x: number; y: number } | null>(null);
  const tableMenuRef = useRef<HTMLDivElement>(null);
  const tableHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [imageMenuPos, setImageMenuPos] = useState<{ x: number; y: number } | null>(null);
  const imageMenuRef = useRef<HTMLDivElement>(null);
  const imageHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (tableHideTimerRef.current) clearTimeout(tableHideTimerRef.current);
      if (imageHideTimerRef.current) clearTimeout(imageHideTimerRef.current);
    };
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        heading: { levels: [1, 2, 3] },
        link: false,
        underline: false,
      }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph", "tableCell", "tableHeader"] }),
      ImageExt.configure({
        inline: false,
        allowBase64: true,
        resize: {
          enabled: true,
          directions: ["bottom-right"],
          minWidth: 100,
          alwaysPreserveAspectRatio: true,
        },
      }),
      CustomTable.configure({ resizable: true, allowTableNodeSelection: true }),
      TableRow,
      CustomTableCell,
      CustomTableHeader,
      Figure,
      FigCaption,
      LinkExt.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { class: "text-primary underline" },
      }),
      Placeholder.configure({ placeholder: "Start writing..." }),
      CodeBlockLowlight.configure({ lowlight }),
      Highlight,
      TextStyle,
      FontSize,
      FontFamily,
      Color,
      Subscript,
      Superscript,
    ],
    content: migrateTableCaption(content),
    editable: !readOnly,
    onUpdate: ({ editor: ed }) => {
      onUpdate?.(ed.getHTML());

      if (processingSlash.current) return;

      const { selection } = ed.state;
      const { $from } = selection;
      const text = $from.parent.textContent;
      const pos = $from.parentOffset;

      if (
        text === "/" &&
        pos === 1 &&
        $from.parent.type.name === "paragraph"
      ) {
        const coords = ed.view.coordsAtPos(ed.state.selection.anchor);
        if (coords) {
          const estimatedHeight = SLASH_OPTIONS.length * 36 + 12;
          const spaceBelow = window.innerHeight - coords.bottom;
          const top = spaceBelow >= estimatedHeight
            ? coords.bottom + 4
            : Math.max(8, coords.top - estimatedHeight);
          setSlashMenuPos({ x: coords.left, y: top });
        }
        setSlashMenuOpen(true);
      } else if (slashMenuOpen) {
        setSlashMenuOpen(false);
        setSlashMenuPos(null);
      }
    },
    onSelectionUpdate: ({ editor: ed }) => {
      const sel = ed.state.selection;
      const inTable = ed.isActive("table");
      const isCellSel = sel instanceof CellSelection;
      const show = inTable && (!sel.empty || isCellSel);

      if (show) {
        if (tableHideTimerRef.current) {
          clearTimeout(tableHideTimerRef.current);
          tableHideTimerRef.current = null;
        }
        const anchor = ed.state.selection.anchor;
        const coords = ed.view.coordsAtPos(anchor);

        if (coords) {
          const estimatedHeight = 320;
          const spaceBelow = window.innerHeight - coords.bottom;
          const top = spaceBelow >= estimatedHeight
            ? coords.bottom + 4
            : Math.max(8, coords.top - estimatedHeight);
          const x = coords.right + 248 > window.innerWidth - 8
            ? coords.left - 208
            : coords.right + 8;
          setTableMenuPos({ x, y: top });
        }
      } else if (isCellSel) {
        setTableMenuPos(null);
      } else if (inTable) {
        if (!tableHideTimerRef.current) {
          tableHideTimerRef.current = setTimeout(() => {
            setTableMenuPos(null);
            tableHideTimerRef.current = null;
          }, 150);
        }
      } else {
        setTableMenuPos(null);
      }

      // Image / figure popup (independent of table)
      const selectionImage =
        ed.state.doc.nodeAt(ed.state.selection.from)?.type.name === "image";
      const hasImage =
        ed.isActive("image") || ed.isActive("figure") || selectionImage;

      if (hasImage) {
        if (imageHideTimerRef.current) {
          clearTimeout(imageHideTimerRef.current);
          imageHideTimerRef.current = null;
        }
        const anchor = ed.state.selection.anchor;
        const coords = ed.view.coordsAtPos(anchor);
        if (coords) {
          setImageMenuPos({
            x: Math.min(coords.right + 8, window.innerWidth - 200),
            y: coords.bottom + 4,
          });
        }
      } else if (imageMenuPos) {
        if (!imageHideTimerRef.current) {
          imageHideTimerRef.current = setTimeout(() => {
            setImageMenuPos(null);
            imageHideTimerRef.current = null;
          }, 150);
        }
      }
    },
  });

  useEffect(() => {
    if (editor) {
      editor.setEditable(!readOnly);
    }
  }, [editor, readOnly]);

  useEffect(() => {
    if (!editor || !content) return;
    const currentHtml = editor.getHTML();
    if (content !== currentHtml) {
      editor.commands.setContent(content, { emitUpdate: false });
    }
  }, [editor, content]);

  useEffect(() => {
    if (!editor || !slashMenuOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSlashMenuOpen(false);
        setSlashMenuPos(null);
        e.preventDefault();
      }
    };

    editor.view.dom.addEventListener("keydown", handleKeyDown);
    return () => editor.view.dom.removeEventListener("keydown", handleKeyDown);
  }, [editor, slashMenuOpen]);

  useEffect(() => {
    if (!slashMenuOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        slashMenuRef.current &&
        !slashMenuRef.current.contains(e.target as Node)
      ) {
        setSlashMenuOpen(false);
        setSlashMenuPos(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [slashMenuOpen]);

  useEffect(() => {
    if (!tableMenuPos) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        tableMenuRef.current &&
        !tableMenuRef.current.contains(e.target as Node)
      ) {
        const inTable = (e.target as Element | null)?.closest?.(".tableWrapper");
        if (!inTable) {
          setTableMenuPos(null);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [tableMenuPos]);

  useEffect(() => {
    if (!imageMenuPos) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        imageMenuRef.current &&
        !imageMenuRef.current.contains(e.target as Node)
      ) {
        const isImage = (e.target as Element | null)?.closest?.("img");
        if (!isImage) {
          setImageMenuPos(null);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [imageMenuPos]);

  const handleSlashSelect = useCallback(
    (action: SlashAction) => {
      if (!editor) return;

      processingSlash.current = true;
      setSlashMenuOpen(false);
      setSlashMenuPos(null);

      const pos = editor.state.selection.$from.pos;

      const chain = editor.chain().focus();
      chain.deleteRange({ from: pos - 1, to: pos });

      switch (action) {
        case "h1":
          chain.toggleHeading({ level: 1 });
          break;
        case "h2":
          chain.toggleHeading({ level: 2 });
          break;
        case "h3":
          chain.toggleHeading({ level: 3 });
          break;
        case "bulletList":
          chain.toggleBulletList();
          break;
        case "orderedList":
          chain.toggleOrderedList();
          break;
        case "blockquote":
          chain.toggleBlockquote();
          break;
        case "codeBlock":
          chain.toggleCodeBlock();
          break;
        case "table":
          chain.insertTable({ rows: 3, cols: 3, withHeaderRow: true });
          break;
        case "horizontalRule":
          chain.setHorizontalRule();
          break;
      }

      chain.run();

      setTimeout(() => {
        processingSlash.current = false;
      }, 50);
    },
    [editor],
  );

  const handleLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("Enter URL", previousUrl || "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  const handleImage = useCallback(() => {
    if (!editor) return;
    const url = window.prompt("Enter image URL", "https://");
    if (url === null || url === "") return;
    editor
      .chain()
      .focus()
      .setImage({ src: url })
      .addFigure()
      .run();
  }, [editor]);

  if (!editor) return null;

  if (pageLayout) {
    // ====== PAGE LAYOUT MODE (Word-like) ======
    return (
      <div className={cn("editor-container knot-editor", className)}>
        {!readOnly && (
          <div className="knot-editor-toolbar bg-background">
            <Toolbar editor={editor} />
          </div>
        )}

        {slashMenuOpen && slashMenuPos && (
          <div
            ref={slashMenuRef}
            style={{
              position: "fixed",
              left: slashMenuPos.x,
              top: slashMenuPos.y,
              zIndex: 9999,
            }}
            className="w-56 rounded-lg border bg-popover p-1 shadow-lg"
          >
            {SLASH_OPTIONS.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.action}
                  type="button"
                  onClick={() => handleSlashSelect(option.action)}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-popover-foreground hover:bg-accent hover:text-accent-foreground"
                >
                  <Icon className="size-4 shrink-0" />
                  <span>{option.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {tableMenuPos && (
          <div
            ref={tableMenuRef}
            style={{ position: "fixed", left: tableMenuPos.x, top: tableMenuPos.y }}
            data-table-popup="true"
            className="z-[9999] rounded-lg border bg-popover p-0 shadow-lg"
          >
            <TablePopupMenu editor={editor} />
          </div>
        )}

        {imageMenuPos && (
          <div
            ref={imageMenuRef}
            style={{ position: "fixed", left: imageMenuPos.x, top: imageMenuPos.y }}
            className="z-[9999] rounded-lg border bg-popover p-0 shadow-lg"
          >
            <ImagePopupMenu />
          </div>
        )}

        <div className="knot-editor-scroll">
          <div className="knot-editor-page">
            <div className="px-8 py-6 min-h-[400px] cursor-text">
              <EditorContent editor={editor} />
            </div>
            <StatusBar
              editor={editor}
              saveStatus={saveStatus}
              lastSavedAt={lastSavedAt}
            />
          </div>
        </div>

        <style>{`
          .editor-container .ProseMirror {
            outline: none;
            min-height: 400px;
          }
          .editor-container .ProseMirror h1 {
            font-size: 1.875rem;
            font-weight: 700;
            line-height: 1.2;
            margin-top: 1.5rem;
            margin-bottom: 0.75rem;
          }
          .editor-container .ProseMirror h2 {
            font-size: 1.5rem;
            font-weight: 700;
            line-height: 1.3;
            margin-top: 1.25rem;
            margin-bottom: 0.5rem;
          }
          .editor-container .ProseMirror h3 {
            font-size: 1.25rem;
            font-weight: 600;
            line-height: 1.4;
            margin-top: 1rem;
            margin-bottom: 0.5rem;
          }
          .editor-container .ProseMirror p {
            margin-bottom: 0.5rem;
            line-height: 1.7;
          }
          .editor-container .ProseMirror ul,
          .editor-container .ProseMirror ol {
            padding-left: 1.5rem;
            margin-bottom: 0.5rem;
          }
          .editor-container .ProseMirror ul {
            list-style-type: disc;
          }
          .editor-container .ProseMirror ol {
            list-style-type: decimal;
          }
          .editor-container .ProseMirror li {
            margin-bottom: 0.25rem;
          }
          .editor-container .ProseMirror pre {
            background: var(--muted);
            border-radius: 0.5rem;
            padding: 1rem;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            font-size: 0.875rem;
            line-height: 1.6;
            overflow-x: auto;
            margin-bottom: 0.75rem;
          }
          .editor-container .ProseMirror pre code {
            background: none;
            padding: 0;
            font-size: inherit;
            color: inherit;
          }
          .editor-container .ProseMirror code {
            background: var(--muted);
            border-radius: 0.25rem;
            padding: 0.125rem 0.25rem;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            font-size: 0.875em;
          }
          .editor-container .ProseMirror blockquote {
            border-left: 3px solid var(--primary);
            padding-left: 1rem;
            margin-left: 0;
            margin-right: 0;
            margin-bottom: 0.5rem;
            font-style: italic;
            color: var(--muted-foreground);
          }
          .editor-container .ProseMirror hr {
            border: none;
            border-top: 1px solid var(--border);
            margin: 1.5rem 0;
          }
          .editor-container .ProseMirror table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 0.75rem;
            overflow: hidden;
          }
          .editor-container .ProseMirror th,
          .editor-container .ProseMirror td {
            border: 1px solid var(--border);
            padding: 0.5rem 0.75rem;
            text-align: left;
            position: relative;
            vertical-align: top;
            min-width: 80px;
          }
          .editor-container .ProseMirror th {
            position: relative;
            background: var(--muted);
            font-weight: 600;
          }
          .editor-container .ProseMirror a {
            color: var(--primary);
            text-decoration: underline;
            cursor: pointer;
          }
          .editor-container .ProseMirror img {
            max-width: 100%;
            height: auto;
            border-radius: 0.375rem;
            margin: 0.75rem 0;
          }
          .editor-container .ProseMirror [data-resize-container] img {
            margin: 0;
          }
          .editor-container .ProseMirror figure {
            margin: 0.75rem 0;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .editor-container .ProseMirror figcaption {
            font-size: 0.875rem;
            color: var(--muted-foreground);
            font-style: italic;
            margin-top: 0.25rem;
          }
          .editor-container .ProseMirror figcaption:empty::before {
            content: "Caption";
            color: var(--muted-foreground);
            opacity: 0.5;
            font-style: italic;
          }
          .editor-container .ProseMirror caption {
            font-size: 0.875rem;
            color: var(--muted-foreground);
            font-style: italic;
            margin-bottom: 0.25rem;
            text-align: center;
            caption-side: top;
          }
          .editor-container .ProseMirror .table-caption-input {
            width: 100%;
            border: none;
            background: transparent;
            font: inherit;
            font-size: 0.875rem;
            color: var(--muted-foreground);
            font-style: italic;
            text-align: center;
            outline: none;
            padding: 0;
          }
          .editor-container .ProseMirror .table-caption-input::placeholder {
            color: var(--muted-foreground);
            opacity: 0.5;
            font-style: italic;
          }
          .editor-container .ProseMirror p.is-editor-empty:first-child::before {
            color: var(--muted-foreground);
            content: attr(data-placeholder);
            float: left;
            height: 0;
            pointer-events: none;
          }
          .editor-container .ProseMirror p.is-empty::before {
            color: var(--muted-foreground);
            content: attr(data-placeholder);
            float: left;
            height: 0;
            pointer-events: none;
          }
          .editor-container .ProseMirror mark {
            background: #fef08a;
            border-radius: 0.125rem;
            padding: 0.125rem 0;
          }
          .dark .editor-container .ProseMirror mark {
            background: #854d0e;
            color: #fef9c3;
          }
          .editor-container .ProseMirror ul[data-type="taskList"] {
            list-style: none;
            padding-left: 0;
          }
          .editor-container .ProseMirror ul[data-type="taskList"] li {
            display: flex;
            align-items: flex-start;
            gap: 0.5rem;
          }
          .editor-container .ProseMirror ul[data-type="taskList"] li > label {
            flex-shrink: 0;
            margin-top: 0.25rem;
          }
          .editor-container .ProseMirror ul[data-type="taskList"] li > div {
            flex: 1;
          }
          .editor-container .ProseMirror .tableWrapper {
            overflow-x: auto;
            margin-bottom: 0.75rem;
          }
          .editor-container .ProseMirror table {
            table-layout: fixed;
            position: relative;
          }
          .editor-container .ProseMirror .column-resize-handle {
            position: absolute;
            right: -2px;
            top: 0;
            bottom: 0;
            width: 4px;
            background: var(--primary);
            cursor: col-resize;
            z-index: 20;
          }
          .editor-container .ProseMirror .selectedCell {
            background: var(--accent);
            outline: 2px solid var(--primary);
          }
          .editor-container .ProseMirror [data-resize-handle] {
            position: absolute;
            width: 10px;
            height: 10px;
            background: var(--primary);
            border: 2px solid hsl(var(--background));
            border-radius: 2px;
            z-index: 10;
            opacity: 0;
            transition: opacity 0.15s ease;
          }
          .editor-container .ProseMirror [data-resize-container]:hover [data-resize-handle],
          .editor-container .ProseMirror [data-resize-container][data-resize-state="true"] [data-resize-handle] {
            opacity: 1;
          }
          .editor-container .ProseMirror [data-resize-handle="bottom-right"] {
            cursor: nwse-resize;
          }
          .editor-container .ProseMirror [data-resize-handle="bottom-left"] {
            cursor: nesw-resize;
          }
          .editor-container .ProseMirror [data-resize-handle="top-right"] {
            cursor: nesw-resize;
          }
          .editor-container .ProseMirror [data-resize-handle="top-left"] {
            cursor: nwse-resize;
          }
          .editor-container .ProseMirror [data-resize-handle="top"],
          .editor-container .ProseMirror [data-resize-handle="bottom"] {
            cursor: ns-resize;
          }
          .editor-container .ProseMirror [data-resize-handle="left"],
          .editor-container .ProseMirror [data-resize-handle="right"] {
            cursor: ew-resize;
          }
          .editor-container .ProseMirror [data-resize-container][data-resize-state="true"] {
            outline: 2px solid var(--primary);
            outline-offset: 2px;
            border-radius: 3px;
          }

          .editor-container.knot-editor {
            border: none;
            border-radius: 0;
            height: 100%;
            width: 100%;
            display: flex;
            flex-direction: column;
            min-height: 0;
          }
          .knot-editor-toolbar {
            border-bottom: 1px solid hsl(var(--border));
          }
          .knot-editor-scroll {
            flex: 1;
            overflow-y: auto;
            padding: 4px 16px 24px;
          }
          .knot-editor-page {
            max-width: 860px;
            margin: 0 auto;
            background: var(--background);
            box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 6px rgba(0,0,0,0.08);
            border-radius: 4px;
            min-height: 500px;
          }
        `}</style>
      </div>
    );
  }

  // ====== NORMAL MODE (current behavior) ======
  return (
    <div
      className={cn(
        "editor-container flex flex-col rounded-lg border",
        className,
      )}
    >
      {!readOnly && (
        <div className="flex flex-wrap items-center gap-0.5 border-b px-2 py-1.5">
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
            onClick={() => editor.chain().focus().toggleCode().run()}
            isActive={editor.isActive("code")}
            disabled={!editor.can().toggleCode()}
            title="Inline Code"
            icon={Code}
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            isActive={editor.isActive("highlight")}
            disabled={!editor.can().toggleHighlight()}
            title="Highlight"
            icon={Highlighter}
          />

          <Separator orientation="vertical" className="mx-1 h-6" />

          <ToolbarButton
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
            isActive={editor.isActive("heading", { level: 1 })}
            disabled={
              !editor.can().toggleHeading({ level: 1 })
            }
            title="Heading 1"
            icon={Heading1}
          />
          <ToolbarButton
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            isActive={editor.isActive("heading", { level: 2 })}
            disabled={
              !editor.can().toggleHeading({ level: 2 })
            }
            title="Heading 2"
            icon={Heading2}
          />
          <ToolbarButton
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
            isActive={editor.isActive("heading", { level: 3 })}
            disabled={
              !editor.can().toggleHeading({ level: 3 })
            }
            title="Heading 3"
            icon={Heading3}
          />

          <Separator orientation="vertical" className="mx-1 h-6" />

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
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive("blockquote")}
            disabled={!editor.can().toggleBlockquote()}
            title="Blockquote"
            icon={Quote}
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            isActive={editor.isActive("codeBlock")}
            disabled={!editor.can().toggleCodeBlock()}
            title="Code Block"
            icon={Code}
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title="Horizontal Rule"
            icon={Minus}
          />

          <Separator orientation="vertical" className="mx-1 h-6" />

          <ToolbarButton
            onClick={handleLink}
            isActive={editor.isActive("link")}
            title="Link"
            icon={LinkIcon}
          />
          <ToolbarButton
            onClick={handleImage}
            isActive={editor.isActive("image")}
            title="Image"
            icon={ImageIcon}
          />
          <ToolbarButton
            onClick={() =>
              editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
            }
            isActive={editor.isActive("table")}
            title="Table"
            icon={TableIcon}
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            isActive={editor.isActive({ textAlign: "left" })}
            disabled={!editor.can().setTextAlign("left")}
            title="Align Left"
            icon={AlignLeft}
          />
          <ToolbarButton
            onClick={() =>
              editor.chain().focus().setTextAlign("center").run()
            }
            isActive={editor.isActive({ textAlign: "center" })}
            disabled={!editor.can().setTextAlign("center")}
            title="Align Center"
            icon={AlignCenter}
          />
          <ToolbarButton
            onClick={() =>
              editor.chain().focus().setTextAlign("right").run()
            }
            isActive={editor.isActive({ textAlign: "right" })}
            disabled={!editor.can().setTextAlign("right")}
            title="Align Right"
            icon={AlignRight}
          />

          <Separator orientation="vertical" className="mx-1 h-6" />

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
      )}

      {slashMenuOpen && slashMenuPos && (
        <div
          ref={slashMenuRef}
          style={{
            position: "fixed",
            left: slashMenuPos.x,
            top: slashMenuPos.y,
            zIndex: 9999,
          }}
          className="w-56 rounded-lg border bg-popover p-1 shadow-lg"
        >
          {SLASH_OPTIONS.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.action}
                type="button"
                onClick={() => handleSlashSelect(option.action)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-popover-foreground hover:bg-accent hover:text-accent-foreground"
              >
                <Icon className="size-4 shrink-0" />
                <span>{option.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {tableMenuPos && (
        <div
          ref={tableMenuRef}
          style={{ position: "fixed", left: tableMenuPos.x, top: tableMenuPos.y }}
          data-table-popup="true"
          className="z-[9999] rounded-lg border bg-popover p-0 shadow-lg"
        >
          <TablePopupMenu editor={editor} />
        </div>
      )}

      {imageMenuPos && (
        <div
          ref={imageMenuRef}
          style={{ position: "fixed", left: imageMenuPos.x, top: imageMenuPos.y }}
          className="z-[9999] rounded-lg border bg-popover p-0 shadow-lg"
        >
          <ImagePopupMenu />
        </div>
      )}

      <div className="px-4 py-4 min-h-[400px] cursor-text">
        <EditorContent editor={editor} />
      </div>

      <style>{`
        .editor-container .ProseMirror {
          outline: none;
          min-height: 400px;
        }
        .editor-container .ProseMirror h1 {
          font-size: 1.875rem;
          font-weight: 700;
          line-height: 1.2;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
        }
        .editor-container .ProseMirror h2 {
          font-size: 1.5rem;
          font-weight: 700;
          line-height: 1.3;
          margin-top: 1.25rem;
          margin-bottom: 0.5rem;
        }
        .editor-container .ProseMirror h3 {
          font-size: 1.25rem;
          font-weight: 600;
          line-height: 1.4;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
        }
        .editor-container .ProseMirror p {
          margin-bottom: 0.5rem;
          line-height: 1.7;
        }
        .editor-container .ProseMirror ul,
        .editor-container .ProseMirror ol {
          padding-left: 1.5rem;
          margin-bottom: 0.5rem;
        }
        .editor-container .ProseMirror ul {
          list-style-type: disc;
        }
        .editor-container .ProseMirror ol {
          list-style-type: decimal;
        }
        .editor-container .ProseMirror li {
          margin-bottom: 0.25rem;
        }
        .editor-container .ProseMirror pre {
          background: var(--muted);
          border-radius: 0.5rem;
          padding: 1rem;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 0.875rem;
          line-height: 1.6;
          overflow-x: auto;
          margin-bottom: 0.75rem;
        }
        .editor-container .ProseMirror pre code {
          background: none;
          padding: 0;
          font-size: inherit;
          color: inherit;
        }
        .editor-container .ProseMirror code {
          background: var(--muted);
          border-radius: 0.25rem;
          padding: 0.125rem 0.25rem;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 0.875em;
        }
        .editor-container .ProseMirror blockquote {
          border-left: 3px solid var(--primary);
          padding-left: 1rem;
          margin-left: 0;
          margin-right: 0;
          margin-bottom: 0.5rem;
          font-style: italic;
          color: var(--muted-foreground);
        }
        .editor-container .ProseMirror hr {
          border: none;
          border-top: 1px solid var(--border);
          margin: 1.5rem 0;
        }
        .editor-container .ProseMirror table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 0.75rem;
          overflow: hidden;
        }
        .editor-container .ProseMirror th,
        .editor-container .ProseMirror td {
          border: 1px solid var(--border);
          padding: 0.5rem 0.75rem;
          text-align: left;
          position: relative;
          vertical-align: top;
          min-width: 80px;
        }
        .editor-container .ProseMirror th {
          position: relative;
          background: var(--muted);
          font-weight: 600;
        }
        .editor-container .ProseMirror a {
          color: var(--primary);
          text-decoration: underline;
          cursor: pointer;
        }
        .editor-container .ProseMirror img {
          max-width: 100%;
          height: auto;
          border-radius: 0.375rem;
          margin: 0.75rem 0;
        }
        .editor-container .ProseMirror [data-resize-container] img {
          margin: 0;
        }
        .editor-container .ProseMirror figure {
          margin: 0.75rem 0;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .editor-container .ProseMirror figcaption {
          font-size: 0.875rem;
          color: var(--muted-foreground);
          font-style: italic;
          margin-top: 0.25rem;
        }
        .editor-container .ProseMirror figcaption:empty::before {
          content: "Caption";
          color: var(--muted-foreground);
          opacity: 0.5;
          font-style: italic;
        }
        .editor-container .ProseMirror caption {
          font-size: 0.875rem;
          color: var(--muted-foreground);
          font-style: italic;
          margin-bottom: 0.25rem;
          text-align: center;
          caption-side: top;
        }
        .editor-container .ProseMirror .table-caption-input {
          width: 100%;
          border: none;
          background: transparent;
          font: inherit;
          font-size: 0.875rem;
          color: var(--muted-foreground);
          font-style: italic;
          text-align: center;
          outline: none;
          padding: 0;
        }
        .editor-container .ProseMirror .table-caption-input::placeholder {
          color: var(--muted-foreground);
          opacity: 0.5;
          font-style: italic;
        }
        .editor-container .ProseMirror p.is-editor-empty:first-child::before {
          color: var(--muted-foreground);
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
        .editor-container .ProseMirror p.is-empty::before {
          color: var(--muted-foreground);
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
        .editor-container .ProseMirror mark {
          background: #fef08a;
          border-radius: 0.125rem;
          padding: 0.125rem 0;
        }
        .dark .editor-container .ProseMirror mark {
          background: #854d0e;
          color: #fef9c3;
        }
        .editor-container .ProseMirror ul[data-type="taskList"] {
          list-style: none;
          padding-left: 0;
        }
        .editor-container .ProseMirror ul[data-type="taskList"] li {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
        }
        .editor-container .ProseMirror ul[data-type="taskList"] li > label {
          flex-shrink: 0;
          margin-top: 0.25rem;
        }
        .editor-container .ProseMirror ul[data-type="taskList"] li > div {
          flex: 1;
        }
        .editor-container .ProseMirror .tableWrapper {
          overflow-x: auto;
          margin-bottom: 0.75rem;
        }
        .editor-container .ProseMirror table {
          table-layout: fixed;
          position: relative;
        }
        .editor-container .ProseMirror .column-resize-handle {
          position: absolute;
          right: -2px;
          top: 0;
          bottom: 0;
          width: 4px;
          background: var(--primary);
          cursor: col-resize;
          z-index: 20;
        }
        .editor-container .ProseMirror .selectedCell {
          background: var(--accent);
          outline: 2px solid var(--primary);
        }
        .editor-container .ProseMirror [data-resize-handle] {
          position: absolute;
          width: 10px;
          height: 10px;
          background: var(--primary);
          border: 2px solid hsl(var(--background));
          border-radius: 2px;
          z-index: 10;
          opacity: 0;
          transition: opacity 0.15s ease;
        }
        .editor-container .ProseMirror [data-resize-container]:hover [data-resize-handle],
        .editor-container .ProseMirror [data-resize-container][data-resize-state="true"] [data-resize-handle] {
          opacity: 1;
        }
        .editor-container .ProseMirror [data-resize-handle="bottom-right"] {
          cursor: nwse-resize;
        }
        .editor-container .ProseMirror [data-resize-handle="bottom-left"] {
          cursor: nesw-resize;
        }
        .editor-container .ProseMirror [data-resize-handle="top-right"] {
          cursor: nesw-resize;
        }
        .editor-container .ProseMirror [data-resize-handle="top-left"] {
          cursor: nwse-resize;
        }
        .editor-container .ProseMirror [data-resize-handle="top"],
        .editor-container .ProseMirror [data-resize-handle="bottom"] {
          cursor: ns-resize;
        }
        .editor-container .ProseMirror [data-resize-handle="left"],
        .editor-container .ProseMirror [data-resize-handle="right"] {
          cursor: ew-resize;
        }
        .editor-container .ProseMirror [data-resize-container][data-resize-state="true"] {
          outline: 2px solid var(--primary);
          outline-offset: 2px;
          border-radius: 3px;
        }
      `}</style>
    </div>
  );

  }


