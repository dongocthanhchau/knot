"use client";

import { useRef, useState, useEffect, useCallback, forwardRef, useImperativeHandle } from "react";
import dynamic from "next/dynamic";
import { useTheme } from "@wrksz/themes/client";
import { cn } from "@/lib/utils";
import type { DocxEditorRef } from "@eigenpal/docx-editor-react";
import "@eigenpal/docx-editor-react/styles.css";

import type { Document } from "@eigenpal/docx-editor-core";

export interface DocxEditorHandle {
  scrollToParaId: (paraId: string) => boolean;
}

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

const docxEditorCss = `
  .docx-editor .layout-table-cell-content {
    height: 100%;
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

export const DocxEditorWrapper = forwardRef<DocxEditorHandle, DocxEditorWrapperProps>(({
  noteId,
  documentName,
  onDocumentNameChange,
  onContentChange,
  onDocumentChange,
  onSave,
  renderLogo,
  renderTitleBarRight,
}, ref) => {
  const scrollToParaId = useCallback((paraId: string) => {
    return editorRef.current?.scrollToParaId(paraId) ?? false;
  }, []);

  useImperativeHandle(ref, () => ({ scrollToParaId }), [scrollToParaId]);
  const { resolvedTheme } = useTheme();
  const editorRef = useRef<DocxEditorRef>(null);
  const [buffer, setBuffer] = useState<ArrayBuffer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const docxInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  // Fetch the DOCX buffer from the API on mount
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
          // Validate ZIP integrity before passing to the editor
          // Corrupted data (missing EOCD) causes library parse error
          if (!isValidZip(buf)) {
            console.warn("[docx-editor] Corrupt content detected (invalid ZIP) — showing empty editor");
            setBuffer(null);
          } else {
            setBuffer(buf);
          }
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

  /** Quick check that an ArrayBuffer has a valid ZIP end-of-central-directory record.
   *  The @eigenpal/docx-editor-react save() can produce corrupt output (known issue
   *  with files containing images). We reject those before overwriting the API data. */
  function isValidZip(buf: ArrayBuffer): boolean {
    const u8 = new Uint8Array(buf);
    // EOCD must be within the last 65557 bytes of a valid ZIP
    const start = Math.max(0, u8.length - 65557);
    for (let i = u8.length - 22; i >= start; i--) {
      if (u8[i] === 0x50 && u8[i + 1] === 0x4b && u8[i + 2] === 0x05 && u8[i + 3] === 0x06) {
        return true;
      }
    }
    return false;
  }

  // Debounced save — uses editorRef.save() to get the latest binary
  const save = useCallback(async () => {
    try {
      const buf = await editorRef.current?.save();
      if (!buf) return;

      // Guard: only persist if the save() output is a valid ZIP
      // (the library's save() is known to produce corrupt output for DOCX files with images)
      if (!isValidZip(buf)) {
        console.warn("[auto-save] save() produced invalid ZIP — discarding to avoid data corruption");
        return;
      }

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

  // Extract headings when the editor first mounts
  const handleEditorReady = useCallback(() => {
    const doc = editorRef.current?.getDocument();
    if (doc) {
      onDocumentChange?.(doc);
    }
  }, [onDocumentChange]);

  // Handle direct DOCX upload into this note (corrupt content recovery or initial upload)
  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".docx")) return;

    setUploading(true);
    try {
      const buf = await file.arrayBuffer();
      const res = await fetch(`/api/notes/${noteId}/content`, {
        method: "PUT",
        headers: { "Content-Type": "application/octet-stream" },
        body: buf,
      });
      if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
      setBuffer(buf);
    } catch (err) {
      console.error("[docx-editor] Upload error:", err);
    } finally {
      setUploading(false);
      if (docxInputRef.current) docxInputRef.current.value = "";
    }
  }, [noteId]);

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

  // No buffer — show upload prompt (corrupt content, or brand new note)
  if (!buffer) {
    return (
      <>
        <style>{titleBarLayoutCss}</style>
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4 text-sm text-muted-foreground">
          <p>No document content loaded.</p>
          <label
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer",
              "hover:bg-accent transition-colors",
              uploading && "opacity-50 pointer-events-none",
            )}
          >
            <input
              ref={docxInputRef}
              type="file"
              accept=".docx"
              className="sr-only"
              onChange={handleUpload}
            />
            {uploading ? "Uploading..." : "Upload DOCX"}
          </label>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{titleBarLayoutCss}</style>
      <style>{docxEditorCss}</style>
      <DocxEditor
        ref={editorRef}
        documentBuffer={buffer}
        onChange={handleChange}
        onEditorViewReady={handleEditorReady}
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
});
