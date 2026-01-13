module.exports = function (api) {
  api.cache(true)
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './src',
            '@/lib': './src/lib',
            '@/hooks': './src/hooks',
            '@/components': './src/components',
            '@/theme': './src/theme',
          },
        },
      ],
    ],
  }
}
