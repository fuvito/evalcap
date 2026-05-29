import { logAdminAction } from '../admin-audit'

jest.mock('@/lib/supabase/admin')

import { createAdminClient } from '@/lib/supabase/admin'

const mockCreateAdminClient = createAdminClient as jest.Mock

function makeAuditDb() {
  const insertMock = jest.fn().mockReturnValue({
    then: (resolve: (v: unknown) => unknown) =>
      Promise.resolve({ data: null, error: null }).then(resolve),
  })
  const fromMock = jest.fn().mockReturnValue({ insert: insertMock })
  return { db: { from: fromMock }, fromMock, insertMock }
}

afterEach(() => jest.clearAllMocks())

describe('logAdminAction', () => {
  it('inserts correct payload into admin_audit_log', async () => {
    const { db, fromMock, insertMock } = makeAuditDb()
    mockCreateAdminClient.mockReturnValue(db)

    await logAdminAction('admin-1', 'suspend_user', 'user-1', { status: 'suspended' })

    expect(fromMock).toHaveBeenCalledWith('admin_audit_log')
    expect(insertMock).toHaveBeenCalledWith({
      admin_id: 'admin-1',
      action: 'suspend_user',
      target_user_id: 'user-1',
      detail: { status: 'suspended' },
    })
  })

  it('passes null for detail when omitted', async () => {
    const { db, insertMock } = makeAuditDb()
    mockCreateAdminClient.mockReturnValue(db)

    await logAdminAction('admin-1', 'some_action', 'user-1')

    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({ detail: null })
    )
  })

  it('passes null targetUserId when provided', async () => {
    const { db, insertMock } = makeAuditDb()
    mockCreateAdminClient.mockReturnValue(db)

    await logAdminAction('admin-1', 'some_action', null, { note: 'global action' })

    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({ target_user_id: null })
    )
  })

  it('calls createAdminClient once per invocation', async () => {
    const { db } = makeAuditDb()
    mockCreateAdminClient.mockReturnValue(db)

    await logAdminAction('admin-1', 'action', 'user-1')

    expect(mockCreateAdminClient).toHaveBeenCalledTimes(1)
  })
})
