import { Extension } from '@tiptap/core'

export type LineHeightOptions = {
  types: string[]
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    lineHeight: {
      setLineHeight: (height: string) => ReturnType
      unsetLineHeight: () => ReturnType
    }
  }
}

export const LineHeight = Extension.create<LineHeightOptions>({
  name: 'lineHeight',

  addOptions() {
    return {
      types: ['paragraph', 'heading'],
    }
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          lineHeight: {
            default: null,
            parseHTML: element => element.style.lineHeight || null,
            renderHTML: attributes => {
              if (!attributes.lineHeight) return {}
              return { style: `line-height: ${attributes.lineHeight}` }
            },
          },
        },
      },
    ]
  },

  addCommands() {
    return {
      setLineHeight:
        (height: string) =>
        ({ chain, editor }) => {
          const { $from } = editor.state.selection
          const nodeType = $from.parent.type.name
          if (!this.options.types.includes(nodeType)) return false

          return chain()
            .focus()
            .updateAttributes(nodeType, { lineHeight: height })
            .run()
        },
      unsetLineHeight:
        () =>
        ({ chain, editor }) => {
          const { $from } = editor.state.selection
          const nodeType = $from.parent.type.name
          if (!this.options.types.includes(nodeType)) return false

          return chain()
            .focus()
            .updateAttributes(nodeType, { lineHeight: null })
            .run()
        },
    }
  },
})
