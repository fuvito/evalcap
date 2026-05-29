import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { AdminNav } from './admin-nav'

export const metadata = { title: 'Admin — EvalCap' }

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, email')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex">
      {/* Sidebar */}
      <aside className="w-52 shrink-0 bg-slate-900 flex flex-col">
        <div className="px-4 py-4 border-b border-slate-700">
          <p className="text-white font-semibold text-sm">EvalCap Admin</p>
          <p className="text-slate-500 text-xs mt-0.5 truncate">{profile?.email}</p>
        </div>
        <div className="flex-1 p-3">
          <AdminNav />
        </div>
        <div className="p-3 border-t border-slate-700">
          <Link
            href="/dashboard"
            className="block text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            ← Back to app
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {children}
      </div>
    </div>
  )
}
