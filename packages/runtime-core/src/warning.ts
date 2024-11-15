import {
  callWithErrorHandling,
  ErrorCodes,
  ErrorTypeStrings,
} from './errorHandling'
import { VNode } from './vnode'

const stack: VNode[] = []

export function pushWarningContext(vnode: VNode) {
  stack.push(vnode)
}

export function popWarningContext() {
  stack.pop()
}

export function warn(msg: string) {
  const instance = stack.length ? stack[stack.length - 1].component : null
  const appWarnHandler = instance && instance.appContext.config.warnHandler

  if (appWarnHandler) {
    callWithErrorHandling(
      appWarnHandler,
      instance,
      ErrorCodes.APP_WARN_HANDLER,
      [],
    )
  }
  console.warn(`[Vue warn]: ${msg}`)
}
