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
    let { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    // If profile doesn't exist, create it on-demand
    if (profileError && profileError.code === 'PGRST116') {
      logger.info('Profile not found, creating on-demand', { userId: user.id }, 'api')
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert([
          {
            id: user.id,
            email: user.email,
          },
        ])
        .select()
        .single()

      if (createError) {
        logger.error('Failed to create profile on-demand', createError, 'api')
        return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 })
      }

      profile = newProfile
    } else if (profileError) {
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
    const { full_name, job_title, department, manager_name, default_check_in_type, onboarding_completed } = body

    // Validate inputs
    try {
      validateOptionalString(full_name, 'full_name', 100)
      validateOptionalString(job_title, 'job_title', 100)
      validateOptionalString(department, 'department', 100)
      validateOptionalString(manager_name, 'manager_name', 100)

      // Validate check-in type if provided
      if (default_check_in_type && !['daily', 'weekly'].includes(default_check_in_type)) {
        throw new ValidationException([
          { field: 'default_check_in_type', message: 'Must be "daily" or "weekly"' },
        ])
      }
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

    // Check if profile exists, create if missing
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single()

    if (checkError && checkError.code === 'PGRST116') {
      logger.info('Profile not found, creating before update', { userId: user.id }, 'api')
      const { error: createError } = await supabase
        .from('profiles')
        .insert([
          {
            id: user.id,
            email: user.email,
          },
        ])

      if (createError) {
        logger.error('Failed to create profile', createError, 'api')
        return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 })
      }
    } else if (checkError) {
      logger.error('Failed to check profile existence', checkError, 'api')
      return NextResponse.json({ error: 'Failed to check profile' }, { status: 500 })
    }

    // Build update object with provided fields
    const updateData: Record<string, any> = {}
    if (full_name !== undefined) updateData.full_name = full_name
    if (job_title !== undefined) updateData.job_title = job_title
    if (department !== undefined) updateData.department = department
    if (manager_name !== undefined) updateData.manager_name = manager_name
    if (default_check_in_type !== undefined) updateData.default_check_in_type = default_check_in_type
    if (onboarding_completed !== undefined) updateData.onboarding_completed = onboarding_completed

    // Update profile
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
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
