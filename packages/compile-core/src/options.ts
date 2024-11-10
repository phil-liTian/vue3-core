import { NodeTransform } from './transform'

// 定义transtorm 的选项
export interface TransformOptions {
  nodeTransforms?: NodeTransform[]


  prefixIdentifiers?: boolean
}

// 定义generate 的选项
export interface CodegenOptions {
  /**
   * module模式 使用es模块化语法导出helpers
   * @default function
   */
  mode?: 'module' | 'function'

  /**
   * 是否添加 `with (this) { ... }`
   * mode为function是 默认不添加
   * @default mode === 'module'
   */
  prefixIdentifiers?: boolean

  /**
   * 可自定义导入helper的地方
   * @default vue
   */
  runtimeModuleName?: string

  /**
   * 可自定义导入全局变量的地方
   * @default Vue
   */
  runtimeGlobalName?: string

  /**
   * 是否优化导入
   * (用作webpack 代码分割)
   * @default false
   */
  optimizeImports?: boolean
}
