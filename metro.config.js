const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// NativeWind v4 requiere que el CSS global sea procesado por Metro
module.exports = withNativeWind(config, {
  input: './src/styles/global.css',
});
