import { Extension } from '@tiptap/core'

export type IndentOptions = {
  types: string[]
  maxLevel: number
  indentStep: number
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    indent: {
      indentMore: () => ReturnType
      indentLess: () => ReturnType
    }
  }
}

export const Indent = Extension.create<IndentOptions>({
  name: 'indent',

  addOptions() {
    return {
      types: ['paragraph', 'heading'],
      maxLevel: 4,
      indentStep: 20,
    }
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          indent: {
            default: 0,
            parseHTML: element => {
              const paddingLeft = element.style.paddingLeft
              if (!paddingLeft) return 0
              const match = paddingLeft.match(/(\d+)px/)
              return match ? Math.round(parseInt(match[1]) / this.options.indentStep) : 0
            },
            renderHTML: attributes => {
              const level = attributes.indent || 0
              if (level === 0) return {}
              return { style: `padding-left: ${level * this.options.indentStep}px` }
            },
          },
        },
      },
    ]
  },

  addCommands() {
    return {
      indentMore:
        () =>
        ({ chain, editor }) => {
          const { $from } = editor.state.selection
          const nodeType = $from.parent.type.name
          if (!this.options.types.includes(nodeType)) return false

          const currentLevel = $from.parent.attrs.indent || 0
          const newLevel = Math.min(currentLevel + 1, this.options.maxLevel)

          return chain()
            .focus()
            .updateAttributes(nodeType, { indent: newLevel })
            .run()
        },
      indentLess:
        () =>
        ({ chain, editor }) => {
          const { $from } = editor.state.selection
          const nodeType = $from.parent.type.name
          if (!this.options.types.includes(nodeType)) return false

          const currentLevel = $from.parent.attrs.indent || 0
          const newLevel = Math.max(currentLevel - 1, 0)

          return chain()
            .focus()
            .updateAttributes(nodeType, { indent: newLevel })
            .run()
        },
    }
  },
})
