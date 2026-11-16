const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.sourceExts = [...config.resolver.sourceExts, "mjs", "cjs"];

// Package `exports` must stay ON: react-native 0.88+ (Expo SDK 58) imports its own
// internals (e.g. `react-native/asset-registry`, `react-native/react-private-interface`)
// through its exports map, so turning it off breaks every bundle.
//
// Firebase is the reason it used to be off: resolving @firebase/auth to its browser
// build (dist/esm) loses getReactNativePersistence and its fetch transport fails under
// Hermes (auth/network-request-failed on every call). Its exports map has a
// `react-native` condition that Expo enables on native, but pin the RN build here
// anyway so that regression can't come back silently.
const firebaseAuthRn = path.join(
  path.dirname(require.resolve('@firebase/auth/package.json')),
  'dist/rn/index.js',
);
const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === '@firebase/auth' && platform !== 'web') {
    return { type: 'sourceFile', filePath: firebaseAuthRn };
  }
  return (defaultResolveRequest ?? context.resolveRequest)(context, moduleName, platform);
};

module.exports = config;
