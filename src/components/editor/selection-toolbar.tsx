"use client";

import { BubbleMenu } from "@tiptap/react/menus";
import type { Editor } from "@tiptap/react";
import { Bold, Italic, Underline, Strikethrough, Code, Subscript, Superscript, Link, RemoveFormatting } from "lucide-react";

interface SelectionToolbarProps {
  editor: Editor;
}

export function SelectionToolbar({ editor }: SelectionToolbarProps) {
  const getFontLabel = () => {
    const ff = editor.getAttributes("textStyle").fontFamily;
    if (!ff || ff === "inherit") return "Font";
    const name = ff.replace(/['"]/g, "");
    return name.length > 12 ? name.slice(0, 10) + "\u2026" : name;
  };

  const getSizeLabel = () => {
    const fs = editor.getAttributes("textStyle").fontSize;
    if (!fs) return "Size";
    return fs;
  };

  const getBlockLabel = () => {
    if (editor.isActive("heading", { level: 1 })) return "H1";
    if (editor.isActive("heading", { level: 2 })) return "H2";
    if (editor.isActive("heading", { level: 3 })) return "H3";
    if (editor.isActive("heading", { level: 4 })) return "H4";
    if (editor.isActive("heading", { level: 5 })) return "H5";
    if (editor.isActive("heading", { level: 6 })) return "H6";
    if (editor.isActive("paragraph")) return "P";
    if (editor.isActive("codeBlock")) return "Code";
    if (editor.isActive("bulletList")) return "List";
    if (editor.isActive("orderedList")) return "OL";
    return "P";
  };

  if (!editor) return null;

  return (
    <BubbleMenu
      editor={editor}
      options={{
        placement: "top",
      }}
      shouldShow={({ editor: ed, state: st }) => {
        const { selection } = st;
        const { empty } = selection;
        if (empty) return false;
        if (ed.isActive("table") || ed.isActive("tableCell") || ed.isActive("tableHeader")) return false;
        return true;
      }}
    >
      <div className="selection-toolbar">
        <span className="st-label st-block">{getBlockLabel()}</span>

        <span className="st-sep" />

        <span className="st-label">{getFontLabel()}</span>

        <span className="st-sep" />

        <span className="st-label">{getSizeLabel()}</span>

        <span className="st-sep" />

        <button
          className={`st-btn${editor.isActive("bold") ? " active" : ""}`}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Bold"
        >
          <Bold size={13} />
        </button>
        <button
          className={`st-btn${editor.isActive("italic") ? " active" : ""}`}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italic"
        >
          <Italic size={13} />
        </button>
        <button
          className={`st-btn${editor.isActive("underline") ? " active" : ""}`}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          title="Underline"
        >
          <Underline size={13} />
        </button>
        <button
          className={`st-btn${editor.isActive("strike") ? " active" : ""}`}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          title="Strikethrough"
        >
          <Strikethrough size={13} />
        </button>
        <button
          className={`st-btn${editor.isActive("code") ? " active" : ""}`}
          onClick={() => editor.chain().focus().toggleCode().run()}
          title="Inline code"
        >
          <Code size={13} />
        </button>
        <button
          className={`st-btn${editor.isActive("subscript") ? " active" : ""}`}
          onClick={() => editor.chain().focus().toggleSubscript().run()}
          title="Subscript"
        >
          <Subscript size={13} />
        </button>
        <button
          className={`st-btn${editor.isActive("superscript") ? " active" : ""}`}
          onClick={() => editor.chain().focus().toggleSuperscript().run()}
          title="Superscript"
        >
          <Superscript size={13} />
        </button>

        <span className="st-sep" />

        <button
          className={`st-btn${editor.isActive("link") ? " active" : ""}`}
          onClick={() => {
            if (editor.isActive("link")) {
              editor.chain().focus().unsetLink().run();
            } else {
              const url = window.prompt("URL:", "https://");
              if (url) editor.chain().focus().setLink({ href: url }).run();
            }
          }}
          title={editor.isActive("link") ? "Remove link" : "Insert link"}
        >
          <Link size={13} />
        </button>

        <button
          className="st-btn"
          onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
          title="Clear formatting"
        >
          <RemoveFormatting size={13} />
        </button>
      </div>
    </BubbleMenu>
  );
}
