import { Node, mergeAttributes } from "@tiptap/core";
import katex from "katex";

export interface MathInlineOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    mathInline: {
      setMathInline: (latex: string) => ReturnType;
    };
  }
}

export const MathInline = Node.create<MathInlineOptions>({
  name: "mathInline",

  group: "inline",
  inline: true,
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
    return [{ tag: `span[data-latex]` }];
  },

  renderHTML({ node, HTMLAttributes }) {
    const html = katex.renderToString(node.attrs.latex, {
      throwOnError: false,
      displayMode: false,
    });
    return [
      "span",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        "data-latex": node.attrs.latex,
        class: "math-inline",
      }),
      html,
    ];
  },

  addCommands() {
    return {
      setMathInline:
        (latex: string) =>
        ({ chain }) =>
          chain().insertContent({ type: this.name, attrs: { latex } }).run(),
    };
  },
});
