import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import { rateLimit, LIMITS } from '@/lib/rate-limit'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const limited = rateLimit(user.id, 'account.export', LIMITS.EXPORT)
    if (limited) return limited

    const [{ data: entries }, { data: summaries }, { data: profile }] = await Promise.all([
      supabase.from('journal_entries').select('*').eq('user_id', user.id).order('created_at', { ascending: true }),
      supabase.from('summaries').select('*').eq('user_id', user.id).order('created_at', { ascending: true }),
      supabase.from('profiles').select('*').eq('id', user.id).single(),
    ])

    const exportData = {
      exported_at: new Date().toISOString(),
      account: { email: user.email, created_at: user.created_at },
      profile: profile ?? {},
      journal_entries: entries ?? [],
      summaries: summaries ?? [],
    }

    logger.info('Data exported', { userId: user.id }, 'api')

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="evalcap-export-${new Date().toISOString().split('T')[0]}.json"`,
      },
    })
  } catch (error) {
    logger.error('Unhandled error in GET /api/account/export', error, 'api')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
