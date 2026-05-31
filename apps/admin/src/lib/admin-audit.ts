import { createAdminClient } from '@/lib/supabase/admin'

export async function logAdminAction(
  adminId: string,
  action: string,
  targetUserId: string | null,
  detail?: Record<string, unknown>
) {
  const admin = createAdminClient()
  await admin.from('admin_audit_log').insert({
    admin_id: adminId,
    action,
    target_user_id: targetUserId,
    detail: detail ?? null,
  })
}
