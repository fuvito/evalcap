import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { revalidateTag, revalidatePath } from 'next/cache'
import { logger } from '@/lib/logger'
import { sanitizeText, validateDateString, validateOptionalString, ValidationException, logValidationError } from '@/lib/validation'
import { rateLimit, LIMITS } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const limited = rateLimit(user.id, 'summaries.write', LIMITS.WRITE)
    if (limited) return limited

    const body = await request.json()
    const { timeframeStart, timeframeEnd, content, userInstructions } = body

    let validatedStart: string
    let validatedEnd: string
    let validatedContent: string
    let validatedInstructions: string | null
    try {
      validatedStart = validateDateString(timeframeStart, 'timeframeStart')
      validatedEnd = validateDateString(timeframeEnd, 'timeframeEnd')
      validatedContent = sanitizeText(content)
      if (!validatedContent) throw new ValidationException([{ field: 'content', message: 'Content is required' }])
      validatedInstructions = validateOptionalString(userInstructions, 'userInstructions', 500)
    } catch (err) {
      if (err instanceof ValidationException) {
        logValidationError(err.errors, 'POST /api/summaries')
        return NextResponse.json({ error: 'Invalid request', details: err.errors }, { status: 400 })
      }
      throw err
    }

    const { data: saved, error: saveError } = await supabase
      .from('summaries')
      .insert({
        user_id: user.id,
        content: validatedContent,
        timeframe_start: validatedStart,
        timeframe_end: validatedEnd,
        user_instructions: validatedInstructions,
      })
      .select()
      .single()

    if (saveError) {
      logger.error('Failed to save summary', saveError, 'api')
      return NextResponse.json({ error: 'Failed to save summary' }, { status: 500 })
    }

    revalidateTag(`summaries-${user.id}`)
    revalidatePath('/summaries')
    logger.info('Summary saved', { summaryId: saved.id }, 'api')
    return NextResponse.json({ summaryId: saved.id }, { status: 201 })
  } catch (error) {
    logger.error('Unhandled error in POST /api/summaries', error, 'api')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
