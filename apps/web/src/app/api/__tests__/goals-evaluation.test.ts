import { GET, POST } from '../goals/evaluation/route'
import { makeSupabase, jsonRequest } from './helpers'

jest.mock('@/lib/supabase/server')
jest.mock('next/cache', () => ({ revalidateTag: jest.fn() }))

import { createClient } from '@/lib/supabase/server'
const mockCreateClient = createClient as jest.Mock

const AUTHED_USER = { id: 'user-1', email: 'test@example.com' }
const GOAL = { id: 'goal-1', title: 'Ship feature X', status: 'not_started', user_id: 'user-1' }

afterEach(() => jest.clearAllMocks())

describe('GET /api/goals/evaluation', () => {
  it('returns 401 when no user', async () => {
    mockCreateClient.mockResolvedValue(makeSupabase(null))
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('returns goals list', async () => {
    mockCreateClient.mockResolvedValue(
      makeSupabase(AUTHED_USER, { evaluation_goals: { data: [GOAL], error: null } })
    )
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.goals).toHaveLength(1)
  })

  it('returns 500 on DB error', async () => {
    mockCreateClient.mockResolvedValue(
      makeSupabase(AUTHED_USER, { evaluation_goals: { data: null, error: { message: 'DB error' } } })
    )
    const res = await GET()
    expect(res.status).toBe(500)
  })
})

describe('POST /api/goals/evaluation', () => {
  it('returns 401 when no user', async () => {
    mockCreateClient.mockResolvedValue(makeSupabase(null))
    const req = jsonRequest('http://localhost/api/goals/evaluation', 'POST', { title: 'Ship feature X' })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('returns 400 for missing title', async () => {
    mockCreateClient.mockResolvedValue(makeSupabase(AUTHED_USER))
    const req = jsonRequest('http://localhost/api/goals/evaluation', 'POST', { title: '' })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('creates goal and returns 201', async () => {
    mockCreateClient.mockResolvedValue(
      makeSupabase(AUTHED_USER, { evaluation_goals: { data: GOAL, error: null } })
    )
    const req = jsonRequest('http://localhost/api/goals/evaluation', 'POST', { title: 'Ship feature X' })
    const res = await POST(req)
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.goal.title).toBe('Ship feature X')
  })

  it('defaults to not_started status for unknown status values', async () => {
    mockCreateClient.mockResolvedValue(
      makeSupabase(AUTHED_USER, { evaluation_goals: { data: { ...GOAL, status: 'not_started' }, error: null } })
    )
    const req = jsonRequest('http://localhost/api/goals/evaluation', 'POST', {
      title: 'Ship feature X',
      status: 'invalid_status',
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
  })
})
