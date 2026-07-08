"use client";

import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import type { Node as PmNode } from "@tiptap/pm/model";
import { TextSelection } from "@tiptap/pm/state";
import type { Editor } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    tableOfContents: {
      insertTableOfContents: () => ReturnType;
    };
  }
}

interface TocEntry {
  level: number;
  text: string;
  id: string;
}

function buildToc(doc: import("@tiptap/pm/model").Node): TocEntry[] {
  const entries: TocEntry[] = [];
  doc.descendants((node: PmNode) => {
    if (node.type.name === "heading") {
      const text = node.textContent;
      const id = text.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "");
      entries.push({ level: node.attrs.level as number, text, id });
    }
    return true;
  });
  return entries;
}

function scrollToHeading(editor: Editor, text: string) {
  const { state, dispatch } = editor.view;
  let foundPos: number | null = null;
  state.doc.descendants((node: PmNode, pos: number) => {
    if (node.type.name === "heading" && node.textContent === text) {
      foundPos = pos;
      return false;
    }
    return true;
  });
  if (foundPos !== null) {
    const resolved = state.doc.resolve(foundPos + 1);
    dispatch(state.tr.setSelection(TextSelection.near(resolved)).scrollIntoView());
  }
}

function TocView({ editor, node }: { editor: Editor; node: PmNode }) {
  const entries: TocEntry[] = node.attrs.content ? JSON.parse(node.attrs.content) : [];
  return (
    <div className="table-of-contents" data-toc="">
      <h2>Table of Contents</h2>
      <div className="toc-body">
        {entries.length === 0 ? (
          <p>No headings found</p>
        ) : (
          <ul className="toc-list">
            {entries.map((e, i) => (
              <li
                key={i}
                className={`toc-item toc-level-${e.level}`}
                style={{ marginLeft: `${(e.level - 1) * 20}px`, cursor: "pointer" }}
                onClick={() => scrollToHeading(editor, e.text)}
              >
                {e.text}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export const TableOfContents = Node.create({
  name: "tableOfContents",

  group: "block",
  atom: true,

  addAttributes() {
    return {
      content: { default: "" },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-toc]" }];
  },

  renderHTML({ node }) {
    const entries: TocEntry[] = node.attrs.content ? JSON.parse(node.attrs.content) : [];
    return [
      "div",
      mergeAttributes({ "data-toc": "", class: "table-of-contents" }),
      ["h2", "Table of Contents"],
      ["div", { class: "toc-body" }, ...entries.map((e) => ["p", { class: `toc-item toc-level-${e.level}` }, e.text])],
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(TocView);
  },

  addCommands() {
    return {
      insertTableOfContents:
        () =>
        ({ editor }) => {
          const entries = buildToc(editor.state.doc);
          return editor
            .chain()
            .insertContent({
              type: this.name,
              attrs: { content: JSON.stringify(entries) },
            })
            .run();
        },
    };
  },
});
