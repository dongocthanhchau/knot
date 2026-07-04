"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import ImageExt from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import LinkExt from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Highlight from "@tiptap/extension-highlight";
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

const lowlight = createLowlight(common);

interface EditorProps {
  content: string;
  onUpdate?: (html: string) => void;
  readOnly?: boolean;
  className?: string;
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
}: EditorProps) {
  const [slashMenuOpen, setSlashMenuOpen] = useState(false);
  const slashMenuRef = useRef<HTMLDivElement>(null);
  const processingSlash = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        heading: { levels: [1, 2, 3] },
        link: false,
        underline: false,
      }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      ImageExt.configure({ inline: false, allowBase64: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      LinkExt.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { class: "text-primary underline" },
      }),
      Placeholder.configure({ placeholder: "Start writing..." }),
      CodeBlockLowlight.configure({ lowlight }),
      Highlight,
    ],
    content,
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
        setSlashMenuOpen(true);
      } else if (slashMenuOpen) {
        setSlashMenuOpen(false);
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
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [slashMenuOpen]);

  const handleSlashSelect = useCallback(
    (action: SlashAction) => {
      if (!editor) return;

      processingSlash.current = true;
      setSlashMenuOpen(false);

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
    editor.chain().focus().setImage({ src: url }).run();
  }, [editor]);

  if (!editor) {
    return null;
  }

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

      {slashMenuOpen && (
        <div
          ref={slashMenuRef}
          className="flex flex-wrap items-center gap-0.5 border-b px-2 py-1.5"
        >
          <span className="mr-1 text-xs text-muted-foreground">Quick insert:</span>
          {SLASH_OPTIONS.map((option) => (
            <Button
              key={option.action}
              variant="ghost"
              size="sm"
              onClick={() => handleSlashSelect(option.action)}
              title={option.label}
              className="gap-1"
            >
              <option.icon className="size-3.5" />
              <span className="text-xs">{option.label}</span>
            </Button>
          ))}
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
          background: hsl(var(--muted));
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
          background: hsl(var(--muted));
          border-radius: 0.25rem;
          padding: 0.125rem 0.25rem;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 0.875em;
        }
        .editor-container .ProseMirror blockquote {
          border-left: 2px solid hsl(var(--primary));
          padding-left: 1rem;
          margin-left: 0;
          margin-right: 0;
          margin-bottom: 0.5rem;
          font-style: italic;
          color: hsl(var(--muted-foreground));
        }
        .editor-container .ProseMirror hr {
          border: none;
          border-top: 1px solid hsl(var(--border));
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
          border: 1px solid hsl(var(--border));
          padding: 0.5rem 0.75rem;
          text-align: left;
          vertical-align: top;
          min-width: 80px;
        }
        .editor-container .ProseMirror th {
          background: hsl(var(--muted));
          font-weight: 600;
        }
        .editor-container .ProseMirror a {
          color: hsl(var(--primary));
          text-decoration: underline;
          cursor: pointer;
        }
        .editor-container .ProseMirror img {
          max-width: 100%;
          height: auto;
          border-radius: 0.375rem;
          margin: 0.75rem 0;
        }
        .editor-container .ProseMirror p.is-editor-empty:first-child::before {
          color: hsl(var(--muted-foreground));
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
        .editor-container .ProseMirror p.is-empty::before {
          color: hsl(var(--muted-foreground));
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
        .editor-container .ProseMirror .selectedCell {
          background: hsl(var(--accent));
        }
      `}</style>
    </div>
  );
}
