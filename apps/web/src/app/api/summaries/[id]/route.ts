import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { revalidateTag, revalidatePath } from 'next/cache'
import { logger } from '@/lib/logger'
import { sanitizeText, ValidationException } from '@/lib/validation'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    let content: string
    try {
      content = sanitizeText(body.content)
    } catch (err) {
      if (err instanceof ValidationException) {
        return NextResponse.json({ error: 'Invalid request', details: err.errors }, { status: 400 })
      }
      throw err
    }

    const { data, error } = await supabase
      .from('summaries')
      .update({ content })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error || !data) {
      logger.error('Failed to update summary', error, 'api')
      return NextResponse.json({ error: 'Summary not found or update failed' }, { status: 404 })
    }

    revalidateTag(`summaries-${user.id}`)
    revalidatePath('/summaries')
    logger.info('Summary updated', { summaryId: id }, 'api')
    return NextResponse.json({ summary: data })
  } catch (error) {
    logger.error('Unhandled error in PATCH /api/summaries/[id]', error, 'api')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const { error } = await supabase
      .from('summaries')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      logger.error('Failed to delete summary', error, 'api')
      return NextResponse.json({ error: 'Failed to delete summary' }, { status: 500 })
    }

    revalidateTag(`summaries-${user.id}`)
    revalidatePath('/summaries')
    logger.info('Summary deleted', { summaryId: id }, 'api')
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    logger.error('Unhandled error in DELETE /api/summaries/[id]', error, 'api')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
