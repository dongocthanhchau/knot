"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import type { SlashMenuItem } from "./slash-menu";

interface SlashMenuViewProps {
  items: SlashMenuItem[];
  command: (item: SlashMenuItem) => void;
}

export const SlashMenuView = forwardRef<
  { onKeyDown: (props: { event: KeyboardEvent }) => boolean },
  SlashMenuViewProps
>((props, ref) => {
  const { items, command } = props;
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    setSelectedIndex(0);
  }, [items.length]);

  const selectItem = (index: number) => {
    const item = items[index];
    if (item) {
      command(item);
    }
  };

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === "ArrowDown") {
        setSelectedIndex((prev) => (prev + 1) % items.length);
        return true;
      }
      if (event.key === "ArrowUp") {
        setSelectedIndex(
          (prev) => (prev - 1 + items.length) % items.length
        );
        return true;
      }
      if (event.key === "Enter") {
        selectItem(selectedIndex);
        return true;
      }
      if (event.key === "Escape") {
        return true;
      }
      return false;
    },
  }));

  if (items.length === 0) return null;

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        padding: 4,
        maxHeight: 280,
        overflowY: "auto",
        minWidth: 200,
        fontSize: 13,
      }}
    >
      {items.map((item, index) => (
        <div
          key={item.title}
          onClick={() => selectItem(index)}
          onMouseEnter={() => setSelectedIndex(index)}
          style={{
            padding: "6px 10px",
            borderRadius: 6,
            cursor: "pointer",
            background:
              index === selectedIndex ? "#f3f4f6" : "transparent",
          }}
        >
          <div style={{ fontWeight: 500, color: "#111" }}>
            {item.title}
          </div>
          {item.description && (
            <div style={{ fontSize: 11, color: "#6b7280" }}>
              {item.description}
            </div>
          )}
        </div>
      ))}
    </div>
  );
});

SlashMenuView.displayName = "SlashMenuView";
