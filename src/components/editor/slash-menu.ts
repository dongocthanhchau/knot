import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { ReactRenderer } from "@tiptap/react";
import tippy, { type Instance as TippyInstance } from "tippy.js";
import { SlashMenuView } from "./slash-menu-view";

export interface SlashMenuItem {
  title: string;
  description?: string;
  searchTerms?: string[];
  command: (props: {
    editor: any;
    range: { from: number; to: number };
  }) => void;
}

const items: SlashMenuItem[] = [
  {
    title: "Văn bản",
    description: "Đoạn văn bản thường",
    searchTerms: ["paragraph", "text"],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setParagraph().run();
    },
  },
  {
    title: "Heading 1",
    description: "Tiêu đề lớn",
    searchTerms: ["h1", "heading1", "title"],
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setHeading({ level: 1 })
        .run();
    },
  },
  {
    title: "Heading 2",
    description: "Tiêu đề vừa",
    searchTerms: ["h2", "heading2", "section"],
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setHeading({ level: 2 })
        .run();
    },
  },
  {
    title: "Heading 3",
    description: "Tiêu đề nhỏ",
    searchTerms: ["h3", "heading3", "subsection"],
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setHeading({ level: 3 })
        .run();
    },
  },
  {
    title: "Bảng dữ liệu",
    description: "Bảng tính với AG Grid",
    searchTerms: ["table", "datasheet", "sheet", "grid", "excel"],
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertContent({
          type: "dataSheet",
          attrs: {
            data: [
              ["", "", "", ""],
              ["", "", "", ""],
              ["", "", "", ""],
              ["", "", "", ""],
              ["", "", "", ""],
            ],
            rows: 5,
            cols: 4,
          },
        })
        .run();
    },
  },
  {
    title: "Hình ảnh",
    description: "Chèn hình ảnh",
    searchTerms: ["image", "img", "photo", "picture"],
    command: ({ editor, range }) => {
      const url = prompt("URL hình ảnh:");
      if (url) {
        editor.chain().focus().deleteRange(range).setImage({ src: url }).run();
      }
    },
  },
];

export const SlashMenu = Extension.create({
  name: "slashMenu",

  addProseMirrorPlugins() {
    const pluginKey = new PluginKey("slashMenu");
    const editor = this.editor;

    let component: ReactRenderer<{
      onKeyDown: (props: { event: KeyboardEvent }) => boolean;
    }> | null = null;
    let popup: TippyInstance | null = null;

    const close = () => {
      popup?.destroy();
      popup = null;
      component?.destroy();
      component = null;
    };

    return [
      new Plugin({
        key: pluginKey,
        props: {
          handleKeyDown(view, event) {
            // If popup is open, let component handle navigation
            if (popup && component?.ref) {
              const handled = component.ref.onKeyDown({ event });
              if (handled) return true;
              // Escape already handled, close on other keys
              close();
              return false;
            }

            // Only trigger on "/"
            if (event.key !== "/") return false;

            const { selection } = view.state;
            const { $from } = selection;
            const parent = $from.parent;

            // Only trigger in empty paragraph at start of line
            if (
              parent.type.name !== "paragraph" ||
              parent.textContent.length > 0 ||
              $from.parentOffset !== 0
            ) {
              return false;
            }

            // Let ProseMirror insert "/", then show popup
            requestAnimationFrame(() => {
              const pos = view.state.selection.$from.pos;

              component = new ReactRenderer(SlashMenuView, {
                props: {
                  items,
                  command: (selectedItem: SlashMenuItem) => {
                    const range = { from: pos - 1, to: pos };
                    selectedItem.command({ editor, range });
                    close();
                  },
                },
                editor,
              });

              if (component.element) {
                popup = tippy(document.body, {
                  getReferenceClientRect: () => {
                    const coords = view.coordsAtPos(pos);
                    return new DOMRect(coords.left, coords.bottom, 0, 0);
                  },
                  appendTo: () => document.body,
                  content: component.element,
                  showOnCreate: true,
                  interactive: true,
                  trigger: "manual",
                  placement: "bottom-start",
                });
              }
            });

            return false;
          },
        },
      }),
    ];
  },
});
