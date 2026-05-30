import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { revalidateTag } from 'next/cache'
import { logger } from '@/lib/logger'
import { validateDateString, validateOptionalString, ValidationException } from '@/lib/validation'
import { rateLimit, LIMITS } from '@/lib/rate-limit'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const limited = rateLimit(user.id, 'cycles.write', LIMITS.WRITE)
    if (limited) return limited

    const { id } = await params
    const body = await request.json()
    const { name, start_date, end_date, status } = body

    const update: Record<string, string> = {}

    try {
      if (name !== undefined) {
        const validatedName = validateOptionalString(name, 'name', 100)
        if (!validatedName) throw new ValidationException([{ field: 'name', message: 'Name cannot be empty' }])
        update.name = validatedName
      }
      if (start_date !== undefined) {
        validateDateString(start_date, 'start_date')
        update.start_date = start_date
      }
      if (end_date !== undefined) {
        validateDateString(end_date, 'end_date')
        update.end_date = end_date
      }
      if (status !== undefined) {
        if (status !== 'active' && status !== 'archived') {
          throw new ValidationException([{ field: 'status', message: 'Must be "active" or "archived"' }])
        }
        update.status = status
      }
    } catch (err) {
      if (err instanceof ValidationException) {
        return NextResponse.json({ error: 'Invalid request', details: err.errors }, { status: 400 })
      }
      throw err
    }

    const { data: cycle, error } = await supabase
      .from('performance_cycles')
      .update(update)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      logger.error('Failed to update cycle', error, 'api')
      return NextResponse.json({ error: 'Failed to update cycle' }, { status: 500 })
    }

    if (!cycle) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    revalidateTag(`cycles-${user.id}`)
    return NextResponse.json({ cycle })
  } catch (error) {
    logger.error('Unhandled error in PATCH /api/cycles/[id]', error, 'api')
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

    const limited = rateLimit(user.id, 'cycles.write', LIMITS.WRITE)
    if (limited) return limited

    const { id } = await params

    const { error } = await supabase
      .from('performance_cycles')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      logger.error('Failed to delete cycle', error, 'api')
      return NextResponse.json({ error: 'Failed to delete cycle' }, { status: 500 })
    }

    revalidateTag(`cycles-${user.id}`)
    logger.info('Cycle deleted', { userId: user.id, cycleId: id }, 'api')
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    logger.error('Unhandled error in DELETE /api/cycles/[id]', error, 'api')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
