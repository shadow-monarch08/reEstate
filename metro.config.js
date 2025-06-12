const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');

const {
  wrapWithReanimatedMetroConfig,
} = require('react-native-reanimated/metro-config');

const config = getDefaultConfig(__dirname)

module.exports = wrapWithReanimatedMetroConfig(config);
module.exports = withNativeWind(config, { input: './app/global.css' })