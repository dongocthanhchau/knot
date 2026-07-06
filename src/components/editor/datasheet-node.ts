import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { DataSheetView } from "./datasheet-view";

export const DataSheet = Node.create({
  name: "dataSheet",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      data: {
        default: [[""]],
        parseHTML: (el) =>
          JSON.parse(el.getAttribute("data-data") || '[[""]]'),
        renderHTML: (attrs) => ({
          "data-data": JSON.stringify(attrs.data),
        }),
      },
      rows: {
        default: 5,
        parseHTML: (el) => parseInt(el.getAttribute("data-rows") || "5"),
        renderHTML: (attrs) => ({ "data-rows": String(attrs.rows) }),
      },
      cols: {
        default: 4,
        parseHTML: (el) => parseInt(el.getAttribute("data-cols") || "4"),
        renderHTML: (attrs) => ({ "data-cols": String(attrs.cols) }),
      },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-type='datasheet']" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "datasheet" }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(DataSheetView);
  },
});
