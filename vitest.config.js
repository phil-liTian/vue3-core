import { defineConfig } from "vitest/config";

export default defineConfig({
  define: {
    __DEV__: true,
    __VERSION__: '"test"'
  },

  test: {
    globals: true,
    // 添加一个配置文件，用于在测试开始前执行一些初始化操作
    setupFiles: 'scripts/setup-vitest.ts',
    _coverage: {
      include: ['packages/*/src/**']
    },
    get coverage() {
      return this._coverage;
    },
    set coverage(value) {
      this._coverage = value;
    },
  }
})
