import { visit } from 'unist-util-visit'
import type { Element, ElementContent, Node, Text } from 'hast'

type Raw = { type: 'raw'; value: string }

type ExtendedElementContent = ElementContent | Raw

type ExtendedElement = Omit<Element, 'children'> & {
  children: ExtendedElementContent[]
}

const blockTags = new Set([
  'p',
  'pre',
  'blockquote',
  'div',
  'ul',
  'ol',
  'li',
  'table',
  'section',
  'article'
])

function is_non_empty_text(node: Text | ExtendedElement): node is Text {
  return (
    node.type === 'text' &&
    typeof node.value === 'string' &&
    node.value.trim().length > 0
  )
}

export default function wrapLi() {
  return (tree: Node) => {
    visit(tree, 'element', (node: ExtendedElement) => {
      if (node.tagName === 'li' && Array.isArray(node.children)) {
        const newChildren: ExtendedElementContent[] = []
        let inlineGroup: ExtendedElementContent[] = []

        function flush(): void {
          const filtered = inlineGroup.filter(
            node => node.type !== 'text' || is_non_empty_text(node)
          )

          if (filtered.length > 0) {
            newChildren.push({
              type: 'element',
              tagName: 'p',
              properties: {},
              children: filtered
            } as ExtendedElementContent)
          }
          inlineGroup = []
        }

        for (const child of node.children) {
          if (
            (child.type === 'element' && blockTags.has(child.tagName)) ||
            child.type === 'raw'
          ) {
            flush()
            newChildren.push(child)
          } else {
            inlineGroup.push(child)
          }
        }

        flush()

        node.children = newChildren
      }
    })
  }
}
