import { ElementNode, Position } from './ast'

const defaultDelimitersOpen = new Uint8Array([123, 123]) // "{{"
const defaultDelimitersClose = new Uint8Array([125, 125]) // "}}"

export enum State {
  Text = 1,

  // interpolation
  InterpolationOpen,
  Interpolation,
  InterpolationClose,

  // tag
  BeforeTagName,
  InTagName,
  BeforeAttrName,
  BeforeClosingTagName,
  InClosingTagName,
  AfterClosingTagName,
}

export interface Callbacks {
  ontext: (start: number, end: number) => void
  oninterpolation: (start: number, end: number) => void
  onopentagname: (start: number, end: number) => void
  onopentagend: (end: number) => void
  onclosetag: (start: number, end: number) => void
}

export enum ParseMode {
  BASE,
}

export enum CharCodes {
  Lt = 0x3c, // '<'
  Gt = 0x3e, // '>'
  Slash = 0x2f, // '/'
  Dollar = 0x24, // '$'
  Amp = 0x26, // '&'
  Hash = 0x23, // '#'
  Space = 0x20, // ' '
  Tab = 0x09, // '\t'
  Newline = 0x0a, // '\n'
  CarriageReturn = 0x0d, // '\r'

  LowerA = 0x61, // 'a'
  LowerZ = 0x7a, // 'z'
  UpperA = 0x41, // 'A'
  UpperZ = 0x5a, // 'Z'
}

export default class Tokenizer {
  // 默认当文本处理
  public state: State = State.Text
  public mode: ParseMode = ParseMode.BASE
  private sectionStart = 0
  private buffer = ''
  private index = 0

  constructor(
    private readonly stack: ElementNode[],
    private readonly cbs: Callbacks,
  ) {}

  public reset() {
    this.index = 0
    this.buffer = ''
  }

  public getPos(index: number): Position {
    let line = 1
    let column = index + 1

    return {
      line,
      column,
      offset: index,
    }
  }

  // 循环遍历缓冲区，调用与当前状态相对应的函数。
  public parse(input: string): void {
    this.buffer = input

    while (this.index < this.buffer.length) {
      const c = this.buffer.charCodeAt(this.index)

      switch (this.state) {
        case State.Text: {
          this.stateText(c)
          break
        }

        case State.InterpolationOpen: {
          this.stateInterpolationOpen(c)
          break
        }

        case State.Interpolation: {
          this.stateInterpolation(c)
          break
        }

        case State.InterpolationClose: {
          this.stateIntrpolationClose(c)
          break
        }

        // 处理element
        case State.BeforeTagName: {
          this.stateBeforeTagName(c)
          break
        }

        case State.InTagName: {
          this.stateInTagName(c)
          break
        }

        case State.BeforeAttrName: {
          this.stateBeforeAttrName(c)
          break
        }

        case State.BeforeClosingTagName: {
          this.stateBeforeClosingTagName(c)
          break
        }

        case State.InClosingTagName: {
          this.stateInClosingTagName(c)
          break
        }
      }
      this.index++
    }

    // 剩下的部分由cleanup处理
    this.cleanup()
  }

  // 处理纯文本
  private stateText(c: number): void {
    // 处理分割符
    if (c === this.delimiterOpen[0]) {
      this.state = State.InterpolationOpen
      this.delimiterIndex = 0
      // 发现插值的第一个字符, 则开始处理分割符，当前第一次delimiterIndex不可能等于this.delimiterOpen.length - 1
      // 此时状态仍然是InterpolationOpen, 下一次执行时会匹配到第二个分割符，进入Interpolation状态
      this.stateInterpolationOpen(c)
    } else if (c === CharCodes.Lt) {
      if (this.index > this.sectionStart) {
        this.cbs.ontext(this.sectionStart, this.index)
      }
      // 处理element类型的元素
      this.state = State.BeforeTagName
      this.sectionStart = this.index
    }
  }

  // 处理分割符, 开始标志
  private stateInterpolationOpen(c: number): void {
    if (c === this.delimiterOpen[this.delimiterIndex]) {
      if (this.delimiterIndex === this.delimiterOpen.length - 1) {
        // {
        const start = this.index - this.delimiterOpen.length + 1
        // 第一次执行 this.sectionStart是0, start 是当前遍历到的位置 + 1 - 分割符的长度
        if (start > this.sectionStart) {
          this.cbs.ontext(this.sectionStart, start)
        }

        this.state = State.Interpolation
        this.sectionStart = start
      } else {
        this.delimiterIndex++
      }
    } else {
    }
  }

  // 处理分割符中间的内容
  private stateInterpolation(c: number) {
    if (c === this.delimiterClose[0]) {
      this.state = State.InterpolationClose
      this.delimiterIndex = 0
      this.stateIntrpolationClose(c)
    }
  }

  // 处理分割符，结束标志
  private stateIntrpolationClose(c: number): void {
    if (c === this.delimiterClose[this.delimiterIndex]) {
      if (this.delimiterIndex === this.delimiterClose.length - 1) {
        // {
        // const start = this.index - this.delimiterClose.length + 1
        // 第一次执行 this.sectionStart是0, start 是当前遍历到的位置 + 1 - 分割符的长度
        // if (start > this.sectionStart) {
        //   this.cbs.ontext(this.sectionStart, start)
        // }
        // 收集到插值中间的内容
        this.cbs.oninterpolation(this.sectionStart, this.index + 1)

        this.state = State.Text
        this.sectionStart = this.index + 1
      } else {
        this.delimiterIndex++
      }
    } else {
    }
  }

  public delimiterOpen: Uint8Array = defaultDelimitersOpen
  public delimiterClose: Uint8Array = defaultDelimitersClose
  private delimiterIndex = -1

  private stateBeforeTagName(c: number) {
    if (isTagStartChar(c)) {
      this.sectionStart = this.index++
      if (this.mode === ParseMode.BASE) {
        this.state = State.InTagName
      }
    } else if (c === CharCodes.Slash) {
      this.state = State.BeforeClosingTagName
    }
  }

  private stateInTagName(c: number) {
    if (isEndOfTagSetion(c)) {
      this.handleTagName(c)
    }
  }

  private handleTagName(c: number) {
    this.cbs.onopentagname(this.sectionStart, this.index)

    this.state = State.BeforeAttrName
    this.stateBeforeAttrName(c)
  }

  private stateBeforeAttrName(c: number) {
    if (c === CharCodes.Gt) {
      // 结束标签
      this.cbs.onopentagend(this.index)
      this.state = State.Text
      this.sectionStart = this.index + 1
    }
  }

  private stateBeforeClosingTagName(c: number) {
    this.state = State.InClosingTagName
    this.sectionStart = this.index
  }

  private stateInClosingTagName(c: number) {
    if (c === CharCodes.Gt) {
      // 结束标签
      this.cbs.onclosetag(this.sectionStart, this.index)
      // this.sectionStart = -1
      this.state = State.AfterClosingTagName
      this.stateAfterClosingTagName(c)
    }
  }

  private stateAfterClosingTagName(c: number) {
    if (c === CharCodes.Gt) {
      console.log(this.index + 1)
      // this.state = State.Text
      // this.sectionStart = this.index + 1
    }
  }

  private cleanup(): void {
    if (this.state === State.Text) {
      this.cbs.ontext(this.sectionStart, this.index)
    }
  }
}

function isTagStartChar(c: number): boolean {
  return (
    (c <= CharCodes.LowerZ && c >= CharCodes.LowerA) ||
    (c >= CharCodes.UpperA && c <= CharCodes.UpperZ)
  )
}

function isEndOfTagSetion(c: number): boolean {
  return c === CharCodes.Gt
}
