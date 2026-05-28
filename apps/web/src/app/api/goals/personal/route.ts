import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import { validateOptionalString, ValidationException } from '@/lib/validation'

const VALID_CATEGORIES = ['promotion', 'certification', 'skill', 'habit', 'other']
const VALID_PRIORITIES = ['low', 'medium', 'high']

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: goals, error } = await supabase
      .from('personal_goals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('Failed to fetch personal goals', error, 'api')
      return NextResponse.json({ error: 'Failed to fetch goals' }, { status: 500 })
    }

    return NextResponse.json({ goals })
  } catch (error) {
    logger.error('Unhandled error in GET /api/goals/personal', error, 'api')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { title, description, category, priority, due_date } = body

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

    const { data: goal, error } = await supabase
      .from('personal_goals')
      .insert({
        user_id: user.id,
        title: title.trim(),
        description: description?.trim() || null,
        category: VALID_CATEGORIES.includes(category) ? category : null,
        priority: VALID_PRIORITIES.includes(priority) ? priority : 'medium',
        due_date: due_date || null,
      })
      .select()
      .single()

    if (error) {
      logger.error('Failed to create personal goal', error, 'api')
      return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 })
    }

    return NextResponse.json({ goal }, { status: 201 })
  } catch (error) {
    logger.error('Unhandled error in POST /api/goals/personal', error, 'api')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
