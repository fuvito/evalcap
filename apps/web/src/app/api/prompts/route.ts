import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateSmartPrompts } from '@/lib/claude'
import { logger } from '@/lib/logger'
import { validateCheckInType, ValidationException, logValidationError } from '@/lib/validation'
import { checkRateLimit, getRateLimitInfo, type RateLimitConfig } from '@/lib/rate-limit'

const PROMPTS_RATE_LIMIT: RateLimitConfig = {
  maxRequests: 10,
  windowMs: 60 * 1000, // 1 minute
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      logger.warn('Unauthenticated request to /api/prompts', undefined, 'api')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check rate limit
    if (!checkRateLimit(user.id, PROMPTS_RATE_LIMIT)) {
      const rateInfo = getRateLimitInfo(user.id, PROMPTS_RATE_LIMIT)
      logger.warn('Rate limit exceeded for /api/prompts', { userId: user.id }, 'api')
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: `Too many requests. Please try again after ${rateInfo.resetAt.toISOString()}`,
        },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil((rateInfo.resetAt.getTime() - Date.now()) / 1000).toString(),
          },
        }
      )
    }

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
