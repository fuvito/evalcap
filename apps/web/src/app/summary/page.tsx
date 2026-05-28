'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Nav } from '@/components/nav'
import { SkeletonText } from '@/components/skeleton'
import type { PerformanceCycle } from '@/types/database'

export default function SummaryPage() {
  const params = useSearchParams()
  const [timeframeStart, setTimeframeStart] = useState(params.get('start') ?? '')
  const [timeframeEnd, setTimeframeEnd] = useState(params.get('end') ?? '')
  const [userInstructions, setUserInstructions] = useState('')
  const [summary, setSummary] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [cycles, setCycles] = useState<PerformanceCycle[]>([])

  useEffect(() => {
    fetch('/api/cycles').then(r => r.json()).then(d => {
      if (d.cycles) setCycles(d.cycles.filter((c: PerformanceCycle) => c.status === 'active'))
    }).catch(() => {})
  }, [])

  async function handleGenerate() {
    if (!timeframeStart || !timeframeEnd) return

    setLoading(true)
    setError('')
    setSummary('')
    setSaved(false)

    try {
      const res = await fetch('/api/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timeframeStart, timeframeEnd, userInstructions }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to generate summary')
        return
      }

      setSummary(data.summary)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!summary.trim()) return

    setSaving(true)
    setError('')

    try {
      const res = await fetch('/api/summaries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timeframeStart, timeframeEnd, content: summary, userInstructions }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to save summary')
        return
      }

      setSaved(true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Nav />
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">Generate Summary</h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">
            Select a timeframe and EvalCap will compile your journal entries into a polished, honest performance review summary.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl p-6 shadow-sm space-y-5">
          {cycles.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
                Fill from cycle (optional)
              </label>
              <select
                defaultValue=""
                onChange={e => {
                  const cycle = cycles.find(c => c.id === e.target.value)
                  if (cycle) { setTimeframeStart(cycle.start_date); setTimeframeEnd(cycle.end_date) }
                }}
                className="w-full border border-gray-200 dark:border-slate-600 rounded-lg p-2.5 text-sm text-gray-800 dark:text-slate-200 bg-gray-50 dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors"
              >
                <option value="">Select a cycle…</option>
                {cycles.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
                From
              </label>
              <input
                type="date"
                value={timeframeStart}
                onChange={e => setTimeframeStart(e.target.value)}
                className="w-full border border-gray-200 dark:border-slate-600 rounded-lg p-2.5 text-sm text-gray-800 dark:text-slate-200 bg-gray-50 dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-slate-600 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
                To
              </label>
              <input
                type="date"
                value={timeframeEnd}
                onChange={e => setTimeframeEnd(e.target.value)}
                className="w-full border border-gray-200 dark:border-slate-600 rounded-lg p-2.5 text-sm text-gray-800 dark:text-slate-200 bg-gray-50 dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-slate-600 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
              Additional instructions (optional)
            </label>
            <textarea
              value={userInstructions}
              onChange={e => setUserInstructions(e.target.value)}
              placeholder="e.g. Focus on the Q2 product launch. Include leadership contributions."
              rows={3}
              className="w-full border border-gray-200 dark:border-slate-600 rounded-lg p-3 text-sm text-gray-800 dark:text-slate-200 bg-gray-50 dark:bg-slate-700 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-slate-600 transition-colors resize-none"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={!timeframeStart || !timeframeEnd || loading}
            className="w-full py-2.5 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm"
          >
            {loading ? 'Generating...' : 'Generate Summary'}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl p-4">
            <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
          </div>
        )}

        {loading && (
          <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl p-5 shadow-sm space-y-3">
            <p className="text-sm text-gray-500 dark:text-slate-400">Generating your summary...</p>
            <div className="space-y-2">
              <SkeletonText className="h-4" />
              <SkeletonText className="h-4 w-5/6" />
              <SkeletonText className="h-4 w-4/6" />
            </div>
          </div>
        )}

        {summary && !loading && (
          <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">Your Summary</h2>
              <div className="flex gap-3">
                <button
                  onClick={() => navigator.clipboard.writeText(summary)}
                  className="text-xs text-gray-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                >
                  Copy
                </button>
                <a
                  href="/summaries"
                  className="text-xs text-gray-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                >
                  View saved →
                </a>
              </div>
            </div>

            <textarea
              value={summary}
              onChange={e => { setSummary(e.target.value); setSaved(false) }}
              rows={16}
              className="w-full border border-gray-200 dark:border-slate-600 rounded-lg p-4 text-sm text-gray-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none bg-gray-50 dark:bg-slate-700"
            />

            <div className="flex items-center justify-between">
              <button
                onClick={handleGenerate}
                className="text-xs text-gray-400 dark:text-slate-500 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
              >
                Regenerate →
              </button>
              <div className="flex items-center gap-3">
                {saved && (
                  <span className="text-xs text-green-600 dark:text-green-400">Saved</span>
                )}
                <button
                  onClick={handleSave}
                  disabled={saving || saved}
                  className="px-4 py-1.5 bg-brand-600 text-white text-xs rounded-lg font-medium hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? 'Saving...' : saved ? 'Saved' : 'Save Summary'}
                </button>
              </div>
            </div>
          </div>
        )}

        {!summary && !loading && !error && (
          <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm">
            <div className="text-3xl mb-3">✨</div>
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-2">Ready to generate?</h3>
            <p className="text-gray-500 dark:text-slate-400 text-sm max-w-sm mx-auto">
              Select a timeframe above and click "Generate Summary" to create your performance review from your check-ins.
            </p>
          </div>
        )}
      </div>
    </>
  )
}
