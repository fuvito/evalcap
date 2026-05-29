import { NextRequest, NextResponse } from 'next/server'
import { createClient, createClientFromToken } from '@/lib/supabase/server'
import { generateSmartPrompts } from '@/lib/claude'
import { logger } from '@/lib/logger'
import { validateCheckInType, ValidationException, logValidationError } from '@/lib/validation'
import { rateLimit, LIMITS } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    const bearer = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
    const supabase = bearer ? createClientFromToken(bearer) : await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser(bearer)
    if (authError || !user) {
      logger.warn('Unauthenticated request to /api/prompts', undefined, 'api')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const limited = rateLimit(user.id, 'ai.prompts', LIMITS.AI_PROMPTS)
    if (limited) return limited

    const body = await request.json()
    const { checkInType } = body

    // Validate checkInType
    let validatedCheckInType: 'daily' | 'weekly'
    try {
      validatedCheckInType = validateCheckInType(checkInType)
    } catch (err) {
      if (err instanceof ValidationException) {
        logValidationError(err.errors, 'POST /api/prompts')
        logger.warn('Validation failed on /api/prompts', { userId: user.id, errors: err.errors }, 'api')
        return NextResponse.json(
          { error: 'Invalid request', details: err.errors },
          { status: 400 }
        )
      }
      throw err
    }

    logger.info('POST /api/prompts', { userId: user.id, checkInType: validatedCheckInType }, 'api')

    const { data: entries, error } = await supabase
      .from('journal_entries')
      .select('id, content, created_at, prompt_used')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5)

    if (error) {
      logger.error('Failed to fetch journal entries', error, 'api')
      return NextResponse.json({ error: 'Failed to fetch entries' }, { status: 500 })
    }

    logger.debug('Fetched recent entries', { count: entries?.length ?? 0 }, 'api')

    // Fetch active goals for context
    const [evalGoalsRes, personalGoalsRes] = await Promise.all([
      supabase.from('evaluation_goals').select('title, status').eq('user_id', user.id).neq('status', 'cancelled'),
      supabase.from('personal_goals').select('title, category, priority, status').eq('user_id', user.id).eq('status', 'active'),
    ])

    const goals = {
      evaluationGoals: evalGoalsRes.data ?? [],
      personalGoals: personalGoalsRes.data ?? [],
    }

    const prompts = await generateSmartPrompts(entries || [], validatedCheckInType, goals)

    logger.info('Prompts generated successfully', { count: prompts.length }, 'api')
    return NextResponse.json({ prompts })
  } catch (error) {
    logger.error('Unhandled error in POST /api/prompts', error, 'api')
    return NextResponse.json(
      {
        error: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && {
          detail: error instanceof Error ? error.message : String(error),
        }),
      },
      { status: 500 }
    )
  }
}
