import { NextRequest, NextResponse } from 'next/server'
import { createClient, createClientFromToken } from '@/lib/supabase/server'
import { generateSummary } from '@/lib/claude'
import { logger } from '@/lib/logger'
import { validateDateString, validateOptionalString, ValidationException, logValidationError } from '@/lib/validation'
import { rateLimit, LIMITS } from '@/lib/rate-limit'
import { checkSummaryLimit } from '@/lib/subscription'

export async function POST(request: NextRequest) {
  try {
    const bearer = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
    const supabase = bearer ? createClientFromToken(bearer) : await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser(bearer)
    if (authError || !user) {
      logger.warn('Unauthenticated request to /api/summary', undefined, 'api')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const limited = rateLimit(user.id, 'ai.summary', LIMITS.AI_SUMMARY)
    if (limited) return limited

    const limitCheck = await checkSummaryLimit(user.id)
    if (!limitCheck.allowed) {
      logger.warn('Monthly summary limit reached', { userId: user.id, ...limitCheck }, 'api')
      return NextResponse.json(
        { error: 'Monthly summary limit reached', used: limitCheck.used, limit: limitCheck.limit, plan: limitCheck.plan },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { timeframeStart, timeframeEnd, userInstructions } = body

    // Validate timeframe dates
    let validatedStart: string
    let validatedEnd: string
    let validatedInstructions: string | null
    try {
      validatedStart = validateDateString(timeframeStart, 'timeframeStart')
      validatedEnd = validateDateString(timeframeEnd, 'timeframeEnd')
      validatedInstructions = validateOptionalString(userInstructions, 'userInstructions', 500)
    } catch (err) {
      if (err instanceof ValidationException) {
        logValidationError(err.errors, 'POST /api/summary')
        logger.warn('Validation failed on /api/summary', { userId: user.id, errors: err.errors }, 'api')
        return NextResponse.json(
          { error: 'Invalid request', details: err.errors },
          { status: 400 }
        )
      }
      throw err
    }

    // Validate date range
    const start = new Date(validatedStart)
    const end = new Date(validatedEnd)
    if (start > end) {
      logger.warn('Invalid date range on /api/summary', { userId: user.id, start: validatedStart, end: validatedEnd }, 'api')
      return NextResponse.json(
        { error: 'Invalid request', details: [{ field: 'timeframeStart', message: 'Start date must be before end date' }] },
        { status: 400 }
      )
    }

    logger.info('POST /api/summary', { userId: user.id, timeframeStart: validatedStart, timeframeEnd: validatedEnd }, 'api')

    const { data: entries, error } = await supabase
      .from('journal_entries')
      .select('id, content, created_at')
      .eq('user_id', user.id)
      .gte('created_at', validatedStart)
      .lte('created_at', validatedEnd)
      .order('created_at', { ascending: true })

    if (error) {
      logger.error('Failed to fetch journal entries for summary', error, 'api')
      return NextResponse.json({ error: 'Failed to fetch entries' }, { status: 500 })
    }

    logger.debug('Fetched entries for summary', { count: entries?.length ?? 0 }, 'api')

    if (!entries || entries.length === 0) {
      return NextResponse.json(
        { error: 'No journal entries found for this timeframe' },
        { status: 400 }
      )
    }

    // Fetch goals for context (eval goals active during this period, active personal goals)
    const [evalGoalsRes, personalGoalsRes] = await Promise.all([
      supabase.from('evaluation_goals').select('title, status').eq('user_id', user.id).neq('status', 'cancelled'),
      supabase.from('personal_goals').select('title, category, priority, status').eq('user_id', user.id).eq('status', 'active'),
    ])

    const goals = {
      evaluationGoals: evalGoalsRes.data ?? [],
      personalGoals: personalGoalsRes.data ?? [],
    }

    const timeframe = `${validatedStart} to ${validatedEnd}`
    const summary = await generateSummary(entries, timeframe, validatedInstructions || undefined, goals)

    return NextResponse.json({
      summary,
      entriesUsed: entries.length,
    })
  } catch (error) {
    logger.error('Unhandled error in POST /api/summary', error, 'api')
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
