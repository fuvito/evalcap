import { NextRequest } from 'next/server'
import { GET } from '../callback/route'

const mockExchangeCodeForSession = jest.fn()
const mockCreateServerClient = jest.fn()
const mockCookiesSet = jest.fn()

jest.mock('@supabase/ssr', () => ({
  createServerClient: (...args: unknown[]) => mockCreateServerClient(...args),
}))

jest.mock('next/headers', () => ({
  cookies: jest.fn().mockResolvedValue({
    getAll: jest.fn().mockReturnValue([]),
    set: (...args: unknown[]) => mockCookiesSet(...args),
  }),
}))

function makeSupabaseClient() {
  return {
    auth: {
      exchangeCodeForSession: (...args: unknown[]) => mockExchangeCodeForSession(...args),
    },
  }
}

beforeEach(() => {
  mockCreateServerClient.mockImplementation(() => makeSupabaseClient())
})

afterEach(() => jest.clearAllMocks())

describe('GET /auth/callback', () => {
  it('redirects to login error when no code param', async () => {
    const req = new NextRequest('http://localhost/auth/callback')
    const res = await GET(req)
    expect(res.headers.get('location')).toContain('/auth/login?error=')
    expect(mockExchangeCodeForSession).not.toHaveBeenCalled()
  })

  it('redirects to dashboard on successful code exchange', async () => {
    mockExchangeCodeForSession.mockResolvedValue({ error: null })
    const req = new NextRequest('http://localhost/auth/callback?code=abc123')
    const res = await GET(req)
    expect(mockExchangeCodeForSession).toHaveBeenCalledWith('abc123')
    expect(res.headers.get('location')).toContain('/dashboard')
  })

  it('redirects to login error when code exchange fails', async () => {
    mockExchangeCodeForSession.mockResolvedValue({ error: { message: 'invalid code' } })
    const req = new NextRequest('http://localhost/auth/callback?code=badcode')
    const res = await GET(req)
    expect(res.headers.get('location')).toContain('/auth/login?error=')
  })

  it('redirects to next param path on successful exchange', async () => {
    mockExchangeCodeForSession.mockResolvedValue({ error: null })
    const req = new NextRequest('http://localhost/auth/callback?code=xyz&next=/profile')
    const res = await GET(req)
    expect(res.headers.get('location')).toContain('/profile')
  })

  it('exercises setAll cookies callback when createServerClient calls it', async () => {
    mockCreateServerClient.mockImplementationOnce((_url, _key, opts) => {
      opts.cookies.setAll([{ name: 'sb-session', value: 'tok', options: { path: '/' } }])
      return makeSupabaseClient()
    })
    mockExchangeCodeForSession.mockResolvedValue({ error: null })
    const req = new NextRequest('http://localhost/auth/callback?code=abc')
    const res = await GET(req)
    expect(mockCookiesSet).toHaveBeenCalledWith('sb-session', 'tok', { path: '/' })
    expect(res.headers.get('location')).toContain('/dashboard')
  })
})
