import { DELETE } from '../account/route'
import { makeSupabase } from './helpers'

jest.mock('@/lib/supabase/server')
jest.mock('@/lib/supabase/admin')

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const mockCreateClient = createClient as jest.Mock
const mockCreateAdminClient = createAdminClient as jest.Mock

const AUTHED_USER = { id: 'user-1', email: 'test@example.com' }

function makeAdmin(deleteError: unknown = null) {
  return {
    auth: {
      admin: {
        deleteUser: jest.fn().mockResolvedValue({ error: deleteError }),
      },
    },
    from: jest.fn().mockReturnValue({
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      then: (resolve: (v: unknown) => unknown) => Promise.resolve({ data: null, error: null }).then(resolve),
    }),
  }
}

afterEach(() => jest.clearAllMocks())

describe('DELETE /api/account', () => {
  it('returns 401 when no user', async () => {
    mockCreateClient.mockResolvedValue(makeSupabase(null))
    const res = await DELETE()
    expect(res.status).toBe(401)
  })

  it('deletes account and returns 204', async () => {
    mockCreateClient.mockResolvedValue(makeSupabase(AUTHED_USER))
    mockCreateAdminClient.mockReturnValue(makeAdmin(null))
    const res = await DELETE()
    expect(res.status).toBe(204)
  })

  it('returns 500 when admin delete fails', async () => {
    mockCreateClient.mockResolvedValue(makeSupabase(AUTHED_USER))
    mockCreateAdminClient.mockReturnValue(makeAdmin({ message: 'Admin error' }))
    const res = await DELETE()
    expect(res.status).toBe(500)
  })
})
