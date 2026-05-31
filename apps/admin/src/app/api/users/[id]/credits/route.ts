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

  let body: { delta: number; reason?: string | null }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (typeof body.delta !== 'number' || !Number.isInteger(body.delta) || body.delta === 0) {
    return NextResponse.json({ error: 'delta must be a non-zero integer' }, { status: 400 })
  }

  const { data: existing } = await adminDb
    .from('credits')
    .select('balance')
    .eq('user_id', id)
    .maybeSingle()

  const newBalance = Math.max(0, (existing?.balance ?? 0) + body.delta)

  const { error: upsertError } = await adminDb
    .from('credits')
    .upsert(
      { user_id: id, balance: newBalance, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 })
  }

  await adminDb.from('credit_events').insert({
    user_id: id,
    admin_id: user.id,
    delta: body.delta,
    reason: body.reason ?? null,
  })

  await logAdminAction(user.id, 'add_credits', id, {
    delta: body.delta,
    reason: body.reason ?? null,
    new_balance: newBalance,
  })

  return NextResponse.json({ balance: newBalance })
}
