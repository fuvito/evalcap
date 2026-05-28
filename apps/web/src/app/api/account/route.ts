import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'

export async function DELETE() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Delete user data via RLS-protected client (only deletes own rows)
    await supabase.from('journal_entries').delete().eq('user_id', user.id)
    await supabase.from('summaries').delete().eq('user_id', user.id)
    await supabase.from('profiles').delete().eq('id', user.id)

    // Delete the auth user via admin client (requires SUPABASE_SERVICE_ROLE_KEY)
    const admin = createAdminClient()
    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id)

    if (deleteError) {
      logger.error('Failed to delete auth user', deleteError, 'api')
      return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 })
    }

    logger.info('Account deleted', { userId: user.id }, 'api')
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    logger.error('Unhandled error in DELETE /api/account', error, 'api')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
