import { GET } from '../account/export/route'
import { makeSupabase } from './helpers'

jest.mock('@/lib/supabase/server')

import { createClient } from '@/lib/supabase/server'
const mockCreateClient = createClient as jest.Mock

const AUTHED_USER = { id: 'user-1', email: 'test@example.com', created_at: '2026-01-01' }

afterEach(() => jest.clearAllMocks())

describe('GET /api/account/export', () => {
  it('returns 401 when no user', async () => {
    mockCreateClient.mockResolvedValue(makeSupabase(null))
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('returns JSON export with correct headers', async () => {
    mockCreateClient.mockResolvedValue(
      makeSupabase(AUTHED_USER, {
        journal_entries: { data: [{ id: '1', content: 'entry' }], error: null },
        summaries: { data: [], error: null },
        profiles: { data: { id: 'user-1', email: 'test@example.com' }, error: null },
      })
    )
    const res = await GET()
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toBe('application/json')
    expect(res.headers.get('Content-Disposition')).toContain('evalcap-export')
    const body = await res.json()
    expect(body.account.email).toBe('test@example.com')
    expect(body.journal_entries).toHaveLength(1)
    expect(body.exported_at).toBeDefined()
  })

  it('returns empty arrays when no data', async () => {
    mockCreateClient.mockResolvedValue(
      makeSupabase(AUTHED_USER, {
        journal_entries: { data: null, error: null },
        summaries: { data: null, error: null },
        profiles: { data: null, error: null },
      })
    )
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.journal_entries).toEqual([])
    expect(body.summaries).toEqual([])
  })
})
