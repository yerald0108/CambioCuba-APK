module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      // NativeWind v4: jsxImportSource es suficiente, no necesita plugin separado
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
    ],
  };
};
