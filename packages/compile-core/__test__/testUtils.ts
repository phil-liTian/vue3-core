import { isArray, PatchFlagNames, PatchFlags, ShapeFlags } from '../../shared'
import {
  ElementNode,
  locStub,
  NameSpaces,
  NodeTypes,
  VNodeCall,
} from '../src/ast'

export function createElementWithCodegen(
  tag: VNodeCall['tag'],
  props: VNodeCall['props'],
  children?: VNodeCall['children'],
  patchFlag?: VNodeCall['patchFlag'],
): ElementNode {
  return {
    type: NodeTypes.ELEMENT,
    tag: 'div',
    props,
    children,
    loc: locStub,
    ns: NameSpaces.HTML,
    codegenNode: {
      type: NodeTypes.VNODE_CALL,
      patchFlag,
      tag,
      props,
      children,
    },
  }
}

type Flags = PatchFlags | ShapeFlags
export function genFlagText(
  flag: Flags | Flags[],
  names: { [k: number]: string } = PatchFlagNames,
): string {
  if (isArray(flag)) {
    let f = 0
    flag.forEach(ff => {
      f |= ff
    })
    return `${f} /* ${flag.map(f => names[f]).join(', ')} */`
  } else {
    return `${flag} /* ${names[flag]} */`
  }
}
