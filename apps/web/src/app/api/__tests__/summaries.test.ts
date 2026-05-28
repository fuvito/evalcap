import { POST } from '../summaries/route'
import { makeSupabase, jsonRequest } from './helpers'

jest.mock('@/lib/supabase/server')
jest.mock('next/cache', () => ({ revalidateTag: jest.fn(), revalidatePath: jest.fn() }))

import { createClient } from '@/lib/supabase/server'
const mockCreateClient = createClient as jest.Mock

const AUTHED_USER = { id: 'user-1', email: 'test@example.com' }
const SAVED = { id: 'summary-1', content: 'Great quarter', user_id: 'user-1' }

afterEach(() => jest.clearAllMocks())

describe('POST /api/summaries', () => {
  it('returns 401 when no user', async () => {
    mockCreateClient.mockResolvedValue(makeSupabase(null))
    const req = jsonRequest('http://localhost/api/summaries', 'POST', {
      timeframeStart: '2026-05-01',
      timeframeEnd: '2026-05-31',
      content: 'Great quarter',
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('returns 400 for invalid date', async () => {
    mockCreateClient.mockResolvedValue(makeSupabase(AUTHED_USER))
    const req = jsonRequest('http://localhost/api/summaries', 'POST', {
      timeframeStart: 'bad-date',
      timeframeEnd: '2026-05-31',
      content: 'Great quarter',
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 for empty content', async () => {
    mockCreateClient.mockResolvedValue(makeSupabase(AUTHED_USER))
    const req = jsonRequest('http://localhost/api/summaries', 'POST', {
      timeframeStart: '2026-05-01',
      timeframeEnd: '2026-05-31',
      content: '   ',
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('saves summary and returns 201', async () => {
    mockCreateClient.mockResolvedValue(
      makeSupabase(AUTHED_USER, { summaries: { data: SAVED, error: null } })
    )
    const req = jsonRequest('http://localhost/api/summaries', 'POST', {
      timeframeStart: '2026-05-01',
      timeframeEnd: '2026-05-31',
      content: 'Great quarter',
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.summaryId).toBe('summary-1')
  })

  it('returns 500 when DB insert fails', async () => {
    mockCreateClient.mockResolvedValue(
      makeSupabase(AUTHED_USER, { summaries: { data: null, error: { message: 'DB error' } } })
    )
    const req = jsonRequest('http://localhost/api/summaries', 'POST', {
      timeframeStart: '2026-05-01',
      timeframeEnd: '2026-05-31',
      content: 'Great quarter',
    })
    const res = await POST(req)
    expect(res.status).toBe(500)
  })
})
