const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const monorepoRoot = path.resolve(__dirname, '../..')
const config = getDefaultConfig(__dirname)

config.watchFolders = [monorepoRoot]

config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
]

// Packages that must always resolve to mobile's node_modules.
//
// Root cause: npm workspaces hoists @react-navigation/core (and react) to the
// monorepo root (React 18 lives there for apps/web). When @react-navigation/core
// imports "react" it walks up its own directory tree and finds root's React 18
// before Metro's nodeModulesPaths or extraNodeModules can intervene.
//
// resolveRequest fires first in Metro's pipeline. By faking the originModulePath
// to be inside apps/mobile, Metro's upward traversal finds React 19 in
// apps/mobile/node_modules/react instead of React 18 in the monorepo root.
// root/node_modules has React 18 (for apps/web) and react-dom 18 (hoisted).
// Web bundles resolve react-dom from there, creating a React 18 renderer +
// React 19 hooks mismatch. Force all of these to mobile's copies.
const FORCE_MOBILE = new Set([
  'react',
  'react/jsx-runtime',
  'react/jsx-dev-runtime',
  'react/compiler-runtime',
  'react-dom',
  'react-dom/client',
  'react-dom/server',
  'react-dom/server.browser',
  'react-dom/server.edge',
  'scheduler',
])

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (FORCE_MOBILE.has(moduleName)) {
    return context.resolveRequest(
      { ...context, originModulePath: path.join(__dirname, 'package.json') },
      moduleName,
      platform
    )
  }
  return context.resolveRequest(context, moduleName, platform)
}

config.resolver.alias = {
  '@': path.resolve(__dirname, 'src'),
}

module.exports = config
