import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { revalidateTag, revalidatePath } from 'next/cache'
import { sanitizeText, validateCheckInType, ValidationException } from '@/lib/validation'
import { logger } from '@/lib/logger'
import { rateLimit, LIMITS } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const limited = rateLimit(user.id, 'entries.write', LIMITS.WRITE)
    if (limited) return limited

    const body = await request.json()
    const { content, checkInType, promptUsed } = body

    let validatedContent: string
    let validatedCheckInType: 'daily' | 'weekly'
    try {
      validatedContent = sanitizeText(content)
      validatedCheckInType = validateCheckInType(checkInType)
    } catch (err) {
      if (err instanceof ValidationException) {
        return NextResponse.json({ error: 'Invalid request', details: err.errors }, { status: 400 })
      }
      throw err
    }

    const { data: entry, error } = await supabase
      .from('journal_entries')
      .insert({
        user_id: user.id,
        content: validatedContent,
        check_in_type: validatedCheckInType,
        prompt_used: promptUsed ?? null,
      })
      .select()
      .single()

    if (error) {
      logger.error('Failed to create entry', error, 'api')
      return NextResponse.json({ error: 'Failed to create entry' }, { status: 500 })
    }

    revalidateTag(`entries-${user.id}`)
    revalidatePath('/history')

    logger.info('Entry created', { entryId: entry.id }, 'api')
    return NextResponse.json({ entry }, { status: 201 })
  } catch (error) {
    logger.error('Unhandled error in POST /api/entries', error, 'api')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
