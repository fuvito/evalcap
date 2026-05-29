const mockGetAll = jest.fn()
const mockSet = jest.fn()
const mockCreateServerClient = jest.fn()

jest.mock('@supabase/ssr', () => ({
  createServerClient: (...args: unknown[]) => mockCreateServerClient(...args),
}))

jest.mock('next/headers', () => ({
  cookies: jest.fn().mockResolvedValue({
    getAll: (...args: unknown[]) => mockGetAll(...args),
    set: (...args: unknown[]) => mockSet(...args),
  }),
}))

import { createClient } from '@/lib/supabase/server'

beforeAll(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
})

afterAll(() => {
  delete process.env.NEXT_PUBLIC_SUPABASE_URL
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
})

afterEach(() => jest.clearAllMocks())

describe('createClient (server)', () => {
  it('calls createServerClient with env vars', async () => {
    mockCreateServerClient.mockReturnValue({})
    await createClient()
    expect(mockCreateServerClient).toHaveBeenCalledWith(
      'https://test.supabase.co',
      'test-anon-key',
      expect.objectContaining({ cookies: expect.any(Object) })
    )
  })

  it('getAll callback returns cookies from cookie store', async () => {
    mockGetAll.mockReturnValue([{ name: 'session', value: 'tok' }])
    let captured: { getAll: () => unknown } | undefined
    mockCreateServerClient.mockImplementation((_url, _key, opts) => {
      captured = opts.cookies
      return {}
    })
    await createClient()
    expect(captured!.getAll()).toEqual([{ name: 'session', value: 'tok' }])
  })

  it('setAll callback calls cookieStore.set for each cookie', async () => {
    let captured: { setAll: (c: unknown[]) => void } | undefined
    mockCreateServerClient.mockImplementation((_url, _key, opts) => {
      captured = opts.cookies
      return {}
    })
    await createClient()
    captured!.setAll([
      { name: 'a', value: '1', options: { httpOnly: true } },
      { name: 'b', value: '2', options: {} },
    ])
    expect(mockSet).toHaveBeenCalledWith('a', '1', { httpOnly: true })
    expect(mockSet).toHaveBeenCalledWith('b', '2', {})
  })

  it('setAll silently swallows errors from cookieStore.set', async () => {
    mockSet.mockImplementation(() => { throw new Error('read-only') })
    let captured: { setAll: (c: unknown[]) => void } | undefined
    mockCreateServerClient.mockImplementation((_url, _key, opts) => {
      captured = opts.cookies
      return {}
    })
    await createClient()
    expect(() => captured!.setAll([{ name: 'n', value: 'v', options: {} }])).not.toThrow()
  })
})
