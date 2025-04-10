module.exports = {
  root: true,
  extends: ['react-app'],
  rules: {
    // Disable rules that might be causing conflicts or are too strict for development
    'react/react-in-jsx-scope': 'off',
    'no-unused-vars': 'warn'
  }
}; 