"use client";

import { X } from "lucide-react";

interface TagBadgeProps {
  name: string;
  color?: string | null;
  onRemove?: () => void;
  onClick?: () => void;
  size?: "sm" | "md";
}

export function TagBadge({ name, color, onRemove, onClick, size = "sm" }: TagBadgeProps) {
  const tagColor = color ?? "#6b7280";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium leading-none transition-colors ${
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs"
      } ${onClick ? "cursor-pointer hover:opacity-80" : ""}`}
      style={{
        backgroundColor: `${tagColor}18`,
        color: tagColor,
        border: `1px solid ${tagColor}30`,
      }}
      onClick={onClick}
    >
      {name}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 rounded-full p-0.5 hover:bg-black/10 dark:hover:bg-white/10"
        >
          <X size={10} />
        </button>
      )}
    </span>
  );
}
