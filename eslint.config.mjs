import js from '@eslint/js'
import eslintConfigPrettier from 'eslint-config-prettier'
import pluginReact from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import { defineConfig } from 'eslint/config'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default defineConfig([
  {
    ignores: [
      '.next/**',
      // Output of `npm run build:cloudflare` (opennextjs-cloudflare). It is
      // gitignored, but the CI now runs that build, and linting a bundler's
      // output is meaningless: the 11 errors it reports are all generated
      // code. Without this line, running `npm run lint` after a Cloudflare
      // build fails on files nobody wrote.
      '.open-next/**',
      // Estado que o `supabase start` escreve, incluindo um bootstrap Deno do
      // edge runtime (`start-secrets/.../main/index.ts`) com 187 erros de lint.
      // O .gitignore não basta: a config flat do ESLint não o lê.
      'supabase/.temp/**',
      'node_modules/**',
      'next-env.d.ts',
      'public/**',
      '*.tsbuildinfo',
    ],
  },
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    plugins: { js },
    extends: ['js/recommended'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },
  tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,
  pluginReact.configs.flat['jsx-runtime'],
  reactHooks.configs.flat.recommended,
  {
    settings: { react: { version: '19.2' } },
    rules: {
      // TypeScript already enforces prop shapes
      'react/prop-types': 'off',
      // New compiler-powered rules flag pre-existing patterns; keep visible
      // as warnings without blocking CI. rules-of-hooks stays an error.
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/immutability': 'warn',
      'no-empty': ['error', { allowEmptyCatch: true }],
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },
  eslintConfigPrettier,
])
