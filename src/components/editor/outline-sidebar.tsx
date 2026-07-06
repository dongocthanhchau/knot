import { useState, useEffect, useCallback } from "react";
import { ListTree } from "lucide-react";
import type { Editor } from "@tiptap/react";
import { cn } from "@/lib/utils";

interface HeadingItem {
  level: number;
  text: string;
  pos: number;
}

export function OutlineSidebar({ editor }: { editor: Editor | null }) {
  const [headings, setHeadings] = useState<HeadingItem[]>([]);
  const [activePos, setActivePos] = useState<number | null>(null);

  useEffect(() => {
    if (!editor) return;

    const updateHeadings = () => {
      const items: HeadingItem[] = [];
      editor.state.doc.forEach((node, pos) => {
        if (node.type.name === "heading") {
          items.push({ level: node.attrs.level, text: node.textContent, pos });
        }
      });
      setHeadings(items);
      setActivePos(editor.state.selection.anchor);
    };

    updateHeadings();
    editor.on("selectionUpdate", updateHeadings);
    editor.on("update", updateHeadings);

    return () => {
      editor.off("selectionUpdate", updateHeadings);
      editor.off("update", updateHeadings);
    };
  }, [editor]);

  const isHeadingActive = useCallback(
    (h: HeadingItem) => {
      if (activePos === null) return false;
      return activePos >= h.pos && activePos < h.pos + (h.text.length || 1);
    },
    [activePos]
  );

  const navigateToHeading = useCallback(
    (pos: number) => {
      if (!editor) return;
      editor.chain().focus().setTextSelection(pos).scrollIntoView().run();
    },
    [editor]
  );

  if (!editor) return null;

  return (
    <div className="editor-outline">
      <div className="editor-outline-header">
        <ListTree size={16} />
      </div>
      <div className="editor-outline-list">
        {headings.length === 0 ? (
          <div className="editor-outline-empty">No headings found</div>
        ) : (
          headings.map((h) => (
            <button
              key={h.pos}
              className={cn(
                "editor-outline-item",
                `editor-outline-level-${h.level}`,
                isHeadingActive(h) && "editor-outline-active"
              )}
              onClick={() => navigateToHeading(h.pos)}
            >
              {h.text || "(Empty heading)"}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
