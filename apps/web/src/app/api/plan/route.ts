import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkSummaryLimit } from '@/lib/subscription'

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { plan, used, limit } = await checkSummaryLimit(user.id)
  return NextResponse.json({ plan, used, limit })
}
