import type {Rule} from 'sanity'
import type {PortableTextBlock} from '@portabletext/types'

export const isBlockContentRequired = (Rule: Rule) =>
  Rule.custom((blocks?: PortableTextBlock[]) => {
    if (!blocks || blocks.length === 0) {
      return 'Поле обовʼязкове'
    }

    const hasText = blocks.some(
      (block) =>
        block._type === 'block' &&
        Array.isArray(block.children) &&
        block.children.some(
          (child) =>
            child._type === 'span' &&
            typeof child.text === 'string' &&
            child.text.trim().length > 0
        )
    )

    return hasText ? true : 'Поле обовʼязкове'
  })
