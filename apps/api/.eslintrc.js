module.exports = {
  extends: ['@learnhub/config/eslint'],
  parserOptions: {
    project: false,
  },
  rules: {
    '@typescript-eslint/no-explicit-any': 'warn',
  },
}
