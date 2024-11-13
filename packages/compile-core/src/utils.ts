import {
  InterpolationNode,
  NodeTypes,
  TemplateChildNode,
  TextNode,
} from './ast'

export function isValidAssetId(
  name: string,
  type: 'component' | 'directive',
): string {
  // 将非数字、字符、下划线替换 如果是-替换成_, 否则将符号转换成对应的数字
  return `_${type}_${name.replace(/[^\w]/g, (searchValue, replaceValue) => {
    return searchValue === '-' ? '_' : name.charCodeAt(replaceValue).toString()
  })}`
}

// 不是数字或者 $ 或者 字母、数字、下划线 或者 \xA0-\uFFFF范围内的字符
const nonIdentifierRE = /^\d|[^\$\w\xA0-\uFFFF]/
export const isSimpleIdentifier = (name: string): boolean =>
  !nonIdentifierRE.test(name)

export function isText(
  node: TemplateChildNode,
): node is TextNode | InterpolationNode {
  return node.type === NodeTypes.TEXT || node.type === NodeTypes.INTERPOLATION
}
