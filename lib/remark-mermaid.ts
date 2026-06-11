import { visit } from 'unist-util-visit'
import type { Root } from 'mdast'

export function remarkMermaid() {
  return (tree: Root) => {
    visit(tree, 'code', (node, index, parent) => {
      if (node.lang !== 'mermaid' || index === undefined || !parent) return

      parent.children.splice(index, 1, {
        type: 'mdxJsxFlowElement',
        name: 'MermaidChart',
        attributes: [
          {
            type: 'mdxJsxAttribute',
            name: 'chart',
            value: node.value,
          },
        ],
        children: [],
      } as never)
    })
  }
}
