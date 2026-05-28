import { PATCH, DELETE } from '../cycles/[id]/route'
import { makeSupabase, jsonRequest } from './helpers'

jest.mock('@/lib/supabase/server')
jest.mock('next/cache', () => ({ revalidateTag: jest.fn() }))

import { createClient } from '@/lib/supabase/server'
const mockCreateClient = createClient as jest.Mock

const AUTHED_USER = { id: 'user-1', email: 'test@example.com' }
const CYCLE = { id: 'cycle-1', name: 'Q2 2026', start_date: '2026-04-01', end_date: '2026-06-30', status: 'active' }
const ASYNC_PARAMS = { params: Promise.resolve({ id: 'cycle-1' }) }

afterEach(() => jest.clearAllMocks())

describe('PATCH /api/cycles/[id]', () => {
  it('returns 401 when no user', async () => {
    mockCreateClient.mockResolvedValue(makeSupabase(null))
    const req = jsonRequest('http://localhost/api/cycles/cycle-1', 'PATCH', { name: 'Updated' })
    const res = await PATCH(req, ASYNC_PARAMS)
    expect(res.status).toBe(401)
  })

  it('returns 400 for invalid status', async () => {
    mockCreateClient.mockResolvedValue(makeSupabase(AUTHED_USER))
    const req = jsonRequest('http://localhost/api/cycles/cycle-1', 'PATCH', { status: 'deleted' })
    const res = await PATCH(req, ASYNC_PARAMS)
    expect(res.status).toBe(400)
  })

  it('updates cycle on success', async () => {
    const updated = { ...CYCLE, name: 'Q2 2026 Updated' }
    mockCreateClient.mockResolvedValue(
      makeSupabase(AUTHED_USER, { performance_cycles: { data: updated, error: null } })
    )
    const req = jsonRequest('http://localhost/api/cycles/cycle-1', 'PATCH', { name: 'Q2 2026 Updated' })
    const res = await PATCH(req, ASYNC_PARAMS)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.cycle.name).toBe('Q2 2026 Updated')
  })

  it('returns 404 when cycle not found', async () => {
    mockCreateClient.mockResolvedValue(
      makeSupabase(AUTHED_USER, { performance_cycles: { data: null, error: null } })
    )
    const req = jsonRequest('http://localhost/api/cycles/cycle-1', 'PATCH', { name: 'Updated' })
    const res = await PATCH(req, ASYNC_PARAMS)
    expect(res.status).toBe(404)
  })
})

describe('DELETE /api/cycles/[id]', () => {
  it('returns 401 when no user', async () => {
    mockCreateClient.mockResolvedValue(makeSupabase(null))
    const req = new Request('http://localhost/api/cycles/cycle-1', { method: 'DELETE' }) as any
    const res = await DELETE(req, ASYNC_PARAMS)
    expect(res.status).toBe(401)
  })

  it('returns 204 on successful delete', async () => {
    mockCreateClient.mockResolvedValue(
      makeSupabase(AUTHED_USER, { performance_cycles: { data: null, error: null } })
    )
    const req = new Request('http://localhost/api/cycles/cycle-1', { method: 'DELETE' }) as any
    const res = await DELETE(req, ASYNC_PARAMS)
    expect(res.status).toBe(204)
  })

  it('returns 500 when delete fails', async () => {
    mockCreateClient.mockResolvedValue(
      makeSupabase(AUTHED_USER, { performance_cycles: { data: null, error: { message: 'DB error' } } })
    )
    const req = new Request('http://localhost/api/cycles/cycle-1', { method: 'DELETE' }) as any
    const res = await DELETE(req, ASYNC_PARAMS)
    expect(res.status).toBe(500)
  })
})
