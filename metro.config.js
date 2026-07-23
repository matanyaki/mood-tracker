const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.sourceExts = [...config.resolver.sourceExts, "mjs", "cjs"];

// Expo SDK 53+ enables package exports by default. Firebase's `exports` map then
// resolves @firebase/auth to dist/esm (the browser build), which lacks
// getReactNativePersistence and whose fetch transport fails under Hermes —
// surfacing as auth/network-request-failed on every call.
// Disabling this falls back to resolverMainFields (react-native, browser, main),
// which correctly picks @firebase/auth's dist/rn build.
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
