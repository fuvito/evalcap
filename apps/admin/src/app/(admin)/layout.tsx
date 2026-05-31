import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { AdminNav } from '@/components/admin-nav'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const adminDb = createAdminClient()
  const { data: admin } = await adminDb
    .from('admins')
    .select('id, email')
    .eq('id', user.id)
    .single()

  if (!admin) redirect('/login?error=unauthorized')

  return (
    <div className="min-h-screen bg-slate-100 flex">
      <aside className="w-52 shrink-0 bg-slate-900 flex flex-col">
        <div className="px-4 py-4 border-b border-slate-700">
          <p className="text-white font-semibold text-sm">EvalCap Admin</p>
          <p className="text-slate-500 text-xs mt-0.5 truncate">{admin.email}</p>
        </div>
        <div className="flex-1 p-3">
          <AdminNav />
        </div>
        <div className="p-3 border-t border-slate-700 space-y-1">
          <form action="/auth/signout" method="POST">
            <button
              type="submit"
              className="block w-full text-left text-xs text-slate-400 hover:text-slate-200 transition-colors px-1"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        {children}
      </div>
    </div>
  )
}
