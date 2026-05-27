import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateSmartPrompts } from '@/lib/claude'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { checkInType } = await request.json()

    // Fetch user's recent journal entries for context
    const { data: entries, error } = await supabase
      .from('journal_entries')
      .select('id, content, created_at, prompt_used')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5)

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch entries' }, { status: 500 })
    }

    const prompts = await generateSmartPrompts(entries || [], checkInType || 'weekly')

    return NextResponse.json({ prompts })
  } catch (error) {
    console.error('Error generating prompts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
