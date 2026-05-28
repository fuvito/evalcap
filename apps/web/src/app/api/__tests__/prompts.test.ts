import { POST } from '../prompts/route'
import { makeSupabase, jsonRequest } from './helpers'

jest.mock('@/lib/supabase/server')
jest.mock('@/lib/claude')
jest.mock('@/lib/rate-limit')
jest.mock('@anthropic-ai/sdk', () => ({ __esModule: true, default: jest.fn() }))

import { createClient } from '@/lib/supabase/server'
import { generateSmartPrompts } from '@/lib/claude'
import { checkRateLimit, getRateLimitInfo } from '@/lib/rate-limit'

const mockCreateClient = createClient as jest.Mock
const mockGenerateSmartPrompts = generateSmartPrompts as jest.Mock
const mockCheckRateLimit = checkRateLimit as jest.Mock
const mockGetRateLimitInfo = getRateLimitInfo as jest.Mock

const AUTHED_USER = { id: 'user-1', email: 'test@example.com' }
const PROMPTS = ['Q1', 'Q2', 'Q3']

beforeEach(() => {
  mockCheckRateLimit.mockReturnValue(true)
  mockGetRateLimitInfo.mockReturnValue({ remaining: 9, resetAt: new Date(Date.now() + 60000) })
  mockGenerateSmartPrompts.mockResolvedValue(PROMPTS)
})

afterEach(() => jest.clearAllMocks())

describe('POST /api/prompts', () => {
  it('returns 401 when no user', async () => {
    mockCreateClient.mockResolvedValue(makeSupabase(null))
    const req = jsonRequest('http://localhost/api/prompts', 'POST', { checkInType: 'daily' })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('returns 429 when rate limit exceeded', async () => {
    mockCheckRateLimit.mockReturnValue(false)
    mockCreateClient.mockResolvedValue(makeSupabase(AUTHED_USER))
    const req = jsonRequest('http://localhost/api/prompts', 'POST', { checkInType: 'daily' })
    const res = await POST(req)
    expect(res.status).toBe(429)
  })

  it('returns 400 for invalid checkInType', async () => {
    mockCreateClient.mockResolvedValue(makeSupabase(AUTHED_USER))
    const req = jsonRequest('http://localhost/api/prompts', 'POST', { checkInType: 'monthly' })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('Invalid request')
  })

  it('returns prompts on success for daily check-in', async () => {
    mockCreateClient.mockResolvedValue(
      makeSupabase(AUTHED_USER, {
        journal_entries: { data: [], error: null },
        evaluation_goals: { data: [], error: null },
        personal_goals: { data: [], error: null },
      })
    )
    const req = jsonRequest('http://localhost/api/prompts', 'POST', { checkInType: 'daily' })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.prompts).toEqual(PROMPTS)
  })

  it('returns prompts on success for weekly check-in', async () => {
    mockCreateClient.mockResolvedValue(
      makeSupabase(AUTHED_USER, {
        journal_entries: { data: [], error: null },
        evaluation_goals: { data: [], error: null },
        personal_goals: { data: [], error: null },
      })
    )
    const req = jsonRequest('http://localhost/api/prompts', 'POST', { checkInType: 'weekly' })
    const res = await POST(req)
    expect(res.status).toBe(200)
  })

  it('returns 500 when fetching entries fails', async () => {
    mockCreateClient.mockResolvedValue(
      makeSupabase(AUTHED_USER, {
        journal_entries: { data: null, error: { message: 'DB error' } },
        evaluation_goals: { data: [], error: null },
        personal_goals: { data: [], error: null },
      })
    )
    const req = jsonRequest('http://localhost/api/prompts', 'POST', { checkInType: 'daily' })
    const res = await POST(req)
    expect(res.status).toBe(500)
  })
})
