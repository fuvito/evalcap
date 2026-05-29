import { POST } from '../admin/users/[id]/credits/route'
import { makeChain, jsonRequest } from './helpers'
import { NextResponse } from 'next/server'

jest.mock('@/lib/admin-auth')
jest.mock('@/lib/admin-audit')

import { requireAdmin } from '@/lib/admin-auth'
import { logAdminAction } from '@/lib/admin-audit'

const mockRequireAdmin = requireAdmin as jest.Mock
const mockLogAdminAction = logAdminAction as jest.Mock

const ADMIN_USER = { id: 'admin-1', email: 'admin@example.com' }
const TARGET_ID  = 'user-42'

/**
 * Build an adminDb mock for the credits route.
 * The route calls from('credits') twice (SELECT then UPSERT), then from('credit_events').
 * mockReturnValueOnce sequences match that call order.
 */
function makeCreditsAdminDb({
  existingBalance = null as number | null,
  upsertError     = null as unknown,
} = {}) {
  const fromMock = jest.fn()
    // 1st call → credits SELECT (maybeSingle)
    .mockReturnValueOnce(
      makeChain({ data: existingBalance !== null ? { balance: existingBalance } : null, error: null })
    )
    // 2nd call → credits UPSERT
    .mockReturnValueOnce(makeChain({ error: upsertError }))
    // 3rd call → credit_events INSERT (and any extra calls)
    .mockReturnValue(makeChain({ data: null, error: null }))

  return { from: fromMock }
}

function authOk(adminDb: ReturnType<typeof makeCreditsAdminDb>) {
  return { ok: true, user: ADMIN_USER, adminDb }
}

function authFail(status = 401) {
  return {
    ok: false,
    response: NextResponse.json({ error: 'Unauthorized' }, { status }),
  }
}

function params(id = TARGET_ID) {
  return { params: Promise.resolve({ id }) }
}

afterEach(() => jest.clearAllMocks())

describe('POST /api/admin/users/[id]/credits', () => {
  it('returns the auth error response when requireAdmin fails', async () => {
    mockRequireAdmin.mockResolvedValue(authFail(403))

    const res = await POST(jsonRequest('http://localhost', 'POST', { delta: 10 }), params())

    expect(res.status).toBe(403)
    expect(mockLogAdminAction).not.toHaveBeenCalled()
  })

  it('returns 400 when delta is 0', async () => {
    mockRequireAdmin.mockResolvedValue(authOk(makeCreditsAdminDb()))

    const res = await POST(jsonRequest('http://localhost', 'POST', { delta: 0 }), params())

    expect(res.status).toBe(400)
  })

  it('returns 400 when delta is not a number', async () => {
    mockRequireAdmin.mockResolvedValue(authOk(makeCreditsAdminDb()))

    const res = await POST(jsonRequest('http://localhost', 'POST', { delta: 'fifty' }), params())

    expect(res.status).toBe(400)
  })

  it('returns 400 when delta is non-integer', async () => {
    mockRequireAdmin.mockResolvedValue(authOk(makeCreditsAdminDb()))

    const res = await POST(jsonRequest('http://localhost', 'POST', { delta: 1.5 }), params())

    expect(res.status).toBe(400)
  })

  it('creates credits row at delta balance when no existing record', async () => {
    const adminDb = makeCreditsAdminDb({ existingBalance: null })
    mockRequireAdmin.mockResolvedValue(authOk(adminDb))
    mockLogAdminAction.mockResolvedValue(undefined)

    const res = await POST(jsonRequest('http://localhost', 'POST', { delta: 50, reason: 'welcome bonus' }), params())

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ balance: 50 })
    expect(mockLogAdminAction).toHaveBeenCalledWith(
      ADMIN_USER.id, 'add_credits', TARGET_ID,
      expect.objectContaining({ delta: 50, new_balance: 50 })
    )
  })

  it('adds delta to existing balance', async () => {
    const adminDb = makeCreditsAdminDb({ existingBalance: 30 })
    mockRequireAdmin.mockResolvedValue(authOk(adminDb))
    mockLogAdminAction.mockResolvedValue(undefined)

    const res = await POST(jsonRequest('http://localhost', 'POST', { delta: 20 }), params())

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ balance: 50 })
  })

  it('clamps balance to 0 when deducting more than current balance', async () => {
    const adminDb = makeCreditsAdminDb({ existingBalance: 10 })
    mockRequireAdmin.mockResolvedValue(authOk(adminDb))
    mockLogAdminAction.mockResolvedValue(undefined)

    const res = await POST(jsonRequest('http://localhost', 'POST', { delta: -50 }), params())

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ balance: 0 })
  })

  it('returns 500 when upsert fails', async () => {
    const adminDb = makeCreditsAdminDb({ upsertError: { message: 'constraint violation' } })
    mockRequireAdmin.mockResolvedValue(authOk(adminDb))

    const res = await POST(jsonRequest('http://localhost', 'POST', { delta: 10 }), params())

    expect(res.status).toBe(500)
    expect(mockLogAdminAction).not.toHaveBeenCalled()
  })

  it('inserts a credit_event on success', async () => {
    const adminDb = makeCreditsAdminDb({ existingBalance: 20 })
    mockRequireAdmin.mockResolvedValue(authOk(adminDb))
    mockLogAdminAction.mockResolvedValue(undefined)

    await POST(jsonRequest('http://localhost', 'POST', { delta: 10, reason: 'test' }), params())

    // from called: credits (SELECT), credits (UPSERT), credit_events (INSERT)
    expect(adminDb.from).toHaveBeenNthCalledWith(3, 'credit_events')
  })
})
