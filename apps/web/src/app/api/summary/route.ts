import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateSummary } from '@/lib/claude'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      logger.warn('Unauthenticated request to /api/summary', undefined, 'api')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { timeframeStart, timeframeEnd, userInstructions } = await request.json()
    logger.info('POST /api/summary', { userId: user.id, timeframeStart, timeframeEnd }, 'api')

    if (!timeframeStart || !timeframeEnd) {
      return NextResponse.json({ error: 'Timeframe is required' }, { status: 400 })
    }

    const { data: entries, error } = await supabase
      .from('journal_entries')
      .select('id, content, created_at')
      .eq('user_id', user.id)
      .gte('created_at', timeframeStart)
      .lte('created_at', timeframeEnd)
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

    const timeframe = `${timeframeStart} to ${timeframeEnd}`
    const summary = await generateSummary(entries, timeframe, userInstructions)

    const { data: savedSummary, error: saveError } = await supabase
      .from('summaries')
      .insert({
        user_id: user.id,
        content: summary,
        timeframe_start: timeframeStart,
        timeframe_end: timeframeEnd,
        user_instructions: userInstructions || null,
      })
      .select()
      .single()

    if (saveError) {
      logger.warn('Failed to save summary to DB (returning result anyway)', saveError, 'api')
    } else {
      logger.info('Summary saved', { summaryId: savedSummary?.id }, 'api')
    }

    return NextResponse.json({
      summary,
      summaryId: savedSummary?.id,
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
