import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Nav } from '@/components/nav'
import { SummaryDetail } from './summary-detail'

export default async function SummaryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: summary } = await supabase
    .from('summaries')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!summary) notFound()

  return (
    <>
      <Nav />
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-8">
        <SummaryDetail summary={summary} />
      </div>
    </>
  )
}