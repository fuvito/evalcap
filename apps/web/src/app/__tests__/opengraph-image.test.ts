jest.mock('next/og', () => ({
  ImageResponse: jest.fn(function (this: unknown, jsx: unknown, options: unknown) {
    return { jsx, options }
  }),
}))

import OgImage, { alt, size, contentType, runtime } from '@/app/opengraph-image'

describe('opengraph-image', () => {
  it('exports the correct metadata constants', () => {
    expect(alt).toBe('EvalCap – Performance Review Journaling')
    expect(size).toEqual({ width: 1200, height: 630 })
    expect(contentType).toBe('image/png')
    expect(runtime).toBe('edge')
  })

  it('returns an ImageResponse when called', () => {
    const result = OgImage()
    expect(result).toBeDefined()
  })
})
