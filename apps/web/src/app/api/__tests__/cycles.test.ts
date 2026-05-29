import { GET, POST } from '../cycles/route'
import { makeSupabase, jsonRequest } from './helpers'

jest.mock('@/lib/supabase/server')
jest.mock('next/cache', () => ({ revalidateTag: jest.fn() }))

import { createClient } from '@/lib/supabase/server'
const mockCreateClient = createClient as jest.Mock

const AUTHED_USER = { id: 'user-1', email: 'test@example.com' }
const CYCLE = { id: 'cycle-1', name: 'Q2 2026', start_date: '2026-04-01', end_date: '2026-06-30', status: 'active' }

afterEach(() => jest.clearAllMocks())

describe('GET /api/cycles', () => {
  it('returns 401 when no user', async () => {
    mockCreateClient.mockResolvedValue(makeSupabase(null))
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('returns cycles list', async () => {
    mockCreateClient.mockResolvedValue(
      makeSupabase(AUTHED_USER, { performance_cycles: { data: [CYCLE], error: null } })
    )
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.cycles).toHaveLength(1)
    expect(body.cycles[0].name).toBe('Q2 2026')
  })

  it('returns 500 on DB error', async () => {
    mockCreateClient.mockResolvedValue(
      makeSupabase(AUTHED_USER, { performance_cycles: { data: null, error: { message: 'DB error' } } })
    )
    const res = await GET()
    expect(res.status).toBe(500)
  })
})

describe('POST /api/cycles', () => {
  it('returns 401 when no user', async () => {
    mockCreateClient.mockResolvedValue(makeSupabase(null))
    const req = jsonRequest('http://localhost/api/cycles', 'POST', {
      name: 'Q2 2026', start_date: '2026-04-01', end_date: '2026-06-30',
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('returns 400 when start date is after end date', async () => {
    mockCreateClient.mockResolvedValue(makeSupabase(AUTHED_USER))
    const req = jsonRequest('http://localhost/api/cycles', 'POST', {
      name: 'Q2 2026', start_date: '2026-06-30', end_date: '2026-04-01',
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 for missing name', async () => {
    mockCreateClient.mockResolvedValue(makeSupabase(AUTHED_USER))
    const req = jsonRequest('http://localhost/api/cycles', 'POST', {
      start_date: '2026-04-01', end_date: '2026-06-30',
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('creates cycle and returns 201', async () => {
    mockCreateClient.mockResolvedValue(
      makeSupabase(AUTHED_USER, { performance_cycles: { data: CYCLE, error: null } })
    )
    const req = jsonRequest('http://localhost/api/cycles', 'POST', {
      name: 'Q2 2026', start_date: '2026-04-01', end_date: '2026-06-30',
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.cycle.name).toBe('Q2 2026')
  })

  it('returns 500 when DB insert fails', async () => {
    mockCreateClient.mockResolvedValue(
      makeSupabase(AUTHED_USER, { performance_cycles: { data: null, error: { message: 'insert failed' } } })
    )
    const req = jsonRequest('http://localhost/api/cycles', 'POST', {
      name: 'Q2 2026', start_date: '2026-04-01', end_date: '2026-06-30',
    })
    const res = await POST(req)
    expect(res.status).toBe(500)
  })

  it('returns 500 on unhandled POST error', async () => {
    mockCreateClient.mockRejectedValue(new Error('connection failed'))
    const req = jsonRequest('http://localhost/api/cycles', 'POST', {
      name: 'Q2 2026', start_date: '2026-04-01', end_date: '2026-06-30',
    })
    const res = await POST(req)
    expect(res.status).toBe(500)
  })
})

describe('GET /api/cycles — error paths', () => {
  it('returns 500 on unhandled GET error', async () => {
    mockCreateClient.mockRejectedValue(new Error('connection failed'))
    const res = await GET()
    expect(res.status).toBe(500)
  })
})
