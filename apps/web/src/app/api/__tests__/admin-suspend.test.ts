import { POST } from '../admin/users/[id]/suspend/route'
import { makeChain, jsonRequest } from './helpers'
import { NextRequest, NextResponse } from 'next/server'

jest.mock('@/lib/admin-auth')
jest.mock('@/lib/admin-audit')

import { requireAdmin } from '@/lib/admin-auth'
import { logAdminAction } from '@/lib/admin-audit'

const mockRequireAdmin = requireAdmin as jest.Mock
const mockLogAdminAction = logAdminAction as jest.Mock

const ADMIN_USER   = { id: 'admin-1', email: 'admin@example.com' }
const TARGET_ID    = 'user-42'

function makeAdminDb(updateError: unknown = null) {
  return { from: jest.fn(() => makeChain({ error: updateError })) }
}

function authOk(adminDb = makeAdminDb()) {
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

describe('POST /api/admin/users/[id]/suspend', () => {
  it('returns the auth error response when requireAdmin fails', async () => {
    mockRequireAdmin.mockResolvedValue(authFail(401))

    const res = await POST(jsonRequest('http://localhost', 'POST', { suspended: true }), params())

    expect(res.status).toBe(401)
    expect(mockLogAdminAction).not.toHaveBeenCalled()
  })

  it('returns 400 for non-JSON body', async () => {
    mockRequireAdmin.mockResolvedValue(authOk())

    const req = new NextRequest('http://localhost', { method: 'POST', body: 'not json' })
    const res = await POST(req, params())

    expect(res.status).toBe(400)
  })

  it('suspends user: updates status to suspended and logs audit action', async () => {
    const adminDb = makeAdminDb(null)
    mockRequireAdmin.mockResolvedValue(authOk(adminDb))
    mockLogAdminAction.mockResolvedValue(undefined)

    const res = await POST(jsonRequest('http://localhost', 'POST', { suspended: true }), params())

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ status: 'suspended' })
    expect(adminDb.from).toHaveBeenCalledWith('profiles')
    expect(mockLogAdminAction).toHaveBeenCalledWith(
      ADMIN_USER.id, 'suspend_user', TARGET_ID, { status: 'suspended' }
    )
  })

  it('unsuspends user: updates status to active and logs audit action', async () => {
    const adminDb = makeAdminDb(null)
    mockRequireAdmin.mockResolvedValue(authOk(adminDb))
    mockLogAdminAction.mockResolvedValue(undefined)

    const res = await POST(jsonRequest('http://localhost', 'POST', { suspended: false }), params())

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ status: 'active' })
    expect(mockLogAdminAction).toHaveBeenCalledWith(
      ADMIN_USER.id, 'unsuspend_user', TARGET_ID, { status: 'active' }
    )
  })

  it('returns 500 when DB update fails', async () => {
    const adminDb = makeAdminDb({ message: 'connection error' })
    mockRequireAdmin.mockResolvedValue(authOk(adminDb))

    const res = await POST(jsonRequest('http://localhost', 'POST', { suspended: true }), params())

    expect(res.status).toBe(500)
    expect(mockLogAdminAction).not.toHaveBeenCalled()
  })
})
