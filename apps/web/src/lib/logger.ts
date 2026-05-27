type Level = 'debug' | 'info' | 'warn' | 'error'

const LEVELS: Record<Level, number> = { debug: 0, info: 1, warn: 2, error: 3 }

// LOG_LEVEL=debug|info|warn|error  (default: debug in dev, warn in prod)
// LOG_CATEGORIES=api,claude        (default: all)
const minLevel = (process.env.LOG_LEVEL as Level) ??
  (process.env.NODE_ENV === 'production' ? 'warn' : 'debug')

const allowedCategories = process.env.LOG_CATEGORIES
  ? new Set(process.env.LOG_CATEGORIES.split(',').map(s => s.trim()))
  : null

function enabled(level: Level, category?: string): boolean {
  if (LEVELS[level] < LEVELS[minLevel]) return false
  if (allowedCategories && category && !allowedCategories.has(category)) return false
  return true
}

function prefix(level: Level, category?: string): string {
  const cat = category ? ` [${category}]` : ''
  return `[${level.toUpperCase()}]${cat}`
}

export const logger = {
  debug(msg: string, data?: unknown, category?: string) {
    if (enabled('debug', category)) console.debug(prefix('debug', category), msg, data ?? '')
  },
  info(msg: string, data?: unknown, category?: string) {
    if (enabled('info', category)) console.info(prefix('info', category), msg, data ?? '')
  },
  warn(msg: string, data?: unknown, category?: string) {
    if (enabled('warn', category)) console.warn(prefix('warn', category), msg, data ?? '')
  },
  error(msg: string, error?: unknown, category?: string) {
    if (enabled('error', category)) console.error(prefix('error', category), msg, error ?? '')
  },
}
