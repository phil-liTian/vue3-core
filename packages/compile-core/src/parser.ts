import {
  createRoot,
  ElementNode,
  ElementTypes,
  NameSpaces,
  NodeTypes,
} from './ast'
import Tokenizer, { CharCodes } from './tokenizer'

let currentInput = ''
let currentRoot: any = []
let currentOpenTag: any

const stack: ElementNode[] = []

const tokenizer = new Tokenizer(stack, {
  // 处理text内容
  ontext(start, end) {
    onText(getSlice(start, end), start, end)
  },

  // 处理插值
  oninterpolation(start, end) {
    addNode({
      type: NodeTypes.INTERPOLATION,
    })
  },

  // 处理element
  onopentagname(start, end) {
    const name = getSlice(start, end)
    currentOpenTag = {
      type: NodeTypes.ELEMENT,
      tag: name,
      tagType: ElementTypes.ELEMENT,
      codegenNode: undefined,
      props: [],
      children: [],
      loc: getLoc(start - 1, end), // TODO
      ns: NameSpaces.HTML,
    }
  },

  // 结束标签
  onopentagend(end) {
    endOpenTag(end)
  },

  // 处理到结束标签的 >， 需要匹配end种的tag name是否跟栈顶的tag一致. 这里如果不一致是需要抛出异常的, 编译出错，代码无法运行
  onclosetag(start, end) {
    const name = getSlice(start, end)

    let found = false
    for (let i = 0; i < stack.length; i++) {
      const e = stack[i]

      if (e.tag.toLowerCase() === name.toLowerCase()) {
        found = true

        if (i > 0) {
          // 抛出异常
        }

        const el = stack.shift()

        // 开始标签和闭合标签相同, 更新当前el的loc和source
        onCloseTag(el, end)

        break
      }
    }

    if (!found) {
      // 抛出异常
    }
  },
})

function condenseWhitespace(nodes) {
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]
    if (node.type === NodeTypes.TEXT) {
    }
  }

  return nodes
}

function reset() {
  tokenizer.reset()
}

// 进行词法分析和语法分析
export function baseParse(input: string) {
  // 每次parse之前需要重置状态
  reset()
  currentInput = input
  const root = (currentRoot = createRoot([], input))

  tokenizer.parse(currentInput)

  return root
}

function onText(content, start, end) {
  const parent = stack[0] || currentRoot

  parent.children.push({
    type: NodeTypes.TEXT,
    content,
    loc: getLoc(start, end),
  })
}

// 添加节点
function addNode(node) {
  currentRoot.children.push(node)
}

function endOpenTag(end) {
  addNode(currentOpenTag)

  stack.unshift(currentOpenTag)
  currentOpenTag = null
}

function onCloseTag(el: ElementNode, end: number) {
  setLocEnd(el.loc, lookAhead(end, CharCodes.Gt) + 1)
}

function lookAhead(index, c) {
  let i = index
  while (currentInput.charCodeAt(i) !== c && i < currentInput.length - 1) i++
  return i
}

function getSlice(start: number, end?: number) {
  return currentInput.slice(start, end)
}

function getLoc(start: number, end: number) {
  return {
    start: tokenizer.getPos(start),
    end: tokenizer.getPos(end),
    source: getSlice(start, end),
  }
}

function setLocEnd(loc, end) {
  loc.end = tokenizer.getPos(end)
  loc.source = getSlice(loc.start.offset, end)
}
