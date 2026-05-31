import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { logAdminAction } from '@/lib/admin-audit'

export const dynamic = 'force-dynamic'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin()
  if (!authResult.ok) return authResult.response

  const { user, adminDb } = authResult
  const { id } = await params

  const { data: userData, error: userError } = await adminDb.auth.admin.getUserById(id)
  if (userError || !userData.user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const email = userData.user.email
  if (!email) {
    return NextResponse.json({ error: 'User has no email address' }, { status: 400 })
  }

  const { error } = await adminDb.auth.resetPasswordForEmail(email)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await logAdminAction(user.id, 'reset_password', id, { email })

  return NextResponse.json({ ok: true })
}
