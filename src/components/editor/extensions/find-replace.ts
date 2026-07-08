"use client";

import { Extension } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    findReplace: {
      findNext: (query: string) => ReturnType;
      findPrevious: (query: string) => ReturnType;
      replaceCurrent: (replacement: string) => ReturnType;
      replaceAll: (query: string, replacement: string) => ReturnType;
    };
  }
}

function findAllPositions(doc: import("@tiptap/pm/model").Node, query: string): { from: number; to: number }[] {
  const results: { from: number; to: number }[] = [];
  if (!query) return results;
  const lower = query.toLowerCase();
  doc.descendants((node, pos) => {
    if (!node.isText) return true;
    const text = node.text ?? "";
    let idx = 0;
    while (idx < text.length) {
      const found = text.toLowerCase().indexOf(lower, idx);
      if (found === -1) break;
      results.push({ from: pos + found, to: pos + found + query.length });
      idx = found + query.length;
    }
    return true;
  });
  return results;
}

export const FindReplace = Extension.create({
  name: "findReplace",

  addCommands() {
    return {
      findNext:
        (query: string) =>
        ({ editor }) => {
          if (!query) return false;
          const matches = findAllPositions(editor.state.doc, query);
          if (matches.length === 0) return false;

          const { from } = editor.state.selection;
          let next = matches.find((m) => m.from > from);
          if (!next) next = matches[0];

          editor
            .chain()
            .focus()
            .setTextSelection({ from: next.from, to: next.to })
            .scrollIntoView()
            .run();
          return true;
        },

      findPrevious:
        (query: string) =>
        ({ editor }) => {
          if (!query) return false;
          const matches = findAllPositions(editor.state.doc, query);
          if (matches.length === 0) return false;

          const { from } = editor.state.selection;
          let prev = [...matches].reverse().find((m) => m.to < from);
          if (!prev) prev = matches[matches.length - 1];

          editor
            .chain()
            .focus()
            .setTextSelection({ from: prev.from, to: prev.to })
            .scrollIntoView()
            .run();
          return true;
        },

      replaceCurrent:
        (replacement: string) =>
        ({ editor }) => {
          const { from, to, empty } = editor.state.selection;
          if (empty) return false;
          editor.chain().focus().insertContentAt({ from, to }, replacement).run();
          return true;
        },

      replaceAll:
        (query: string, replacement: string) =>
        ({ editor }) => {
          if (!query) return false;
          const matches = findAllPositions(editor.state.doc, query);
          if (matches.length === 0) return false;

          let offset = 0;
          for (const m of matches) {
            editor
              .chain()
              .focus()
              .insertContentAt(
                { from: m.from + offset, to: m.to + offset },
                replacement,
              )
              .run();
            offset += replacement.length - (m.to - m.from);
          }
          return true;
        },
    };
  },
});
