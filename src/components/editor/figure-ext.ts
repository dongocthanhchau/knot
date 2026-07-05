import { Node, mergeAttributes, type CommandProps } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    figure: {
      addFigure: () => ReturnType;
    };
  }
}

/**
 * Figure node: wraps an image with a figcaption.
 * Content schema: "image figcaption?" (optional for backward compat).
 *
 * New images are always inserted inside a figure with an empty figcaption.
 * There is no "remove caption" command — caption is always present.
 */
export const Figure = Node.create({
  name: "figure",

  group: "block",

  content: "image figcaption?",

  isolating: true,
  defining: true,

  parseHTML() {
    return [{ tag: "figure" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["figure", mergeAttributes(HTMLAttributes), 0];
  },

  addCommands() {
    return {
      /**
       * Wrap the selected image in a figure with an empty figcaption.
       * If already in a figure → no-op.
       */
      addFigure:
        () =>
        ({ editor, state, dispatch, tr }: CommandProps) => {
          const { selection, doc } = state;
          const { $from } = selection;

          // Already inside a figure → no-op
          for (let d = $from.depth; d >= 0; d--) {
            if ($from.node(d).type.name === "figure") return false;
          }

          // Check if on an image node
          const onImage =
            editor.isActive("image") ||
            doc.nodeAt(selection.from)?.type.name === "image";
          if (onImage && dispatch) {
            const imagePos = selection.from;
            const imageNode = doc.nodeAt(imagePos);
            if (imageNode && imageNode.type.name === "image") {
              const { figcaption, figure } = state.schema.nodes;
              const figureNode = figure.create(
                {},
                [imageNode, figcaption.create({})],
              );
              tr.replaceWith(imagePos, imagePos + imageNode.nodeSize, figureNode);
              dispatch(tr);
              return true;
            }
          }

          return false;
        },
    };
  },
});

/**
 * FigCaption node: editable caption text inside a figure.
 * Content schema: "inline*"
 */
export const FigCaption = Node.create({
  name: "figcaption",

  group: "block",

  content: "inline*",

  isolating: true,
  defining: true,

  parseHTML() {
    return [{ tag: "figcaption" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["figcaption", mergeAttributes(HTMLAttributes), 0];
  },
});
