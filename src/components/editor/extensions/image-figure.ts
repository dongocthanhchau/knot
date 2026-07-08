import { Node, mergeAttributes } from "@tiptap/core";

export interface ImageFigureOptions {
  HTMLAttributes: Record<string, unknown>;
  allowBase64: boolean;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    imageFigure: {
      setImageFigure: (attrs: { src: string; alt?: string; caption?: string; width?: string }) => ReturnType;
    };
  }
}

export const ImageFigure = Node.create<ImageFigureOptions>({
  name: "imageFigure",

  group: "block",
  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {},
      allowBase64: true,
    };
  },

  addAttributes() {
    return {
      src: { default: null },
      alt: { default: "" },
      caption: { default: "" },
      width: { default: "" },
    };
  },

  parseHTML() {
    return [
      {
        tag: "figure[data-image-figure]",
        getAttrs: (el) => {
          if (typeof el === "string") return {};
          const img = el.querySelector("img");
          const figcap = el.querySelector("figcaption");
          return {
            src: img?.getAttribute("src") || "",
            alt: img?.getAttribute("alt") || "",
            caption: figcap?.textContent || "",
            width: img?.getAttribute("width") || "",
          };
        },
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const widthVal = node.attrs.width || "";
    const children: any[] = [
      [
        "img",
        {
          src: node.attrs.src,
          alt: node.attrs.alt,
          ...(widthVal ? { width: widthVal, style: `max-width:${widthVal}` } : {}),
          class: "resizable-img",
          draggable: "true",
        },
      ],
    ];
    children.push(["figcaption", { contenteditable: "false" }, node.attrs.caption || "Add caption\u2026"]);
    return [
      "figure",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        "data-image-figure": "",
        class: "image-figure",
      }),
      ...children,
    ];
  },

  addCommands() {
    return {
      setImageFigure:
        (attrs) =>
        ({ chain }) =>
          chain().insertContent({ type: this.name, attrs }).run(),
    };
  },
});
