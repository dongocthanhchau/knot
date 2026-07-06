"use client";

import { useCallback, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";

const HIGHLIGHT_COLORS = [
  "#ffffff", "#ffff00", "#00ff00", "#00ffff", "#ff9900", "#ff00ff", "#0000ff", "#ff0000",
  "#f4cccc", "#fce5cd", "#fff2cc", "#d9ead3", "#d0e0e3", "#c9daf8", "#cfe2f3", "#d9d2e9",
  "#ea9999", "#f9cb9c", "#ffe599", "#b6d7a8", "#a2c4c9", "#a4c2f4", "#9fc5e8", "#b4a7d6",
];

interface HighlightColorDropdownProps {
  editor: Editor;
}

export function HighlightColorDropdown({ editor }: HighlightColorDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const toggle = useCallback(() => {
    setOpen((o) => !o);
  }, []);

  return (
    <div className="color-dropdown" ref={ref}>
      <button
        className="color-dropdown-trigger"
        onClick={toggle}
        title="Highlight color"
        aria-label="Highlight color"
      >
        <span className="color-swatch" style={{ backgroundColor: "#ffff00" }} />
        <span className="color-arrow">▾</span>
      </button>
      {open && (
        <>
          <div className="color-backdrop" onClick={() => setOpen(false)} />
          <div className="color-picker">
            <div className="color-grid">
              {HIGHLIGHT_COLORS.map((color) => (
                <button
                  key={color}
                  className="color-cell"
                  style={{ backgroundColor: color }}
                  onClick={() => {
                    editor.chain().focus().toggleHighlight({ color }).run();
                    setOpen(false);
                  }}
                  title={color}
                  aria-label={`Highlight ${color}`}
                />
              ))}
            </div>
            <button
              className="color-reset"
              onClick={() => {
                editor.chain().focus().toggleHighlight().run();
                setOpen(false);
              }}
            >
              Remove
            </button>
          </div>
        </>
      )}
    </div>
  );
}
