import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export default async function AdminAuditPage() {
  const admin = createAdminClient()

  const { data: logs } = await admin
    .from('admin_audit_log')
    .select('id, admin_id, action, target_user_id, detail, created_at')
    .order('created_at', { ascending: false })
    .limit(100)

  // Enrich with emails from profiles
  const allIds = [
    ...new Set(
      [
        ...(logs ?? []).map(l => l.admin_id),
        ...(logs ?? []).map(l => l.target_user_id),
      ].filter((id): id is string => id !== null)
    ),
  ]

  const emailMap = new Map<string, string>()
  if (allIds.length > 0) {
    const { data: profiles } = await admin
      .from('profiles')
      .select('id, email')
      .in('id', allIds)
    profiles?.forEach(p => emailMap.set(p.id, p.email))
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Audit Log</h1>
        <span className="text-sm text-slate-500">Last 100 events</span>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80">
              <th className="text-left px-4 py-3 font-medium text-slate-500 text-xs uppercase tracking-wide">Time</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500 text-xs uppercase tracking-wide">Admin</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500 text-xs uppercase tracking-wide">Action</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500 text-xs uppercase tracking-wide">Target</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500 text-xs uppercase tracking-wide">Detail</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {logs?.map(log => (
              <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors">
                <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                  {new Date(log.created_at).toLocaleString('en-US', {
                    month: 'short', day: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </td>
                <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300">
                  {log.admin_id ? (emailMap.get(log.admin_id) ?? log.admin_id.slice(0, 8) + '…') : '—'}
                </td>
                <td className="px-4 py-3">
                  <code className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded font-mono">
                    {log.action}
                  </code>
                </td>
                <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300">
                  {log.target_user_id
                    ? (emailMap.get(log.target_user_id) ?? log.target_user_id.slice(0, 8) + '…')
                    : '—'}
                </td>
                <td className="px-4 py-3 text-xs text-slate-400 max-w-xs truncate">
                  {log.detail ? JSON.stringify(log.detail) : '—'}
                </td>
              </tr>
            ))}
            {(!logs || logs.length === 0) && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-sm text-slate-400">
                  No audit events yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
