'use client'

import { useState } from 'react'

type Stats = {
  total: number
  daily: number
  weekly: number
  last7Days: number
  last30Days: number
  summaries: number
  firstEntryDate: string | null
  lastEntryDate: string | null
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function EntryStats({ userId }: { userId: string }) {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/users/${userId}/stats`)
      if (!res.ok) throw new Error('Failed to load')
      setStats(await res.json())
    } catch {
      setError('Could not load statistics.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-sm font-semibold text-slate-700">Entry Statistics</h2>
        {!stats && (
          <button
            onClick={load}
            disabled={loading}
            className="text-xs text-brand-600 hover:text-brand-700 font-medium disabled:opacity-50 transition-colors"
          >
            {loading ? 'Loading…' : 'Load'}
          </button>
        )}
      </div>

      {error && <p className="text-xs text-red-500 mt-2">{error}</p>}

      {!stats && !error && (
        <p className="text-xs text-slate-400 mt-1">Click Load to view statistics.</p>
      )}

      {stats && (
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-400">Total check-ins</dt>
            <dd className="font-semibold text-slate-800">{stats.total}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-400">Daily</dt>
            <dd className="text-slate-700">{stats.daily}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-400">Weekly</dt>
            <dd className="text-slate-700">{stats.weekly}</dd>
          </div>
          <div className="border-t border-slate-100 pt-2 flex justify-between">
            <dt className="text-slate-400">Last 7 days</dt>
            <dd className="text-slate-700">{stats.last7Days}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-400">Last 30 days</dt>
            <dd className="text-slate-700">{stats.last30Days}</dd>
          </div>
          <div className="border-t border-slate-100 pt-2 flex justify-between">
            <dt className="text-slate-400">Summaries generated</dt>
            <dd className="text-slate-700">{stats.summaries}</dd>
          </div>
          {stats.firstEntryDate && (
            <div className="border-t border-slate-100 pt-2 flex justify-between">
              <dt className="text-slate-400">First entry</dt>
              <dd className="text-slate-700 text-xs">{fmt(stats.firstEntryDate)}</dd>
            </div>
          )}
          {stats.lastEntryDate && (
            <div className="flex justify-between">
              <dt className="text-slate-400">Last entry</dt>
              <dd className="text-slate-700 text-xs">{fmt(stats.lastEntryDate)}</dd>
            </div>
          )}
          {stats.total === 0 && (
            <p className="text-xs text-slate-400 pt-1">No check-ins yet.</p>
          )}
        </dl>
      )}
    </div>
  )
}
