import { requireAdmin } from '../admin-auth'
import { makeSupabase } from '@/app/api/__tests__/helpers'

jest.mock('@/lib/supabase/server')
jest.mock('@/lib/supabase/admin')

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const mockCreateClient = createClient as jest.Mock
const mockCreateAdminClient = createAdminClient as jest.Mock

const ADMIN_USER    = { id: 'admin-1', email: 'admin@example.com' }
const REGULAR_USER  = { id: 'user-1',  email: 'user@example.com' }
const MOCK_ADMIN_DB = { from: jest.fn() }

afterEach(() => jest.clearAllMocks())

describe('requireAdmin', () => {
  it('returns ok:false with 401 when no authenticated user', async () => {
    mockCreateClient.mockResolvedValue(makeSupabase(null))

    const result = await requireAdmin()

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.response.status).toBe(401)
  })

  it('returns ok:false with 403 when user has no role', async () => {
    mockCreateClient.mockResolvedValue(
      makeSupabase(REGULAR_USER, { profiles: { data: { role: null }, error: null } })
    )

    const result = await requireAdmin()

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.response.status).toBe(403)
  })

  it('returns ok:false with 403 when user role is not admin', async () => {
    mockCreateClient.mockResolvedValue(
      makeSupabase(REGULAR_USER, { profiles: { data: { role: 'user' }, error: null } })
    )

    const result = await requireAdmin()

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.response.status).toBe(403)
  })

  it('returns ok:true with user and adminDb when role is admin', async () => {
    mockCreateClient.mockResolvedValue(
      makeSupabase(ADMIN_USER, { profiles: { data: { role: 'admin' }, error: null } })
    )
    mockCreateAdminClient.mockReturnValue(MOCK_ADMIN_DB)

    const result = await requireAdmin()

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.user.id).toBe(ADMIN_USER.id)
      expect(result.adminDb).toBe(MOCK_ADMIN_DB)
    }
    expect(mockCreateAdminClient).toHaveBeenCalledTimes(1)
  })
})
