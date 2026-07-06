"use client";

import { useCallback } from "react";
import type { Editor } from "@tiptap/react";

interface HeadingStyleDropdownProps {
  editor: Editor;
}

const STYLES = [
  { label: "Paragraph", value: "paragraph" },
  { label: "Heading 1", value: "h1" },
  { label: "Heading 2", value: "h2" },
  { label: "Heading 3", value: "h3" },
  { label: "Heading 4", value: "h4" },
  { label: "Heading 5", value: "h5" },
  { label: "Heading 6", value: "h6" },
  { label: "Blockquote", value: "blockquote" },
];

export function HeadingStyleDropdown({ editor }: HeadingStyleDropdownProps) {
  const getCurrentStyle = useCallback(() => {
    if (editor.isActive("paragraph")) return "paragraph";
    if (editor.isActive("blockquote")) return "blockquote";
    for (let level = 1; level <= 6; level++) {
      if (editor.isActive("heading", { level })) return `h${level}`;
    }
    return "paragraph";
  }, [editor]);

  const currentStyle = getCurrentStyle();

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value;
      if (value === "paragraph") {
        editor.chain().focus().setParagraph().run();
      } else if (value === "blockquote") {
        editor.chain().focus().toggleBlockquote().run();
      } else {
        const level = parseInt(value.replace("h", ""), 10) as 1 | 2 | 3 | 4 | 5 | 6;
        editor.chain().focus().toggleHeading({ level }).run();
      }
    },
    [editor]
  );

  return (
    <select
      className="font-family-dropdown"
      value={currentStyle}
      onChange={handleChange}
      aria-label="Heading style"
    >
      {STYLES.map((s) => (
        <option key={s.value} value={s.value}>
          {s.label}
        </option>
      ))}
    </select>
  );
}
