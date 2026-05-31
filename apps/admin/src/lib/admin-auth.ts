import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

type AdminResult =
  | { ok: false; response: NextResponse }
  | { ok: true; user: { id: string; email: string }; adminDb: ReturnType<typeof createAdminClient> }

export async function requireAdmin(): Promise<AdminResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const adminDb = createAdminClient()
  const { data: admin } = await adminDb
    .from('admins')
    .select('id')
    .eq('id', user.id)
    .single()

  if (!admin) {
    return { ok: false, response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }

  return { ok: true, user: { id: user.id, email: user.email! }, adminDb }
}
