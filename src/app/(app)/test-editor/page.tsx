"use client";

import { useState, useRef } from "react";
import { DocxEditor, createEmptyDocument, type DocxEditorRef } from "@eigenpal/docx-editor-react";
import "@eigenpal/docx-editor-react/styles.css";

const emptyDoc = createEmptyDocument();

export default function TestEditorPage() {
  const editorRef = useRef<DocxEditorRef>(null);
  const [buffer, setBuffer] = useState<ArrayBuffer | null>(null);
  const [mode, setMode] = useState<"editing" | "suggesting" | "viewing">("editing");

  async function handleSave() {
    const buf = await editorRef.current?.save();
    if (buf) {
      setBuffer(buf);
      console.log("Saved, size:", buf.byteLength);
    }
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="flex items-center gap-2 p-2 border-b bg-background">
        <select
          className="px-2 py-1 border rounded text-sm"
          value={mode}
          onChange={(e) => setMode(e.target.value as typeof mode)}
        >
          <option value="editing">Editing</option>
          <option value="suggesting">Suggesting</option>
          <option value="viewing">Viewing</option>
        </select>
        <button
          className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm"
          onClick={handleSave}
        >
          Save to memory
        </button>
        {buffer && (
          <span className="text-xs text-muted-foreground">
            Saved: {buffer.byteLength} bytes
          </span>
        )}
      </div>
      <div className="flex-1 overflow-hidden">
        <DocxEditor
          ref={editorRef}
          document={emptyDoc}
          mode={mode}
          showToolbar
          showZoomControl
          showOutline
          author="Test User"
        />
      </div>
    </div>
  );
}
