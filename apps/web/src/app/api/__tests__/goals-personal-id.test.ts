import { PATCH, DELETE } from '../goals/personal/[id]/route'
import { makeSupabase, jsonRequest } from './helpers'

jest.mock('@/lib/supabase/server')
jest.mock('next/cache', () => ({ revalidateTag: jest.fn() }))

import { createClient } from '@/lib/supabase/server'
const mockCreateClient = createClient as jest.Mock

const AUTHED_USER = { id: 'user-1', email: 'test@example.com' }
const GOAL = { id: 'goal-1', title: 'Get certified', priority: 'high', status: 'active', user_id: 'user-1' }
const ASYNC_PARAMS = { params: Promise.resolve({ id: 'goal-1' }) }

afterEach(() => jest.clearAllMocks())

describe('PATCH /api/goals/personal/[id]', () => {
  it('returns 401 when no user', async () => {
    mockCreateClient.mockResolvedValue(makeSupabase(null))
    const req = jsonRequest('http://localhost/api/goals/personal/goal-1', 'PATCH', { status: 'completed' })
    const res = await PATCH(req, ASYNC_PARAMS)
    expect(res.status).toBe(401)
  })

  it('returns 400 for empty title', async () => {
    mockCreateClient.mockResolvedValue(makeSupabase(AUTHED_USER))
    const req = jsonRequest('http://localhost/api/goals/personal/goal-1', 'PATCH', { title: '' })
    const res = await PATCH(req, ASYNC_PARAMS)
    expect(res.status).toBe(400)
  })

  it('updates goal on success', async () => {
    const updated = { ...GOAL, status: 'completed' }
    mockCreateClient.mockResolvedValue(
      makeSupabase(AUTHED_USER, { personal_goals: { data: updated, error: null } })
    )
    const req = jsonRequest('http://localhost/api/goals/personal/goal-1', 'PATCH', { status: 'completed' })
    const res = await PATCH(req, ASYNC_PARAMS)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.goal.status).toBe('completed')
  })

  it('returns 404 when goal not found', async () => {
    mockCreateClient.mockResolvedValue(
      makeSupabase(AUTHED_USER, { personal_goals: { data: null, error: null } })
    )
    const req = jsonRequest('http://localhost/api/goals/personal/goal-1', 'PATCH', { status: 'completed' })
    const res = await PATCH(req, ASYNC_PARAMS)
    expect(res.status).toBe(404)
  })
})

describe('DELETE /api/goals/personal/[id]', () => {
  it('returns 401 when no user', async () => {
    mockCreateClient.mockResolvedValue(makeSupabase(null))
    const req = new Request('http://localhost/api/goals/personal/goal-1', { method: 'DELETE' }) as any
    const res = await DELETE(req, ASYNC_PARAMS)
    expect(res.status).toBe(401)
  })

  it('returns 204 on successful delete', async () => {
    mockCreateClient.mockResolvedValue(
      makeSupabase(AUTHED_USER, { personal_goals: { data: null, error: null } })
    )
    const req = new Request('http://localhost/api/goals/personal/goal-1', { method: 'DELETE' }) as any
    const res = await DELETE(req, ASYNC_PARAMS)
    expect(res.status).toBe(204)
  })

  it('returns 500 when delete fails', async () => {
    mockCreateClient.mockResolvedValue(
      makeSupabase(AUTHED_USER, { personal_goals: { data: null, error: { message: 'DB error' } } })
    )
    const req = new Request('http://localhost/api/goals/personal/goal-1', { method: 'DELETE' }) as any
    const res = await DELETE(req, ASYNC_PARAMS)
    expect(res.status).toBe(500)
  })
})
