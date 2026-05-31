import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

async function pingSupabase() {
  try {
    const admin = createAdminClient()
    const start = Date.now()
    const { error } = await admin.from('profiles').select('id').limit(1)
    if (error) throw error
    return { ok: true, latency: Date.now() - start }
  } catch {
    return { ok: false, latency: null }
  }
}

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span className={`inline-block w-2.5 h-2.5 rounded-full ${ok ? 'bg-green-500' : 'bg-red-500'}`} />
  )
}

function HealthRow({ label, ok, detail }: { label: string; ok: boolean; detail: string }) {
  return (
    <div className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-4 py-3">
      <div className="flex items-center gap-3">
        <StatusDot ok={ok} />
        <span className="text-sm font-medium text-slate-700">{label}</span>
      </div>
      <span className={`text-xs font-medium ${ok ? 'text-green-600' : 'text-red-600'}`}>
        {detail}
      </span>
    </div>
  )
}

export default async function HealthPage() {
  const supabase = await pingSupabase()
  const serviceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-800">System Health</h1>
        <p className="text-sm text-slate-500 mt-1">Checked at {new Date().toLocaleTimeString()}</p>
      </div>

      <div className="space-y-3 max-w-lg">
        <HealthRow
          label="Supabase Database"
          ok={supabase.ok}
          detail={supabase.ok ? `${supabase.latency}ms` : 'Unreachable'}
        />
        <HealthRow
          label="Service Role Key"
          ok={serviceKey}
          detail={serviceKey ? 'Configured' : 'Missing SUPABASE_SERVICE_ROLE_KEY'}
        />
        <HealthRow label="App" ok={true} detail="Running" />
      </div>
    </div>
  )
}
