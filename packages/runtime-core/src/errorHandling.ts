import { EMPTY_OBJ } from '@vue/shared'
import { ComponentInternalInstance } from '.'
import { AppConfig } from './apiCreateApp'
export enum ErrorCodes {
  RENDER_FUNCTION,
  APP_WARN_HANDLER,
}

export type ErrorTypes = ErrorCodes

export const ErrorTypeStrings: Record<ErrorTypes, string> = {
  [ErrorCodes.RENDER_FUNCTION]: 'render function',
  [ErrorCodes.APP_WARN_HANDLER]: 'app warnHandler',
}

export function callWithErrorHandling(
  fn: Function,
  instance: ComponentInternalInstance | null | undefined,
  type: ErrorTypes,
  args?: unknown[],
) {
  try {
    return args ? fn(...(args as any)) : fn()
  } catch (err) {
    // rethrow to let the caller handle the error
    handleError(err, instance, type)
  }
}

export function handleError(
  err: unknown,
  instance: ComponentInternalInstance | null | undefined,
  type: ErrorTypes,
  throwInDev = true,
): void {
  const { errorHandler } = (instance && instance.appContext.config) as AppConfig

  if (instance) {
    if (errorHandler) {
      // errorHandler(err, instance, type)
      callWithErrorHandling(errorHandler, null, type, [err, instance, type])
      return
    }
  }

  logError(err, type)
}

function logError(err: unknown, type: ErrorTypes) {
  // add full mount trace for meta-info
  if (__DEV__) {
    console.error(`${type} error:`, err)
  }
}
