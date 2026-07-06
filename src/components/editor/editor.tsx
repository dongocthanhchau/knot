"use client";

import { useEditor, EditorContent, type Editor as TiptapEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import ImageExtension from "@tiptap/extension-image";
import Heading from "@tiptap/extension-heading";
import { TextStyle } from "@tiptap/extension-text-style";
import FontFamily from "@tiptap/extension-font-family";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import { DataSheet } from "./datasheet-node";
import { SlashMenu } from "./slash-menu";
import { FontSize } from "./extensions/font-size";
import { Indent } from "./extensions/indent";
import { LineHeight } from "./extensions/line-height";
import { Table, TableRow, TableCell, TableHeader } from "@tiptap/extension-table";
import { useEffect, useRef } from "react";

interface EditorProps {
  content: string;
  onUpdate: (html: string) => void;
  className?: string;
  editable?: boolean;
  pageLayout?: boolean;
  onEditorReady?: (editor: TiptapEditor) => void;
  zoomLevel?: number;
}

export function Editor({
  content,
  onUpdate,
  onEditorReady,
  className,
  editable = true,
  zoomLevel = 100,
}: EditorProps) {
  // Keep a mutable ref to the latest onUpdate callback
  const onUpdateRef = useRef(onUpdate);
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        link: false,
        underline: false,
      }),
      Heading.configure({
        levels: [1, 2, 3, 4, 5, 6],
      }),
      Placeholder.configure({
        placeholder: "Start writing\u2026",
      }),
      TextStyle,
      FontFamily,
      FontSize,
      Color,
      Highlight.configure({ multicolor: true }),
      Subscript,
      Superscript,
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Link.configure({
        openOnClick: true,
      }),
      ImageExtension,
      DataSheet,
      SlashMenu,
      Indent,
      LineHeight,
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableCell,
      TableHeader,
    ],
    content,
    editable,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none focus:outline-none",
      },
    },
  });

  // Wire up onUpdate via editor event (avoids stale closure in useEditor options)
  useEffect(() => {
    if (!editor) return;
    const handler = () => onUpdateRef.current(editor.getHTML());
    editor.on("update", handler);
    return () => {
      editor.off("update", handler);
    };
  }, [editor]);

  // Notify when editor is ready
  useEffect(() => {
    if (editor && onEditorReady) {
      onEditorReady(editor);
    }
  }, [editor, onEditorReady]);

  // Sync content from outside (e.g., switching notes)
  const prevContent = useRef(content);
  useEffect(() => {
    if (content !== prevContent.current && editor) {
      prevContent.current = content;
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  // Sync editable prop
  useEffect(() => {
    if (editor) editor.setEditable(editable);
  }, [editable, editor]);

  const zoom = zoomLevel / 100;

  return (
    <div className={className}>
      <div className="editor-gdocs-container">
        <div
          className="editor-gdocs-page"
          style={{
            width: "21cm",
            transform: `scale(${zoom})`,
            transformOrigin: "top left",
          }}
        >
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
}
