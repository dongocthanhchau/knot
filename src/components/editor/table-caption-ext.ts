import { Table, TableView, createColGroup } from "@tiptap/extension-table";
import type { DOMOutputSpec, Node as ProseMirrorNode } from "@tiptap/pm/model";
import type { EditorView } from "@tiptap/pm/view";
import { mergeAttributes, type CommandProps } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    customTable: {
      setTableCaption: (caption: string) => ReturnType;
    };
  }
}

/**
 * Custom TableView that extends @tiptap/extension-table's TableView
 * with caption rendering support.
 *
 * A `<caption>` element is always rendered (even when empty).
 * It is contentEditable — the user can click and type directly.
 * On blur, the text is synced back to the node's caption attribute.
 */
class TableViewWithCaption extends TableView {
  captionEl: HTMLTableCaptionElement | null = null;
  view?: EditorView;

  constructor(
    node: ProseMirrorNode,
    cellMinWidth: number,
    view?: EditorView,
    HTMLAttributes: Record<string, any> = {},
  ) {
    super(node, cellMinWidth, view, HTMLAttributes);
    this.view = view;

    this.addCaption(node.attrs.caption || "");
  }

  private addCaption(text: string): void {
    this.captionEl = document.createElement("caption");

    const input = document.createElement("input");
    input.type = "text";
    input.value = text;
    input.className = "table-caption-input";
    input.placeholder = "Caption";
    input.spellcheck = false;
    input.addEventListener("mousedown", (e: MouseEvent) => {
      e.stopPropagation();
    });
    input.addEventListener("blur", () => {
      const newText = input.value;
      this.syncCaption(newText);
    });
    input.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        input.blur();
      }
    });

    this.captionEl.appendChild(input);
    this.table.insertBefore(this.captionEl, this.colgroup);
  }

  private syncCaption(text: string): void {
    if (!this.view) return;

    const pos = this.findPos();
    if (pos === undefined) return;

    const node = this.view.state.doc.nodeAt(pos);
    if (node && node.attrs.caption !== text) {
      const newAttrs = { ...node.attrs, caption: text };
      const newNode = node.type.create(newAttrs, node.content, node.marks);
      this.view.dispatch(
        this.view.state.tr.replaceWith(pos, pos + node.nodeSize, newNode),
      );
    }
  }

  private findPos(): number | undefined {
    let foundPos: number | undefined;
    this.view!.state.doc.descendants((node, pos) => {
      if (foundPos !== undefined) return false;
      if (node === this.node) {
        foundPos = pos;
        return false;
      }
      if (node.isInline) return false;
      return true;
    });
    return foundPos;
  }

  update(node: ProseMirrorNode): boolean {
    const isSameType = super.update(node);
    if (!isSameType) return false;

    const caption = (node.attrs.caption as string) || "";
    const input = this.captionEl?.querySelector("input");
    if (input && document.activeElement !== input && input.value !== caption) {
      input.value = caption;
    }

    return true;
  }
}

/**
 * CustomTable extends @tiptap/extension-table with:
 * - `caption` attribute on the table node (default "")
 * - `setTableCaption` command to update the caption programmatically
 * - Custom NodeView (TableViewWithCaption) that renders contentEditable `<caption>`
 *
 * The View option is consumed by both addNodeView() (non-resizable) and
 * the columnResizing plugin (resizable), so caption works in both modes.
 */
export const CustomTable = Table.extend({
  addOptions() {
    return {
      ...(this.parent?.() ?? {
        HTMLAttributes: {},
        resizable: false,
        renderWrapper: false,
        handleWidth: 5,
        cellMinWidth: 25,
        View: TableView,
        lastColumnResizable: true,
        allowTableNodeSelection: false,
      }),
      View: TableViewWithCaption,
    };
  },

  renderHTML({ node, HTMLAttributes }) {
    const { colgroup, tableWidth, tableMinWidth } = createColGroup(
      node,
      this.options.cellMinWidth,
    );

    const userStyles = HTMLAttributes.style as string | undefined;

    const getTableStyle = () => {
      if (userStyles) return userStyles;
      return tableWidth ? `width: ${tableWidth}` : `min-width: ${tableMinWidth}`;
    };

    const table: DOMOutputSpec = [
      "table",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        style: getTableStyle(),
        "data-caption": node.attrs.caption || null,
      }),
      colgroup,
      ["tbody", 0],
    ];

    return this.options.renderWrapper
      ? (["div", { class: "tableWrapper" }, table] as DOMOutputSpec)
      : table;
  },

  addAttributes() {
    return {
      ...(this.parent?.() ?? {}),
      caption: {
        default: "",
        parseHTML: (el: HTMLElement) => {
          return (
            el.getAttribute("data-caption") ||
            el.querySelector("caption")?.textContent?.trim() ||
            ""
          );
        },
        renderHTML: () => {
          return {};
        },
      },
    };
  },

  addCommands() {
    return {
      ...(this.parent?.() ?? {}),
      setTableCaption:
        (caption: string) =>
        ({ tr, dispatch }: CommandProps) => {
          const { $from } = tr.selection;

          for (let d = $from.depth; d >= 0; d--) {
            const node = $from.node(d);
            if (node.type.name === "table") {
              if (!dispatch) return true;
              const pos = $from.before(d);
              const newAttrs = { ...node.attrs, caption };
              const newTable = node.type.create(
                newAttrs,
                node.content,
                node.marks,
              );
              dispatch(tr.replaceWith(pos, pos + node.nodeSize, newTable));
              return true;
            }
          }
          return false;
        },
    };
  },
});
