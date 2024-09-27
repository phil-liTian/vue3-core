import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    files: ['packages/**/*.ts'],
    extends: [tseslint.configs.base],
    rules: {
      "no-console": ["error", { allow: ["warn", "error", 'info'] }],
    }
  },
  {

  }
)
