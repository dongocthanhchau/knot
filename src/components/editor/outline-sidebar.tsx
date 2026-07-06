import { useState, useEffect, useCallback, useRef } from "react";
import { ListTree, Info } from "lucide-react";
import type { Editor } from "@tiptap/react";
import { cn } from "@/lib/utils";

type Tab = "outline" | "description";

interface HeadingItem {
  level: number;
  text: string;
  pos: number;
}

interface OutlineSidebarProps {
  editor: Editor | null;
  createdAt?: string;
  updatedAt?: string;
  content?: string;
}

const MIN_WIDTH = 160;
const MAX_WIDTH = 500;

export function OutlineSidebar({ editor, createdAt, updatedAt, content }: OutlineSidebarProps) {
  const [activeTab, setActiveTab] = useState<Tab>("outline");
  const [headings, setHeadings] = useState<HeadingItem[]>([]);
  const [activePos, setActivePos] = useState<number | null>(null);
  const [width, setWidth] = useState(220);
  const isResizing = useRef(false);

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

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, window.innerWidth - e.clientX));
      setWidth(newWidth);
    };

    const handleMouseUp = () => {
      isResizing.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, []);

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

  const charCount = content?.length ?? 0;
  const wordCount = content
    ? content.replace(/<[^>]*>/g, "").split(/\s+/).filter(Boolean).length
    : 0;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="editor-outline" style={{ width }}>
      <div
        className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/30 active:bg-primary/50 z-10"
        onMouseDown={handleMouseDown}
      />
      <div className="editor-outline-header">
        <button
          className={cn(
            "flex items-center justify-center p-0 size-7 rounded-[10px] transition-colors",
            activeTab === "outline"
              ? "text-gray-900 dark:text-gray-100 bg-accent/50"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          )}
          onClick={() => setActiveTab("outline")}
          title="Outline"
        >
          <ListTree size={16} />
        </button>
        <button
          className={cn(
            "flex items-center justify-center p-0 size-7 rounded-[10px] transition-colors",
            activeTab === "description"
              ? "text-gray-900 dark:text-gray-100 bg-accent/50"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          )}
          onClick={() => setActiveTab("description")}
          title="Document info"
        >
          <Info size={16} />
        </button>
      </div>

      {activeTab === "outline" ? (
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
      ) : (
        <div className="flex flex-col gap-2 p-4 text-xs text-gray-600 dark:text-gray-400">
          <div className="flex justify-between">
            <span className="font-medium">Characters</span>
            <span>{charCount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Words</span>
            <span>{wordCount.toLocaleString()}</span>
          </div>
          <div className="h-px bg-border/40 my-1" />
          <div className="flex justify-between">
            <span className="font-medium">Created</span>
            <span>{formatDate(createdAt)}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Modified</span>
            <span>{formatDate(updatedAt)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
