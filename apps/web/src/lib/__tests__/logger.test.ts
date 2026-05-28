import { logger } from '../logger'

describe('logger', () => {
  let debugSpy: jest.SpyInstance
  let infoSpy: jest.SpyInstance
  let warnSpy: jest.SpyInstance
  let errorSpy: jest.SpyInstance
  const originalLogLevel = process.env.LOG_LEVEL
  const originalCategories = process.env.LOG_CATEGORIES

  beforeEach(() => {
    debugSpy = jest.spyOn(console, 'debug').mockImplementation(() => {})
    infoSpy = jest.spyOn(console, 'info').mockImplementation(() => {})
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
    process.env.LOG_LEVEL = originalLogLevel
    process.env.LOG_CATEGORIES = originalCategories
  })

  it('calls console.debug for debug()', () => {
    logger.debug('test debug')
    expect(debugSpy).toHaveBeenCalled()
  })

  it('calls console.info for info()', () => {
    logger.info('test info')
    expect(infoSpy).toHaveBeenCalled()
  })

  it('calls console.warn for warn()', () => {
    logger.warn('test warn')
    expect(warnSpy).toHaveBeenCalled()
  })

  it('calls console.error for error()', () => {
    logger.error('test error')
    expect(errorSpy).toHaveBeenCalled()
  })

  it('includes category in prefix when provided', () => {
    logger.info('msg', undefined, 'api')
    expect(infoSpy).toHaveBeenCalledWith(expect.stringContaining('[api]'), 'msg', '')
  })

  it('includes data when provided', () => {
    logger.info('msg', { count: 5 })
    expect(infoSpy).toHaveBeenCalledWith(expect.any(String), 'msg', { count: 5 })
  })

  it('passes empty string when data is undefined', () => {
    logger.warn('msg')
    expect(warnSpy).toHaveBeenCalledWith(expect.any(String), 'msg', '')
  })
})
