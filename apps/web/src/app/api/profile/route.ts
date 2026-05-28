import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import { validateOptionalString, ValidationException } from '@/lib/validation'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      logger.warn('Unauthenticated request to GET /api/profile', undefined, 'api')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    logger.info('GET /api/profile', { userId: user.id }, 'api')

    // Fetch profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      logger.error('Failed to fetch profile', profileError, 'api')
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
    }

    // Fetch stats (entry count, last check-in date)
    const { data: entries, error: entriesError } = await supabase
      .from('journal_entries')
      .select('id, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (entriesError) {
      logger.error('Failed to fetch entry stats', entriesError, 'api')
      return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
    }

    const entryCount = entries?.length ?? 0
    const lastCheckIn = entries?.[0]?.created_at ?? null

    logger.info('Profile fetched successfully', { userId: user.id, entryCount }, 'api')

    return NextResponse.json({
      profile,
      stats: {
        entryCount,
        lastCheckIn,
      },
    })
  } catch (error) {
    logger.error('Unhandled error in GET /api/profile', error, 'api')
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

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      logger.warn('Unauthenticated request to PATCH /api/profile', undefined, 'api')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { full_name, job_title, department, manager_name } = body

    // Validate inputs
    try {
      validateOptionalString(full_name, 'full_name', 100)
      validateOptionalString(job_title, 'job_title', 100)
      validateOptionalString(department, 'department', 100)
      validateOptionalString(manager_name, 'manager_name', 100)
    } catch (err) {
      if (err instanceof ValidationException) {
        logger.warn('Validation failed on PATCH /api/profile', { userId: user.id, errors: err.errors }, 'api')
        return NextResponse.json(
          { error: 'Invalid request', details: err.errors },
          { status: 400 }
        )
      }
      throw err
    }

    logger.info('PATCH /api/profile', { userId: user.id }, 'api')

    // Update profile
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({
        full_name: full_name ?? undefined,
        job_title: job_title ?? undefined,
        department: department ?? undefined,
        manager_name: manager_name ?? undefined,
      })
      .eq('id', user.id)
      .select()
      .single()

    if (updateError) {
      logger.error('Failed to update profile', updateError, 'api')
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    logger.info('Profile updated successfully', { userId: user.id }, 'api')

    return NextResponse.json({ profile: updatedProfile })
  } catch (error) {
    logger.error('Unhandled error in PATCH /api/profile', error, 'api')
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
