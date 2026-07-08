"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import type { DocxEditorRef } from "@eigenpal/docx-editor-react";
import "@eigenpal/docx-editor-react/styles.css";

import type { Document } from "@eigenpal/docx-editor-core";

// Override layout: Document Name + Menu Bar ngang thay vì dọc
// Menu bên trái gần Back, Document Name giữa và bung ra phần còn trống
const titleBarLayoutCss = `
  .docx-editor .flex.items-stretch > .flex-1.min-w-0 {
    flex-direction: row !important;
    align-items: center;
    justify-content: flex-start !important;
  }
  .docx-editor .flex.items-stretch > .flex-1.min-w-0 > .flex.items-center:last-child {
    order: -1;
    flex-shrink: 0;
    padding-left: 0 !important;
  }
  .docx-editor .flex.items-stretch > .flex-1.min-w-0 > .flex.items-center:first-child {
    flex: 1;
    justify-content: center;
    min-width: 0;
  }
  .docx-editor .flex.items-stretch > .flex-1.min-w-0 input[aria-label="Document name"] {
    width: 100% !important;
    max-width: none !important;
  }
`;

const DocxEditor = dynamic(
  () => import("@eigenpal/docx-editor-react").then((mod) => ({ default: mod.DocxEditor })),
  { ssr: false, loading: () => <DocxEditorSkeleton /> },
);

function DocxEditorSkeleton() {
  return (
    <div className="flex items-center justify-center h-[60vh] text-muted-foreground text-sm">
      Loading editor...
    </div>
  );
}

interface DocxEditorWrapperProps {
  noteId: string;
  documentName?: string;
  onDocumentNameChange?: (name: string) => void;
  onContentChange?: (extractedText: string) => void;
  onDocumentChange?: (document: Document) => void;
  onSave?: () => void;
  renderLogo?: () => React.ReactNode;
  renderTitleBarRight?: () => React.ReactNode;
}

export const DocxEditorWrapper = ({
  noteId,
  documentName,
  onDocumentNameChange,
  onContentChange,
  onDocumentChange,
  onSave,
  renderLogo,
  renderTitleBarRight,
}: DocxEditorWrapperProps) => {
  const { resolvedTheme } = useTheme();
  const editorRef = useRef<DocxEditorRef>(null);
  const [buffer, setBuffer] = useState<ArrayBuffer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch the document binary on mount
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`/api/notes/${noteId}/content`);
        if (res.status === 204) {
          if (!cancelled) {
            setBuffer(null);
            setLoading(false);
          }
          return;
        }
        if (!res.ok) {
          throw new Error(`Failed to load: ${res.status}`);
        }

        const buf = await res.arrayBuffer();
        if (!cancelled) {
          setBuffer(buf);
          setLoading(false);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load document");
          setLoading(false);
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [noteId]);

  // Debounced save — uses editorRef.save() to get the latest binary
  const save = useCallback(async () => {
    try {
      const buf = await editorRef.current?.save();
      if (!buf) return;

      const res = await fetch(`/api/notes/${noteId}/content`, {
        method: "PUT",
        headers: { "Content-Type": "application/octet-stream" },
        body: buf,
      });

      if (!res.ok) {
        console.error("Auto-save failed:", await res.text());
        return;
      }

      const body = await res.json();
      onSave?.();

      if (body.extractedText && onContentChange) {
        onContentChange(body.extractedText);
      }
    } catch (e) {
      console.error("Auto-save error:", e);
    }
  }, [noteId, onSave, onContentChange]);

  // Debounce timer — fires save after 2s of inactivity
  const handleChange = useCallback(
    (document: Document) => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
      saveTimerRef.current = setTimeout(save, 2000);

      // Forward document for heading extraction (debounced separately)
      onDocumentChange?.(document);
    },
    [save, onDocumentChange],
  );

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  if (loading) return <DocxEditorSkeleton />;
  if (error) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-destructive text-sm">
        Failed to load document: {error}
      </div>
    );
  }

  return (
    <>
      <style>{titleBarLayoutCss}</style>
      <DocxEditor
        ref={editorRef}
        documentBuffer={buffer}
        onChange={handleChange}
        mode="editing"
        showOutline={false}
        colorMode={resolvedTheme === "dark" ? "dark" : "light"}
        documentName={documentName}
        onDocumentNameChange={onDocumentNameChange}
        renderLogo={renderLogo}
        renderTitleBarRight={renderTitleBarRight}
      />
    </>
  );
}
