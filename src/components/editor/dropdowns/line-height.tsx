"use client";

import { useCallback } from "react";
import type { Editor } from "@tiptap/react";

const LINE_HEIGHTS = ["1", "1.15", "1.5", "1.75", "2", "2.5", "3"];

interface LineHeightDropdownProps {
  editor: Editor;
}

export function LineHeightDropdown({ editor }: LineHeightDropdownProps) {
  const currentLineHeight =
    editor.getAttributes("paragraph").lineHeight ||
    editor.getAttributes("heading").lineHeight ||
    "";

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value;
      editor.chain().focus().setLineHeight(value).run();
    },
    [editor]
  );

  return (
    <select
      className="font-size-dropdown"
      value={currentLineHeight}
      onChange={handleChange}
      aria-label="Line height"
    >
      {LINE_HEIGHTS.map((h) => (
        <option key={h} value={h}>
          {h}
        </option>
      ))}
    </select>
  );
}
