import { camelize, capitalize, isString } from '@vue/shared'
import { currentInstance, getComponentName } from '../component'
const COMPONENTS = 'components'
const DIRECTIVES = 'directives'

export type AssetTypes = typeof COMPONENTS | typeof DIRECTIVES
export function resolveComponent(name: string): any {
  if (isString(name)) {
    return resolveAssets(COMPONENTS, name)
  }
}

function resolveAssets(type: AssetTypes, name: string) {
  const instance = currentInstance

  if (instance) {
    const Component = instance.type
    const selfName = getComponentName(Component)
    // console.log('selfName', selfName)

    if (selfName) {
      return Component
    }

    // 先匹配组件内部定义的components, 再匹配appContext上面的components
    const res = resolve(instance[type] || Component[type], name) || resolve(instance.appContext[type], name)
    
    return res
  }
}

function resolve(registry: Record<string, any> | undefined, name: string) {
  return (
    registry &&
    (registry[name] ||
      registry[camelize(name)] ||
      registry[capitalize(camelize(name))])
  )
}
