"use client";

import { useEffect, useState } from "react";
import type { Editor } from "@tiptap/react";

export function useEditorSelection(editor: Editor | null) {
  const [hash, setHash] = useState(0);

  useEffect(() => {
    if (!editor) return;
    const handler = () => setHash((h) => h + 1);
    editor.on("selectionUpdate", handler);
    editor.on("transaction", handler);
    return () => {
      editor.off("selectionUpdate", handler);
      editor.off("transaction", handler);
    };
  }, [editor]);

  return hash;
}
