// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);
const defaultResolveRequest = config.resolver?.resolveRequest;

// Redirect native-only modules to web-safe stubs when bundling for web.
const WEB_STUBS = {
  'react-native-purchases': path.resolve(__dirname, 'mocks/react-native-purchases.web.js'),
  'react-native/Libraries/Core/InitializeCore': path.resolve(
    __dirname,
    'mocks/react-native-initialize-core.web.js'
  ),
};

config.resolver = {
  ...config.resolver,
  resolveRequest: (context, moduleName, platform) => {
    if (platform === 'web' && WEB_STUBS[moduleName]) {
      return { filePath: WEB_STUBS[moduleName], type: 'sourceFile' };
    }

    if (typeof defaultResolveRequest === 'function') {
      return defaultResolveRequest(context, moduleName, platform);
    }

    return context.resolveRequest(context, moduleName, platform);
  },
};

// Increase timeout for slower connections/devices
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      // Increase timeout to 5 minutes
      res.setTimeout(300000);
      return middleware(req, res, next);
    };
  },
};

module.exports = config;
