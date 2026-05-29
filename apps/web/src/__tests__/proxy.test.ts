import { NextRequest } from 'next/server'
import { proxy } from '@/proxy'

const mockGetUser = jest.fn()
const mockCreateServerClient = jest.fn()

jest.mock('@supabase/ssr', () => ({
  createServerClient: (...args: unknown[]) => mockCreateServerClient(...args),
}))

function makeClient(user: unknown) {
  return {
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user } }) },
  }
}

afterEach(() => jest.clearAllMocks())

function req(path: string) {
  return new NextRequest(`http://localhost${path}`)
}

describe('proxy middleware', () => {
  describe('unauthenticated user', () => {
    beforeEach(() => {
      mockCreateServerClient.mockImplementation(() => makeClient(null))
    })

    it('redirects to login for protected /dashboard route', async () => {
      const res = await proxy(req('/dashboard'))
      expect(res.headers.get('location')).toContain('/auth/login')
    })

    it('redirects to login for protected /checkin route', async () => {
      const res = await proxy(req('/checkin'))
      expect(res.headers.get('location')).toContain('/auth/login')
    })

    it('redirects to login for protected /summary route', async () => {
      const res = await proxy(req('/summary'))
      expect(res.headers.get('location')).toContain('/auth/login')
    })

    it('redirects to login for protected /history route', async () => {
      const res = await proxy(req('/history'))
      expect(res.headers.get('location')).toContain('/auth/login')
    })

    it('passes through for public routes', async () => {
      const res = await proxy(req('/'))
      expect(res.headers.get('location')).toBeNull()
    })

    it('passes through for auth pages', async () => {
      const res = await proxy(req('/auth/login'))
      expect(res.headers.get('location')).toBeNull()
    })
  })

  describe('authenticated user', () => {
    beforeEach(() => {
      mockCreateServerClient.mockImplementation(() => makeClient({ id: 'user-1' }))
    })

    it('passes through for protected routes', async () => {
      const res = await proxy(req('/dashboard'))
      expect(res.headers.get('location')).toBeNull()
    })

    it('redirects to dashboard from auth pages', async () => {
      const res = await proxy(req('/auth/login'))
      expect(res.headers.get('location')).toContain('/dashboard')
    })

    it('redirects to dashboard from signup page', async () => {
      const res = await proxy(req('/auth/signup'))
      expect(res.headers.get('location')).toContain('/dashboard')
    })

    it('does NOT redirect from /auth/callback', async () => {
      const res = await proxy(req('/auth/callback'))
      expect(res.headers.get('location')).toBeNull()
    })
  })

  describe('setAll cookies callback', () => {
    it('exercises setAll when createServerClient calls it', async () => {
      mockCreateServerClient.mockImplementation((_url, _key, opts) => {
        opts.cookies.setAll([{ name: 'sb-auth', value: 'tok', options: { path: '/' } }])
        return makeClient({ id: 'user-1' })
      })
      const res = await proxy(req('/dashboard'))
      expect(res.headers.get('location')).toBeNull()
    })
  })

  describe('getAll cookies callback', () => {
    it('exercises getAll when createServerClient calls it', async () => {
      mockCreateServerClient.mockImplementation((_url, _key, opts) => {
        opts.cookies.getAll()
        return makeClient({ id: 'user-1' })
      })
      const res = await proxy(req('/dashboard'))
      expect(res.headers.get('location')).toBeNull()
    })
  })
})
