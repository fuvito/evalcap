import { createClient } from '@/lib/supabase/server'
import { revalidateTag, revalidatePath } from 'next/cache'
import { logger } from '@/lib/logger'
import { sanitizeText } from '@/lib/validation'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: entry, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error || !entry) {
      logger.warn('Entry not found', { entryId: id }, 'api/entries')
      return Response.json({ error: 'Entry not found' }, { status: 404 })
    }

    return Response.json({ entry })
  } catch (err) {
    logger.error('Error fetching entry', err, 'api/entries')
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { content } = await request.json()

    // Validate content
    if (!content || typeof content !== 'string') {
      logger.warn('Invalid content in entry update', { entryId: id }, 'api/entries')
      return Response.json({ error: 'Content is required' }, { status: 400 })
    }

    if (content.trim().length === 0) {
      return Response.json({ error: 'Content cannot be empty' }, { status: 400 })
    }

    if (content.length > 10000) {
      return Response.json({ error: 'Content exceeds maximum length (10000 chars)' }, { status: 400 })
    }

    // Sanitize content
    const sanitizedContent = sanitizeText(content)

    // Update the entry (RLS will ensure user can only update their own entries)
    const { data: entry, error } = await supabase
      .from('journal_entries')
      .update({ content: sanitizedContent })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      logger.error('Failed to update entry', error, 'api/entries')
      return Response.json({ error: 'Failed to update entry' }, { status: 500 })
    }

    if (!entry) {
      return Response.json({ error: 'Entry not found or unauthorized' }, { status: 404 })
    }

    revalidateTag(`entries-${user.id}`)
    revalidatePath('/history')
    logger.info('Entry updated', { entryId: id }, 'api/entries')
    return Response.json({ entry })
  } catch (err) {
    logger.error('Error updating entry', err, 'api/entries')
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Delete the entry (RLS will ensure user can only delete their own entries)
    const { error } = await supabase
      .from('journal_entries')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      logger.error('Failed to delete entry', error, 'api/entries')
      return Response.json({ error: 'Failed to delete entry' }, { status: 500 })
    }

    revalidateTag(`entries-${user.id}`)
    revalidatePath('/history')
    logger.info('Entry deleted', { entryId: id }, 'api/entries')
    return Response.json({ success: true })
  } catch (err) {
    logger.error('Error deleting entry', err, 'api/entries')
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
