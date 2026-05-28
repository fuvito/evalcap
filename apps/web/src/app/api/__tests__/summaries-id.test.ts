import { PATCH, DELETE } from '../summaries/[id]/route'
import { makeSupabase, jsonRequest } from './helpers'

jest.mock('@/lib/supabase/server')
jest.mock('next/cache', () => ({ revalidateTag: jest.fn(), revalidatePath: jest.fn() }))

import { createClient } from '@/lib/supabase/server'
const mockCreateClient = createClient as jest.Mock

const AUTHED_USER = { id: 'user-1', email: 'test@example.com' }
const SUMMARY = { id: 'summary-1', content: 'Great quarter', user_id: 'user-1' }
const ASYNC_PARAMS = { params: Promise.resolve({ id: 'summary-1' }) }

afterEach(() => jest.clearAllMocks())

describe('PATCH /api/summaries/[id]', () => {
  it('returns 401 when no user', async () => {
    mockCreateClient.mockResolvedValue(makeSupabase(null))
    const req = jsonRequest('http://localhost/api/summaries/summary-1', 'PATCH', { content: 'updated' })
    const res = await PATCH(req, ASYNC_PARAMS)
    expect(res.status).toBe(401)
  })

  it('returns 400 for empty content', async () => {
    mockCreateClient.mockResolvedValue(makeSupabase(AUTHED_USER))
    const req = jsonRequest('http://localhost/api/summaries/summary-1', 'PATCH', { content: '   ' })
    const res = await PATCH(req, ASYNC_PARAMS)
    expect(res.status).toBe(400)
  })

  it('updates summary on success', async () => {
    const updated = { ...SUMMARY, content: 'Updated summary' }
    mockCreateClient.mockResolvedValue(
      makeSupabase(AUTHED_USER, { summaries: { data: updated, error: null } })
    )
    const req = jsonRequest('http://localhost/api/summaries/summary-1', 'PATCH', { content: 'Updated summary' })
    const res = await PATCH(req, ASYNC_PARAMS)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.summary.content).toBe('Updated summary')
  })

  it('returns 404 when summary not found', async () => {
    mockCreateClient.mockResolvedValue(
      makeSupabase(AUTHED_USER, { summaries: { data: null, error: null } })
    )
    const req = jsonRequest('http://localhost/api/summaries/summary-1', 'PATCH', { content: 'updated' })
    const res = await PATCH(req, ASYNC_PARAMS)
    expect(res.status).toBe(404)
  })
})

describe('DELETE /api/summaries/[id]', () => {
  it('returns 401 when no user', async () => {
    mockCreateClient.mockResolvedValue(makeSupabase(null))
    const req = new Request('http://localhost/api/summaries/summary-1', { method: 'DELETE' }) as any
    const res = await DELETE(req, ASYNC_PARAMS)
    expect(res.status).toBe(401)
  })

  it('returns 204 on successful delete', async () => {
    mockCreateClient.mockResolvedValue(
      makeSupabase(AUTHED_USER, { summaries: { data: null, error: null } })
    )
    const req = new Request('http://localhost/api/summaries/summary-1', { method: 'DELETE' }) as any
    const res = await DELETE(req, ASYNC_PARAMS)
    expect(res.status).toBe(204)
  })

  it('returns 500 when delete fails', async () => {
    mockCreateClient.mockResolvedValue(
      makeSupabase(AUTHED_USER, { summaries: { data: null, error: { message: 'DB error' } } })
    )
    const req = new Request('http://localhost/api/summaries/summary-1', { method: 'DELETE' }) as any
    const res = await DELETE(req, ASYNC_PARAMS)
    expect(res.status).toBe(500)
  })
})
