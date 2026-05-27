import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateSmartPrompts } from '@/lib/claude'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      logger.warn('Unauthenticated request to /api/prompts', undefined, 'api')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { checkInType } = await request.json()
    logger.info('POST /api/prompts', { userId: user.id, checkInType }, 'api')

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

    const prompts = await generateSmartPrompts(entries || [], checkInType || 'weekly')

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
