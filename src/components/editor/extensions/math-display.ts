import { Node, mergeAttributes } from "@tiptap/core";
import katex from "katex";

export interface MathDisplayOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    mathDisplay: {
      setMathDisplay: (latex: string) => ReturnType;
    };
  }
}

export const MathDisplay = Node.create<MathDisplayOptions>({
  name: "mathDisplay",

  group: "block",
  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      latex: {
        default: "",
        parseHTML: (el) => el.getAttribute("data-latex") || "",
        renderHTML: (attrs) => ({
          "data-latex": attrs.latex,
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: `div[data-latex]` }];
  },

  renderHTML({ node, HTMLAttributes }) {
    const html = katex.renderToString(node.attrs.latex, {
      throwOnError: false,
      displayMode: true,
    });
    return [
      "div",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        "data-latex": node.attrs.latex,
        class: "math-display",
      }),
      html,
    ];
  },

  addCommands() {
    return {
      setMathDisplay:
        (latex: string) =>
        ({ chain }) =>
          chain().insertContent({ type: this.name, attrs: { latex } }).run(),
    };
  },
});
