const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const monorepoRoot = path.resolve(__dirname, '../..')
const config = getDefaultConfig(__dirname)

// Watch monorepo root so shared packages resolve correctly
config.watchFolders = [monorepoRoot]

// Resolve @/* to src/* (mirrors tsconfig paths)
config.resolver.alias = {
  '@': path.resolve(__dirname, 'src'),
}

module.exports = config
