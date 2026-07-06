"use client";

import { useCallback, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";

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

interface TextColorDropdownProps {
  editor: Editor;
}

export function TextColorDropdown({ editor }: TextColorDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const currentColor = editor.getAttributes("textStyle").color || "#000000";

  const toggle = useCallback(() => {
    setOpen((o) => !o);
  }, []);

  return (
    <div className="color-dropdown" ref={ref}>
      <button
        className="color-dropdown-trigger"
        onClick={toggle}
        title="Text color"
        aria-label="Text color"
      >
        <span className="color-swatch" style={{ backgroundColor: currentColor }} />
        <span className="color-arrow">▾</span>
      </button>
      {open && (
        <>
          <div className="color-backdrop" onClick={() => setOpen(false)} />
          <div className="color-picker">
            <div className="color-grid">
              {TEXT_COLORS.map((color) => (
                <button
                  key={color}
                  className="color-cell"
                  style={{ backgroundColor: color }}
                  onClick={() => {
                    editor.chain().focus().setColor(color).run();
                    setOpen(false);
                  }}
                  title={color}
                  aria-label={`Color ${color}`}
                />
              ))}
            </div>
            <button
              className="color-reset"
              onClick={() => {
                editor.chain().focus().unsetColor().run();
                setOpen(false);
              }}
            >
              Reset
            </button>
          </div>
        </>
      )}
    </div>
  );
}
