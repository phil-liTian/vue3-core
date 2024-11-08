import {
  EMPTY_ARR,
  EMPTY_OBJ,
  invokeArrayFns,
  isOn,
  isString,
  ShapeFlags,
} from '@vue/shared'
import { effect } from '@vue/reactivity'
import {
  ComponentInternalInstance,
  createComponentInstance,
  setupComponent,
} from './component'
import { createVNode, isSameVNodeType, VNode } from './vnode'
import { queueJob } from './scheduler'
import { createAppAPI } from './apiCreateApp'
import { h } from './h'

export interface RenderNode {
  [key: string | symbol]: any
}

export interface RenderElement extends RenderNode {}

type PatchFn = (
  n1: VNode | null,
  n2: VNode,
  container: RenderElement,
  anchor?: RenderNode | null,
  parentComponent?: ComponentInternalInstance | null,
) => void

export interface RendererOptions<
  HostNode = RenderNode,
  HostElement = RenderElement,
> {
  patchProp(el: HostElement, key: string, value: any): void
  insert(child: HostNode, parent: HostElement, anchor?: HostNode | null): void
  createElement(tag: string): HostElement
  setElementText: (el: HostElement, text: string) => void
  remove: (child: HostElement) => void
}

export function createRenderer(options: RendererOptions) {
  return baseCreateRenderer(options)
}

// 实现自定义渲染器
function baseCreateRenderer(options: RendererOptions) {
  const {
    insert: hostInsert,
    createElement: hostCreateElement,
    patchProp: hostPatchProp,
    setElementText: hostSetElementText,
    remove: hostRemove,
  } = options
  function render(vnode, container, parentComponent) {
    patch(null, vnode, container, null, parentComponent)
  }

  const patch: PatchFn = (
    n1,
    n2,
    container,
    anchor = null,
    parentComponent = null,
  ) => {
    if (n2.shapeFlag & ShapeFlags.ELEMENT) {
      processElement(n1, n2, container, anchor, parentComponent)
    } else {
      processComponent(n1, n2, container, anchor, parentComponent)
    }
  }

  function processComponent(
    n1: VNode | null,
    n2: VNode,
    container: RenderElement,
    anchor: RenderNode | null,
    parentComponent: ComponentInternalInstance | null,
  ) {
    if (n1 === null) {
      // 如果没有n1 说明是挂载组件
      mountComponent(n2, container, anchor, parentComponent)
    } else {
      // 如何更新component呢？？？
      updateComponent(n1, n2)
    }
  }

  function processElement(
    n1: VNode | null,
    vnode: VNode,
    container: RenderElement,
    anchor: RenderNode | null,
    parentComponent: ComponentInternalInstance | null,
  ) {
    if (n1 === null) {
      mountElement(vnode, container, anchor, parentComponent)
    } else {
      // 更新Element
      patchElement(n1, vnode, container, anchor, parentComponent)
    }
  }

  function mountElement(
    vnode: VNode,
    container: RenderElement,
    anchor: RenderNode | null,
    parentComponent: ComponentInternalInstance | null,
  ) {
    const el = (vnode.el = hostCreateElement(vnode.type as string))

    if (vnode.shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      // 注意这里的container 应该是el才对, 这样children中的元素才能正确的渲染到parentComponent中
      mountChildren(vnode.children, el, anchor, parentComponent)
    } else if (vnode.shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      hostSetElementText(el, vnode.children)
    }

    if (vnode.props) {
      for (const key in vnode.props) {
        const value = vnode.props[key]
        hostPatchProp(el, key, value)
      }
    }

    // container.appendChild(el)
    hostInsert(el, container, anchor)
  }

  // 如何更新element
  function patchElement(
    n1: VNode,
    n2: VNode,
    container: RenderElement,
    anchor: RenderNode | null,
    parentComponent: ComponentInternalInstance | null,
  ) {
    const el = (n2.el = n1.el)

    const oldProps = n1.props || EMPTY_OBJ
    const newProps = n2.props || EMPTY_OBJ

    // 更新element的props
    patchProps(el, oldProps, newProps)

    // 更新children 这里需分成四种情况处理
    // text -> text
    // array -> text
    // text -> array
    // array -> array 双端diff算法
    patchChildren(n1, n2, el, anchor, parentComponent)
  }

  function mountChildren(children, container, anchor, parentComponent) {
    children.forEach(child => {
      patch(null, child, container, anchor, parentComponent)
    })
  }

  function mountComponent(
    vnode: VNode,
    container: RenderElement,
    anchor: RenderNode | null,
    parentComponent: ComponentInternalInstance | null,
  ) {
    const instance = (vnode.component = createComponentInstance(
      vnode,
      parentComponent,
    ))

    setupComponent(instance)
    setupRenderEffect(instance, instance.vnode, container, anchor)
  }

  function updateComponent(n1: VNode, n2: VNode) {
    const instance = (n2.component = n1.component)
    instance!.update()
    instance!.next = n2
  }

  function setupRenderEffect(
    instance: ComponentInternalInstance,
    initialVNode: VNode,
    container: RenderElement,
    anchor: RenderNode | null,
  ) {
    const componentUpdateFn = () => {
      if (!instance.isMounted) {
        const { bm, m } = instance
        if (bm) {
          // 在组件渲染成真实dom之前执行, 即patch之前执行
          invokeArrayFns(bm)
        }

        let subTree = instance.render!.call(instance.proxy)
        // 当render函数直接返回一个字符串如何处理？？
        if (isString(subTree)) {
          subTree = h('div', null, subTree)
        }

        patch(null, subTree, container, anchor, instance)

        if (m) {
          // TODO 这里需要注意的是: mounted需要在scheduler运行结束之后执行
        }

        instance.isMounted = true
        instance.subTree = subTree
      } else {
        const { next, vnode } = instance

        // 组件更新逻辑
        if (next) {
          next.el = vnode.el
          updateComponentPreRender(instance, next)
        }

        const prevTree = instance.subTree || null
        const subTree = instance.render!.call(instance.proxy)

        patch(prevTree, subTree, container, anchor, instance)
        instance.subTree = subTree
        initialVNode.el = subTree.el
      }
    }

    instance.update = effect(componentUpdateFn, {
      scheduler: () => queueJob(instance.update),
    })
  }

  function updateComponentPreRender(instance, nextVNode) {
    // let prevProps = instance.vnode.props
    // prevProps = nextVNode.props
    instance.vnode = nextVNode
    instance.next = null
    instance.props = nextVNode.props
  }

  // 处理props
  const patchProps = (el, oldProps, newProps) => {
    // 如果在新的props里面有, 在oldProps中没有 则添加
    if (oldProps !== newProps) {
      for (const key in newProps) {
        const newValue = newProps[key]

        if (newValue !== oldProps[key]) {
          hostPatchProp(el, key, newValue)
        }

        if (newValue === undefined || newValue === null) {
          hostPatchProp(el, key, null)
        }
      }

      // 如果在新的props中没有 在oldProps中有 则删除(或者新的props中将值设置为undefined ｜ null)
      for (const key in oldProps) {
        if (!(key in newProps)) {
          hostPatchProp(el, key, null)
        }
      }
    }
  }

  // 处理children
  const patchChildren = (n1, n2, container, anchor, parentComponent) => {
    const c1 = n1 && n1.children
    const c2 = n2 && n2.children

    if (n2.shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // Text Children
      if (n1.shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // Array Children
        // 卸载n1的children
        unmountChildren(c1)
      }
      // Text or Array Children 都需要重新渲染container中的值
      if (c1 !== c2) {
        hostSetElementText(container, c2)
      }
    } else {
      // Array To Text
      if (n1.shapeFlag & ShapeFlags.TEXT_CHILDREN) {
        hostSetElementText(container, '')
        mountChildren(c2, container, anchor, parentComponent)
      } else {
        // 双端diff算法
        patchKeyedChildren(c1, c2, container, parentComponent)
      }
    }
  }

  /**
   * 1. 添加moved标识, 如果newIndex的顺序不是递增的，说明children的顺序发生变化了, 才是需要移动的
   * 2. 计算newIndexToOldIndexMap时使用keyToNewIndexMap数据结构，优化时间复杂度 从O(n^2) => O(n)
   * 3. tobePatched标识需要patch的总数量, 如果tobePatched > patched, 剩下的元素都是需要删除的, 不需要再比较了
   * 4. 获取最长递增子序列。
   * 5. 移动元素时 如果j < 0, 则说明剩余的children都是需要move的
   */

  const patchKeyedChildren = (c1, c2, container, parentComponent) => {
    let i = 0
    let e1 = c1.length - 1
    let e2 = c2.length - 1

    // 1. 左侧
    // ab c
    // ab de
    while (i <= e1 && i <= e2) {
      const n1 = c1[i]
      const n2 = c2[i]
      if (isSameVNodeType(n1, n2)) {
        // 相同
        patch(n1, n2, container, null, parentComponent)
      } else {
        break
      }
      i++
    }

    // 2. 右侧
    //  a bc
    // de bc
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1]
      const n2 = c2[e2]
      if (isSameVNodeType(n1, n2)) {
        // 相同
        patch(n1, n2, container, null, parentComponent)
      } else {
        break
      }
      e1--
      e2--
    }

    // 3. c1比较完了, c2没比较完, c2中剩下的元素应该新建
    // ab
    // ab c
    // i = 2 e1 = 1 e2 = 2

    //  ab
    // cab
    // i = 0 e1 = -1 e2 = 0
    if (i > e1) {
      while (i <= e2) {
        // 如何向前面插入一个元素呢？
        // 当前比较的e2下标的后一个位置之前插入(从后往前插入)
        const nextPos = e2 + 1
        const anchor = nextPos < c2.length ? c2[nextPos].el : null
        patch(null, c2[i], container, anchor, parentComponent)
        i++
      }
    } else if (i > e2) {
      // 4. c2比较完了, c1没比较完, c1中剩下的元素应该删除
      // ab c
      // ab
      // i = 2 e1 = 2 e2 = 1

      // a bc
      //   bc
      // i = 0 e1 = 0 e2 = -1

      while (i <= e1) {
        unmount(c1[i])
        i++
      }
    } else {
      // 此处可定位到中间乱序的地方
      // ab cde fg
      // ab edch fg
      // i = 2 e1 = 4 e2 = 5
      const s1 = i
      const s2 = i
      // 记录key跟index说的映射关系
      const keyToNewIndexMap: Map<PropertyKey, number> = new Map()
      for (let i = s2; i <= e2; i++) {
        const nextChild = c2[i]
        if (nextChild.key != undefined) {
          keyToNewIndexMap.set(nextChild.key, i)
        }
      }

      let patched = 0
      let moved = false // 标志是否需要移动
      let maxNewIndexSoFar = 0
      const toBePatched = e2 - i + 1 // 需要patch的节点数 4
      // 记录新的节点在旧节点中的位置 [5, 4, 3, 0]
      const newIndexToOldIndexMap = new Array(toBePatched).fill(0)

      // 时间复杂度o(n^2)
      // for (let i = s2; i <= e2; i++) {
      //   for (let j = s1; j <= e1; j++) {
      //     if (isSameVNodeType(c1[j], c2[i])) {
      //       // 相同
      //       patch(c1[j], c2[i], container, null, parentComponent)
      //       patched++
      //       newIndexToOldIndexMap[i - s2] = j + 1
      //       break
      //     }
      //   }
      // }

      // 优化 时间复杂度(o(n))
      for (let i = s1; i <= e1; i++) {
        const prevChild = c1[i]
        if (toBePatched > patched) {
          unmount(prevChild)
          continue
        }
        let newIndex
        if (prevChild.key != null) {
          newIndex = keyToNewIndexMap.get(prevChild.key)
        }

        if (newIndex) {
          // 有相同元素
          newIndexToOldIndexMap[newIndex - s2] = i + 1
          // 如果 newIndex时顺序增加的 则无需移动
          if (newIndex < maxNewIndexSoFar) {
            moved = true
          } else {
            maxNewIndexSoFar = newIndex
          }

          patch(c1[i], c2[newIndex], container, null, parentComponent)
          patched++
        } else {
          // 不存在相同的元素 则删除
          unmount(prevChild)
        }
      }

      const increasingNewIndexSequence = moved
        ? getSequence(newIndexToOldIndexMap)
        : EMPTY_ARR
      let j = increasingNewIndexSequence.length - 1

      for (i = toBePatched - 1; i >= 0; i--) {
        // 倒序遍历 3、2、1、0
        const nextIndex = s2 + i
        const nextChild = c2[nextIndex] as VNode
        const anchor = nextIndex + 1 < c2.length ? c2[nextIndex + 1].el : null
        if (newIndexToOldIndexMap[i] === 0) {
          // 新增
          patch(null, nextChild, container, anchor, parentComponent)
        } else if (moved) {
          // 最长递增子序列是[2], j小于0, increasingNewIndexSequence[j]永远都是undefined,不会匹配到此处也是优化的一个点
          if (j < 0 || i !== increasingNewIndexSequence[j]) {
            move(nextChild, container, anchor)
          } else {
            j--
          }
        }
      }
    }
  }

  // 移动元素
  const move = (vnode, container, anchor) => {
    const { el } = vnode
    hostInsert(el, container, anchor)
  }

  // 卸载children
  const unmountChildren = children => {
    for (let i = 0; i < children.length; i++) {
      unmount(children[i])
    }
  }

  const unmount = vnode => {
    hostRemove(vnode.el)
  }

  return {
    render,
    createApp: createAppAPI(render),

    // rooterComponent => {
    //   return {
    //     mount: container => {
    //       const vnode = createVNode(rooterComponent)
    //       render(vnode, container, null)
    //     },
    //   }
    // },
  }
}

// 获取最长递增子序列
function getSequence(arr: number[]): number[] {
  const p = arr.slice()
  const result = [0]
  let i, j, u, v, c
  const len = arr.length
  for (i = 0; i < len; i++) {
    const arrI = arr[i]
    if (arrI !== 0) {
      j = result[result.length - 1]
      if (arr[j] < arrI) {
        p[i] = j
        result.push(i)
        continue
      }
      u = 0
      v = result.length - 1
      while (u < v) {
        c = (u + v) >> 1
        if (arr[result[c]] < arrI) {
          u = c + 1
        } else {
          v = c
        }
      }
      if (arrI < arr[result[u]]) {
        if (u > 0) {
          p[i] = result[u - 1]
        }
        result[u] = i
      }
    }
  }
  u = result.length
  v = result[u - 1]
  while (u-- > 0) {
    result[u] = v
    v = p[v]
  }
  return result
}
