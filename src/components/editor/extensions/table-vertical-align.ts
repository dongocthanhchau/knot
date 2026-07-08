"use client";

import { Extension } from "@tiptap/core";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";

export type VerticalAlign = "top" | "middle" | "bottom";

export const TableVerticalCell = TableCell.extend({
  addAttributes() {
    return {
      colspan: { default: 1 },
      rowspan: { default: 1 },
      colwidth: {
        default: null,
        parseHTML: element => {
          const colwidth = element.getAttribute("colwidth");
          return colwidth
            ? colwidth.split(",").map(w => parseInt(w, 10))
            : null;
        },
        renderHTML: attrs => {
          if (!attrs.colwidth) return {};
          return { colwidth: attrs.colwidth.join(",") };
        },
      },
      class: { default: "" },
    };
  },
});

export const TableVerticalHeader = TableHeader.extend({
  addAttributes() {
    return {
      colspan: { default: 1 },
      rowspan: { default: 1 },
      colwidth: {
        default: null,
        parseHTML: element => {
          const colwidth = element.getAttribute("colwidth");
          return colwidth
            ? colwidth.split(",").map(w => parseInt(w, 10))
            : null;
        },
        renderHTML: attrs => {
          if (!attrs.colwidth) return {};
          return { colwidth: attrs.colwidth.join(",") };
        },
      },
      class: { default: "" },
    };
  },
});

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    tableVerticalAlign: {
      setCellVerticalAlign: (val: VerticalAlign) => ReturnType;
    };
  }
}

export const TableVerticalAlign = Extension.create({
  name: "tableVerticalAlign",

  addCommands() {
    return {
      setCellVerticalAlign:
        (val: VerticalAlign) =>
        ({ editor }) => {
          let changed = false;

          if (editor.isActive("tableCell") || editor.isActive("tableHeader")) {
            const nodeType = editor.isActive("tableHeader") ? "tableHeader" : "tableCell";
            editor
              .chain()
              .focus()
              .updateAttributes(nodeType, {
                class: val === "top" ? "" : `valign-${val}`,
              })
              .run();
            changed = true;
          }

          return changed;
        },
    };
  },
});
