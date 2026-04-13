module.exports = {
  root: true,
  env: {
    node: true,
    commonjs: true,
    es2022: true,
    jest: true,
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 2022,
  },
  rules: {
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_|^next$|^req$|^res$', varsIgnorePattern: '^_' }],
    'no-console': 'off',
  },
};
