import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { revalidateTag } from 'next/cache'
import { logger } from '@/lib/logger'
import { validateOptionalString, ValidationException } from '@/lib/validation'
import { rateLimit, LIMITS } from '@/lib/rate-limit'

const VALID_STATUSES = ['not_started', 'in_progress', 'completed', 'cancelled']

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const limited = rateLimit(user.id, 'goals.eval.write', LIMITS.WRITE)
    if (limited) return limited

    const { id } = await params
    const body = await request.json()
    const { title, description, cycle_id, status } = body

    const update: Record<string, unknown> = {}

    try {
      if (title !== undefined) {
        const v = validateOptionalString(title, 'title', 200)
        if (!v) throw new ValidationException([{ field: 'title', message: 'Title cannot be empty' }])
        update.title = v
      }
      if (description !== undefined) {
        update.description = validateOptionalString(description, 'description', 1000)
      }
    } catch (err) {
      if (err instanceof ValidationException) {
        return NextResponse.json({ error: 'Invalid request', details: err.errors }, { status: 400 })
      }
      throw err
    }

    if (cycle_id !== undefined) update.cycle_id = cycle_id || null
    if (status !== undefined && VALID_STATUSES.includes(status)) update.status = status

    const { data: goal, error } = await supabase
      .from('evaluation_goals')
      .update(update)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error || !goal) {
      logger.error('Failed to update evaluation goal', error, 'api')
      return NextResponse.json({ error: 'Failed to update goal' }, { status: error ? 500 : 404 })
    }

    revalidateTag(`goals-${user.id}`)
    return NextResponse.json({ goal })
  } catch (error) {
    logger.error('Unhandled error in PATCH /api/goals/evaluation/[id]', error, 'api')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const limited = rateLimit(user.id, 'goals.eval.write', LIMITS.WRITE)
    if (limited) return limited

    const { id } = await params
    const { error } = await supabase
      .from('evaluation_goals')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      logger.error('Failed to delete evaluation goal', error, 'api')
      return NextResponse.json({ error: 'Failed to delete goal' }, { status: 500 })
    }

    revalidateTag(`goals-${user.id}`)
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    logger.error('Unhandled error in DELETE /api/goals/evaluation/[id]', error, 'api')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
