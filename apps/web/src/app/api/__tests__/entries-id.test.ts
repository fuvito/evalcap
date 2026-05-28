import { GET, PATCH, DELETE } from '../entries/[id]/route'
import { makeSupabase, jsonRequest } from './helpers'

jest.mock('@/lib/supabase/server')
jest.mock('next/cache', () => ({ revalidateTag: jest.fn(), revalidatePath: jest.fn() }))

import { createClient } from '@/lib/supabase/server'
const mockCreateClient = createClient as jest.Mock

const AUTHED_USER = { id: 'user-1', email: 'test@example.com' }
const ENTRY = { id: 'entry-1', content: 'shipped feature', check_in_type: 'daily', created_at: '2026-05-28', user_id: 'user-1' }
const PARAMS = { params: { id: 'entry-1' } }

describe('GET /api/entries/[id]', () => {
  afterEach(() => jest.clearAllMocks())

  it('returns 401 when no user', async () => {
    mockCreateClient.mockResolvedValue(makeSupabase(null))
    const res = await GET(new Request('http://localhost/api/entries/entry-1'), PARAMS)
    expect(res.status).toBe(401)
  })

  it('returns 404 when entry not found', async () => {
    mockCreateClient.mockResolvedValue(
      makeSupabase(AUTHED_USER, { journal_entries: { data: null, error: { code: 'PGRST116' } } })
    )
    const res = await GET(new Request('http://localhost/api/entries/entry-1'), PARAMS)
    expect(res.status).toBe(404)
  })

  it('returns entry on success', async () => {
    mockCreateClient.mockResolvedValue(
      makeSupabase(AUTHED_USER, { journal_entries: { data: ENTRY, error: null } })
    )
    const res = await GET(new Request('http://localhost/api/entries/entry-1'), PARAMS)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.entry).toMatchObject({ id: 'entry-1' })
  })
})

describe('PATCH /api/entries/[id]', () => {
  afterEach(() => jest.clearAllMocks())

  it('returns 401 when no user', async () => {
    mockCreateClient.mockResolvedValue(makeSupabase(null))
    const req = jsonRequest('http://localhost/api/entries/entry-1', 'PATCH', { content: 'updated' })
    const res = await PATCH(req, PARAMS)
    expect(res.status).toBe(401)
  })

  it('returns 400 for empty content', async () => {
    mockCreateClient.mockResolvedValue(makeSupabase(AUTHED_USER))
    const req = jsonRequest('http://localhost/api/entries/entry-1', 'PATCH', { content: '' })
    const res = await PATCH(req, PARAMS)
    expect(res.status).toBe(400)
  })

  it('returns 400 for content over 10000 characters', async () => {
    mockCreateClient.mockResolvedValue(makeSupabase(AUTHED_USER))
    const req = jsonRequest('http://localhost/api/entries/entry-1', 'PATCH', { content: 'x'.repeat(10001) })
    const res = await PATCH(req, PARAMS)
    expect(res.status).toBe(400)
  })

  it('updates and returns entry on success', async () => {
    const updatedEntry = { ...ENTRY, content: 'updated content' }
    mockCreateClient.mockResolvedValue(
      makeSupabase(AUTHED_USER, { journal_entries: { data: updatedEntry, error: null } })
    )
    const req = jsonRequest('http://localhost/api/entries/entry-1', 'PATCH', { content: 'updated content' })
    const res = await PATCH(req, PARAMS)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.entry.content).toBe('updated content')
  })

  it('returns 404 when entry not found', async () => {
    mockCreateClient.mockResolvedValue(
      makeSupabase(AUTHED_USER, { journal_entries: { data: null, error: null } })
    )
    const req = jsonRequest('http://localhost/api/entries/entry-1', 'PATCH', { content: 'updated' })
    const res = await PATCH(req, PARAMS)
    expect(res.status).toBe(404)
  })
})

describe('DELETE /api/entries/[id]', () => {
  afterEach(() => jest.clearAllMocks())

  it('returns 401 when no user', async () => {
    mockCreateClient.mockResolvedValue(makeSupabase(null))
    const res = await DELETE(new Request('http://localhost/api/entries/entry-1'), PARAMS)
    expect(res.status).toBe(401)
  })

  it('returns 200 on successful delete', async () => {
    mockCreateClient.mockResolvedValue(
      makeSupabase(AUTHED_USER, { journal_entries: { data: null, error: null } })
    )
    const res = await DELETE(new Request('http://localhost/api/entries/entry-1'), PARAMS)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
  })

  it('returns 500 when delete fails', async () => {
    mockCreateClient.mockResolvedValue(
      makeSupabase(AUTHED_USER, { journal_entries: { data: null, error: { message: 'DB error' } } })
    )
    const res = await DELETE(new Request('http://localhost/api/entries/entry-1'), PARAMS)
    expect(res.status).toBe(500)
  })
})
