import { GET } from '../health/route'
import { makeSupabase } from './helpers'

jest.mock('@/lib/supabase/server')

import { createClient } from '@/lib/supabase/server'
const mockCreateClient = createClient as jest.Mock

afterEach(() => jest.clearAllMocks())

describe('GET /api/health', () => {
  it('returns 200 and ok status when DB responds', async () => {
    mockCreateClient.mockResolvedValue(
      makeSupabase(null, { profiles: { data: [{ id: '1' }], error: null } })
    )
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.status).toBe('ok')
    expect(body.checks.database).toBe('ok')
    expect(body.timestamp).toBeDefined()
  })

  it('returns 503 and degraded status when DB errors', async () => {
    mockCreateClient.mockResolvedValue(
      makeSupabase(null, { profiles: { data: null, error: { message: 'connection refused' } } })
    )
    const res = await GET()
    expect(res.status).toBe(503)
    const body = await res.json()
    expect(body.status).toBe('degraded')
    expect(body.checks.database).toBe('error')
  })

  it('returns 503 when createClient throws', async () => {
    mockCreateClient.mockRejectedValue(new Error('DB down'))
    const res = await GET()
    expect(res.status).toBe(503)
    const body = await res.json()
    expect(body.checks.database).toBe('error')
  })
})
