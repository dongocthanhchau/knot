import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { FillableFieldView } from "./fillable-field-view";

export const FillableField = Node.create({
  name: "fillableField",
  group: "inline",
  inline: true,
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      kind: {
        default: "text",
        parseHTML: (el) => el.getAttribute("data-kind") || "text",
        renderHTML: (attrs) => ({ "data-kind": attrs.kind }),
      },
      placeholder: {
        default: "",
        parseHTML: (el) => el.getAttribute("placeholder") || "",
        renderHTML: (attrs) => ({ placeholder: attrs.placeholder }),
      },
      value: {
        default: "",
        parseHTML: (el) => el.getAttribute("data-value") || "",
        renderHTML: (attrs) => ({ "data-value": attrs.value }),
      },
    };
  },

  parseHTML() {
    return [{ tag: "span[data-type='fillable-field']" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes, { "data-type": "fillable-field" }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(FillableFieldView);
  },
});
