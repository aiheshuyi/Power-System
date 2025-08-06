module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          node: 'current',
        },
      },
    ],
    '@babel/preset-react',
    '@babel/preset-typescript',
  ],
  plugins: [
    '@babel/plugin-transform-class-properties',
    '@babel/plugin-transform-numeric-separator',
    '@babel/plugin-transform-nullish-coalescing-operator',
    '@babel/plugin-transform-private-methods',
    '@babel/plugin-transform-optional-chaining',
    '@babel/plugin-transform-private-property-in-object',
  ],
}; 