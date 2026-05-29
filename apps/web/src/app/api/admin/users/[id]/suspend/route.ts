import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { logAdminAction } from '@/lib/admin-audit'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin()
  if (!authResult.ok) return authResult.response

  const { user, adminDb } = authResult
  const { id } = await params

  let body: { suspended: boolean }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const newStatus = body.suspended ? 'suspended' : 'active'

  const { error } = await adminDb
    .from('profiles')
    .update({ status: newStatus })
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await logAdminAction(
    user.id,
    body.suspended ? 'suspend_user' : 'unsuspend_user',
    id,
    { status: newStatus }
  )

  return NextResponse.json({ status: newStatus })
}
