import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";

function getCellAttrs(this: { parent?: () => Record<string, any> }) {
  const parent = this.parent?.() ?? {};
  return {
    ...parent,
    verticalAlign: {
      default: null,
      parseHTML: (el: HTMLElement) => el.style.verticalAlign || null,
      renderHTML: (attrs: Record<string, any>) => {
        if (!attrs.verticalAlign) return {};
        return { style: `vertical-align: ${attrs.verticalAlign}` };
      },
    },
    borderColor: {
      default: null,
      parseHTML: (el: HTMLElement) => el.style.borderColor || null,
      renderHTML: (attrs: Record<string, any>) => {
        if (!attrs.borderColor) return {};
        return { style: `border-color: ${attrs.borderColor}` };
      },
    },
    borderStyle: {
      default: null,
      parseHTML: (el: HTMLElement) => el.style.borderStyle || null,
      renderHTML: (attrs: Record<string, any>) => {
        if (!attrs.borderStyle) return {};
        return { style: `border-style: ${attrs.borderStyle}` };
      },
    },
  };
}

export const CustomTableCell = TableCell.extend({
  addAttributes() {
    return getCellAttrs.call(this);
  },
});

export const CustomTableHeader = TableHeader.extend({
  addAttributes() {
    return getCellAttrs.call(this);
  },
});
