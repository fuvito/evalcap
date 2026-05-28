import { GET, PATCH } from '../profile/route'
import { makeSupabase, jsonRequest } from './helpers'

jest.mock('@/lib/supabase/server')

import { createClient } from '@/lib/supabase/server'
const mockCreateClient = createClient as jest.Mock

const AUTHED_USER = { id: 'user-1', email: 'test@example.com' }
const PROFILE = { id: 'user-1', email: 'test@example.com', full_name: 'Test User' }

afterEach(() => jest.clearAllMocks())

describe('GET /api/profile', () => {
  it('returns 401 when no user', async () => {
    mockCreateClient.mockResolvedValue(makeSupabase(null))
    const res = await GET(new Request('http://localhost/api/profile') as any)
    expect(res.status).toBe(401)
  })

  it('returns profile and stats on success', async () => {
    mockCreateClient.mockResolvedValue(
      makeSupabase(AUTHED_USER, {
        profiles: { data: PROFILE, error: null },
        journal_entries: { data: [{ id: '1', created_at: '2026-05-28' }], error: null },
      })
    )
    const res = await GET(new Request('http://localhost/api/profile') as any)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.profile).toMatchObject({ id: 'user-1' })
    expect(body.stats.entryCount).toBe(1)
    expect(body.stats.lastCheckIn).toBe('2026-05-28')
  })

  it('creates profile on-demand when not found (PGRST116)', async () => {
    let callCount = 0
    const supabase = {
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: AUTHED_USER }, error: null }) },
      from: jest.fn((table: string) => {
        if (table === 'profiles') {
          callCount++
          if (callCount === 1) {
            // First call: profile not found
            const chain: any = {}
            const methods = ['select', 'insert', 'eq', 'single', 'order']
            methods.forEach(m => { chain[m] = jest.fn(() => chain) })
            chain['then'] = (resolve: any) => Promise.resolve({ data: null, error: { code: 'PGRST116' } }).then(resolve)
            return chain
          }
          // Second call (insert) and third call (re-fetch)
          const chain: any = {}
          const methods = ['select', 'insert', 'eq', 'single', 'order']
          methods.forEach(m => { chain[m] = jest.fn(() => chain) })
          chain['then'] = (resolve: any) => Promise.resolve({ data: PROFILE, error: null }).then(resolve)
          return chain
        }
        // journal_entries
        const chain: any = {}
        const methods = ['select', 'eq', 'order']
        methods.forEach(m => { chain[m] = jest.fn(() => chain) })
        chain['then'] = (resolve: any) => Promise.resolve({ data: [], error: null }).then(resolve)
        return chain
      }),
    }
    mockCreateClient.mockResolvedValue(supabase)
    const res = await GET(new Request('http://localhost/api/profile') as any)
    expect(res.status).toBe(200)
  })
})

describe('PATCH /api/profile', () => {
  it('returns 401 when no user', async () => {
    mockCreateClient.mockResolvedValue(makeSupabase(null))
    const req = jsonRequest('http://localhost/api/profile', 'PATCH', { full_name: 'Alice' })
    const res = await PATCH(req)
    expect(res.status).toBe(401)
  })

  it('returns 400 for invalid check-in type', async () => {
    mockCreateClient.mockResolvedValue(makeSupabase(AUTHED_USER))
    const req = jsonRequest('http://localhost/api/profile', 'PATCH', { default_check_in_type: 'monthly' })
    const res = await PATCH(req)
    expect(res.status).toBe(400)
  })

  it('updates profile on success', async () => {
    const updatedProfile = { ...PROFILE, full_name: 'Alice' }
    mockCreateClient.mockResolvedValue(
      makeSupabase(AUTHED_USER, {
        profiles: { data: updatedProfile, error: null },
      })
    )
    const req = jsonRequest('http://localhost/api/profile', 'PATCH', { full_name: 'Alice' })
    const res = await PATCH(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.profile.full_name).toBe('Alice')
  })
})
