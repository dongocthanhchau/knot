"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface TableInsertGridProps {
  onSelect: (rows: number, cols: number) => void;
  onClose: () => void;
}

export function TableInsertGrid({ onSelect, onClose }: TableInsertGridProps) {
  const [hovered, setHovered] = useState({ row: 0, col: 0 });
  const maxRows = 8, maxCols = 8;

  return (
    <div className="p-2">
      <div
        className="grid gap-[1px]"
        style={{ gridTemplateColumns: `repeat(${maxCols}, 16px)` }}
        onMouseLeave={() => setHovered({ row: 0, col: 0 })}
      >
        {Array.from({ length: maxRows * maxCols }, (_, i) => {
          const row = Math.floor(i / maxCols) + 1;
          const col = (i % maxCols) + 1;
          const active = row <= hovered.row && col <= hovered.col;
          return (
            <div
              key={i}
              className={cn(
                "h-4 w-4 cursor-pointer rounded-sm border",
                active
                  ? "border-primary bg-primary/20"
                  : "border-border bg-background hover:border-primary/50"
              )}
              onMouseEnter={() => setHovered({ row, col })}
              onClick={() => {
                onSelect(hovered.row, hovered.col);
                onClose();
              }}
            />
          );
        })}
      </div>
      <div className="mt-2 text-center text-xs text-muted-foreground">
        {hovered.row || hovered.col
          ? `${hovered.row} × ${hovered.col}`
          : "Select size"}
      </div>
    </div>
  );
}
