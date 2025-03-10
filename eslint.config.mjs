// eslint.config.mjs
import { Linter } from 'eslint'
import parser from '@typescript-eslint/parser'
import typescriptEslintPlugin from '@typescript-eslint/eslint-plugin'
import prettierPlugin from 'eslint-plugin-prettier'

/** @type {Linter.FlatConfig} */
const config = {
  files: ['**/*.ts', '**/*.js'], // Bao gồm tất cả các file .ts và .js
  languageOptions: {
    parser: parser
  },
  plugins: {
    '@typescript-eslint': typescriptEslintPlugin,
    prettier: prettierPlugin
  },
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': 'warning',
    'prettier/prettier': [
      'warn',
      {
        arrowParens: 'always',
        semi: false,
        trailingComma: 'none',
        tabWidth: 2,
        endOfLine: 'auto',
        useTabs: false,
        singleQuote: true,
        printWidth: 120,
        jsxSingleQuote: true
      }
    ]
  },
  ignores: ['node_modules/', 'dist/', 'coverage/']
}

export default config
