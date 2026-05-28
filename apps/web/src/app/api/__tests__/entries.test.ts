import { NextRequest } from 'next/server'
import { POST } from '../entries/route'
import { makeSupabase, jsonRequest } from './helpers'

jest.mock('@/lib/supabase/server')
jest.mock('next/cache', () => ({ revalidateTag: jest.fn(), revalidatePath: jest.fn() }))

import { createClient } from '@/lib/supabase/server'
const mockCreateClient = createClient as jest.Mock

const AUTHED_USER = { id: 'user-1', email: 'test@example.com' }
const ENTRY = { id: 'entry-1', content: 'did stuff', check_in_type: 'daily', created_at: '2026-05-28' }

describe('POST /api/entries', () => {
  afterEach(() => jest.clearAllMocks())

  it('returns 401 when no user', async () => {
    mockCreateClient.mockResolvedValue(makeSupabase(null))
    const req = jsonRequest('http://localhost/api/entries', 'POST', {
      content: 'Today I shipped the feature',
      checkInType: 'daily',
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('returns 400 for invalid checkInType', async () => {
    mockCreateClient.mockResolvedValue(makeSupabase(AUTHED_USER))
    const req = jsonRequest('http://localhost/api/entries', 'POST', {
      content: 'Today I shipped the feature',
      checkInType: 'monthly',
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('Invalid request')
  })

  it('returns 400 for empty content', async () => {
    mockCreateClient.mockResolvedValue(makeSupabase(AUTHED_USER))
    const req = jsonRequest('http://localhost/api/entries', 'POST', {
      content: '   ',
      checkInType: 'daily',
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 for content over 5000 characters', async () => {
    mockCreateClient.mockResolvedValue(makeSupabase(AUTHED_USER))
    const req = jsonRequest('http://localhost/api/entries', 'POST', {
      content: 'x'.repeat(5001),
      checkInType: 'daily',
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('creates entry and returns 201', async () => {
    mockCreateClient.mockResolvedValue(
      makeSupabase(AUTHED_USER, {
        journal_entries: { data: ENTRY, error: null },
      })
    )
    const req = jsonRequest('http://localhost/api/entries', 'POST', {
      content: 'Today I shipped the feature',
      checkInType: 'daily',
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.entry).toBeDefined()
  })

  it('returns 500 when database insert fails', async () => {
    mockCreateClient.mockResolvedValue(
      makeSupabase(AUTHED_USER, {
        journal_entries: { data: null, error: { message: 'DB error' } },
      })
    )
    const req = jsonRequest('http://localhost/api/entries', 'POST', {
      content: 'Today I shipped the feature',
      checkInType: 'daily',
    })
    const res = await POST(req)
    expect(res.status).toBe(500)
  })
})
