import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';

export default tseslint.config(
  {
    ignores: ['dist/**'],
  },
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
        ecmaVersion: 2020,
        sourceType: 'module',
      },
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      // Disallow accidental any
      '@typescript-eslint/no-explicit-any': 'error',

      // React hooks
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // React refresh (Vite fast refresh)
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],

      // No console in production
      'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
    },
  },
  {
    files: ['src/router/**/*.{ts,tsx}'],
    rules: {
      // Router file mixes components and non-component exports; safe to disable here
      'react-refresh/only-export-components': 'off',
    },
  },
);

