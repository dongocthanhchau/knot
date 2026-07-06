"use client";

import { useCallback } from "react";
import type { Editor } from "@tiptap/react";

const SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 42, 48, 72];

interface FontSizeDropdownProps {
  editor: Editor;
}

export function FontSizeDropdown({ editor }: FontSizeDropdownProps) {
  const currentSize = editor.getAttributes("textStyle").fontSize || "11";

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value;
      if (value === "") {
        editor.chain().focus().unsetFontSize().run();
      } else {
        editor.chain().focus().setFontSize(value + "px").run();
      }
    },
    [editor]
  );

  return (
    <select
      className="font-size-dropdown"
      value={currentSize.replace("px", "")}
      onChange={handleChange}
      aria-label="Font size"
    >
      {SIZES.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}
