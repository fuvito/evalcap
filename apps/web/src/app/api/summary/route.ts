import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateSummary } from '@/lib/claude'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { timeframeStart, timeframeEnd, userInstructions } = await request.json()

    if (!timeframeStart || !timeframeEnd) {
      return NextResponse.json({ error: 'Timeframe is required' }, { status: 400 })
    }

    // Fetch journal entries in the given timeframe
    const { data: entries, error } = await supabase
      .from('journal_entries')
      .select('id, content, created_at')
      .eq('user_id', user.id)
      .gte('created_at', timeframeStart)
      .lte('created_at', timeframeEnd)
      .order('created_at', { ascending: true })

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch entries' }, { status: 500 })
    }

    if (!entries || entries.length === 0) {
      return NextResponse.json(
        { error: 'No journal entries found for this timeframe' },
        { status: 400 }
      )
    }

    const timeframe = `${timeframeStart} to ${timeframeEnd}`
    const summary = await generateSummary(entries, timeframe, userInstructions)

    // Save summary to database
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
      console.error('Failed to save summary:', saveError)
      // Still return the summary even if saving fails
    }

    return NextResponse.json({
      summary,
      summaryId: savedSummary?.id,
      entriesUsed: entries.length,
    })
  } catch (error) {
    console.error('Error generating summary:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
