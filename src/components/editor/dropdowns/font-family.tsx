"use client";

import { useCallback } from "react";
import type { Editor } from "@tiptap/react";

const FONTS = [
  { label: "Arial", value: "Arial" },
  { label: "Comic Sans MS", value: "Comic Sans MS" },
  { label: "Courier New", value: "Courier New" },
  { label: "Georgia", value: "Georgia" },
  { label: "Helvetica", value: "Helvetica" },
  { label: "Times New Roman", value: "Times New Roman" },
  { label: "Trebuchet MS", value: "Trebuchet MS" },
  { label: "Verdana", value: "Verdana" },
];

interface FontFamilyDropdownProps {
  editor: Editor;
}

export function FontFamilyDropdown({ editor }: FontFamilyDropdownProps) {
  const currentFont = editor.getAttributes("textStyle").fontFamily || "Arial";

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value;
      if (value === "") {
        editor.chain().focus().unsetFontFamily().run();
      } else {
        editor.chain().focus().setFontFamily(value).run();
      }
    },
    [editor]
  );

  return (
    <select
      className="font-family-dropdown"
      value={currentFont}
      onChange={handleChange}
      aria-label="Font family"
    >
      {FONTS.map((f) => (
        <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>
          {f.label}
        </option>
      ))}
    </select>
  );
}
