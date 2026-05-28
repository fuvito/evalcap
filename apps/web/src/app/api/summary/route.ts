import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateSummary } from '@/lib/claude'
import { logger } from '@/lib/logger'
import { validateDateString, validateOptionalString, ValidationException, logValidationError } from '@/lib/validation'
import { checkRateLimit, getRateLimitInfo, type RateLimitConfig } from '@/lib/rate-limit'

const SUMMARY_RATE_LIMIT: RateLimitConfig = {
  maxRequests: 5,
  windowMs: 60 * 1000, // 1 minute
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      logger.warn('Unauthenticated request to /api/summary', undefined, 'api')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check rate limit (expensive operation)
    if (!checkRateLimit(user.id, SUMMARY_RATE_LIMIT)) {
      const rateInfo = getRateLimitInfo(user.id, SUMMARY_RATE_LIMIT)
      logger.warn('Rate limit exceeded for /api/summary', { userId: user.id }, 'api')
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: `Too many summary requests. Please try again after ${rateInfo.resetAt.toISOString()}`,
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

    const timeframe = `${validatedStart} to ${validatedEnd}`
    const summary = await generateSummary(entries, timeframe, validatedInstructions || undefined)

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
