module.exports = {
  extends: [
    'react-app',
    'react-app/jest'
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': 'warn', // 改为警告而不是错误
    'no-unused-vars': 'warn'
  }
}; 