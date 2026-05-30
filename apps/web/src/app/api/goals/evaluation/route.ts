import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { revalidateTag } from 'next/cache'
import { logger } from '@/lib/logger'
import { validateOptionalString, ValidationException } from '@/lib/validation'
import { rateLimit, LIMITS } from '@/lib/rate-limit'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const limited = rateLimit(user.id, 'goals.eval.read', LIMITS.READ)
    if (limited) return limited

    const { data: goals, error } = await supabase
      .from('evaluation_goals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('Failed to fetch evaluation goals', error, 'api')
      return NextResponse.json({ error: 'Failed to fetch goals' }, { status: 500 })
    }

    return NextResponse.json({ goals })
  } catch (error) {
    logger.error('Unhandled error in GET /api/goals/evaluation', error, 'api')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const limited = rateLimit(user.id, 'goals.eval.write', LIMITS.WRITE)
    if (limited) return limited

    const body = await request.json()
    const { title, description, cycle_id, status } = body

    try {
      const validatedTitle = validateOptionalString(title, 'title', 200)
      if (!validatedTitle) throw new ValidationException([{ field: 'title', message: 'Title is required' }])
      validateOptionalString(description, 'description', 1000)
    } catch (err) {
      if (err instanceof ValidationException) {
        return NextResponse.json({ error: 'Invalid request', details: err.errors }, { status: 400 })
      }
      throw err
    }

    const validStatuses = ['not_started', 'in_progress', 'completed', 'cancelled']
    const goalStatus = validStatuses.includes(status) ? status : 'not_started'

    const { data: goal, error } = await supabase
      .from('evaluation_goals')
      .insert({
        user_id: user.id,
        title: title.trim(),
        description: description?.trim() || null,
        cycle_id: cycle_id || null,
        status: goalStatus,
      })
      .select()
      .single()

    if (error) {
      logger.error('Failed to create evaluation goal', error, 'api')
      return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 })
    }

    revalidateTag(`goals-${user.id}`)
    return NextResponse.json({ goal }, { status: 201 })
  } catch (error) {
    logger.error('Unhandled error in POST /api/goals/evaluation', error, 'api')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
