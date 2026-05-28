import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { revalidateTag } from 'next/cache'
import { logger } from '@/lib/logger'
import { validateDateString, validateOptionalString, ValidationException } from '@/lib/validation'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: cycles, error } = await supabase
      .from('performance_cycles')
      .select('*')
      .eq('user_id', user.id)
      .order('start_date', { ascending: false })

    if (error) {
      logger.error('Failed to fetch cycles', error, 'api')
      return NextResponse.json({ error: 'Failed to fetch cycles' }, { status: 500 })
    }

    return NextResponse.json({ cycles })
  } catch (error) {
    logger.error('Unhandled error in GET /api/cycles', error, 'api')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, start_date, end_date } = body

    try {
      const validatedName = validateOptionalString(name, 'name', 100)
      if (!validatedName) throw new ValidationException([{ field: 'name', message: 'Name is required' }])
      validateDateString(start_date, 'start_date')
      validateDateString(end_date, 'end_date')
      if (new Date(start_date) > new Date(end_date)) {
        throw new ValidationException([{ field: 'start_date', message: 'Start date must be before end date' }])
      }
    } catch (err) {
      if (err instanceof ValidationException) {
        return NextResponse.json({ error: 'Invalid request', details: err.errors }, { status: 400 })
      }
      throw err
    }

    const { data: cycle, error } = await supabase
      .from('performance_cycles')
      .insert({ user_id: user.id, name: name.trim(), start_date, end_date })
      .select()
      .single()

    if (error) {
      logger.error('Failed to create cycle', error, 'api')
      return NextResponse.json({ error: 'Failed to create cycle' }, { status: 500 })
    }

    revalidateTag(`cycles-${user.id}`)
    logger.info('Cycle created', { userId: user.id, cycleId: cycle.id }, 'api')
    return NextResponse.json({ cycle }, { status: 201 })
  } catch (error) {
    logger.error('Unhandled error in POST /api/cycles', error, 'api')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
