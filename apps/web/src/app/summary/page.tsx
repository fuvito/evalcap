'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Nav } from '@/components/nav'
import { SkeletonText } from '@/components/skeleton'

export default function SummaryPage() {
  const router = useRouter()
  const [timeframeStart, setTimeframeStart] = useState('')
  const [timeframeEnd, setTimeframeEnd] = useState('')
  const [userInstructions, setUserInstructions] = useState('')
  const [summary, setSummary] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleGenerate() {
    if (!timeframeStart || !timeframeEnd) return

    setLoading(true)
    setError('')
    setSummary('')

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

  return (
    <>
      <Nav />
    <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-6">
      <h1 className="text-2xl font-bold text-brand-700">Generate Summary</h1>
      <p className="text-gray-500 text-sm">
        Select a timeframe and EvalCap will compile your journal entries into a
        polished, honest performance review summary.
      </p>

      {/* Timeframe selection */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            From
          </label>
          <input
            type="date"
            value={timeframeStart}
            onChange={e => setTimeframeStart(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-2.5 text-sm text-gray-900 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            To
          </label>
          <input
            type="date"
            value={timeframeEnd}
            onChange={e => setTimeframeEnd(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-2.5 text-sm text-gray-900 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      {/* Optional instructions */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Additional instructions (optional)
        </label>
        <textarea
          value={userInstructions}
          onChange={e => setUserInstructions(e.target.value)}
          placeholder="E.g. Focus more on the Q2 product launch. Include leadership contributions."
          rows={3}
          className="w-full border border-gray-300 rounded-lg p-3 text-sm text-gray-900 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
        />
      </div>

      <button
        onClick={handleGenerate}
        disabled={!timeframeStart || !timeframeEnd || loading}
        className="w-full py-3 bg-brand-500 text-white rounded-lg font-medium hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Generating...' : 'Generate Summary'}
      </button>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm font-medium mb-1">Error generating summary</p>
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {loading && (
        <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-brand-500 rounded-full animate-bounce"></div>
            <p className="text-sm text-gray-600">Generating your summary...</p>
          </div>
          <div className="space-y-2">
            <SkeletonText className="h-4" />
            <SkeletonText className="h-4 w-5/6" />
            <SkeletonText className="h-4 w-4/6" />
          </div>
        </div>
      )}

      {/* Summary output */}
      {summary && !loading && (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold">Your Summary</h2>
            <div className="flex gap-2">
              <button
                onClick={() => navigator.clipboard.writeText(summary)}
                className="text-sm text-brand-500 hover:underline"
              >
                📋 Copy
              </button>
              <a
                href="/summaries"
                className="text-sm text-brand-500 hover:underline"
              >
                📚 View all
              </a>
            </div>
          </div>
          <textarea
            value={summary}
            onChange={e => setSummary(e.target.value)}
            rows={16}
            className="w-full border border-gray-300 rounded-lg p-4 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none font-mono bg-white"
          />
          <p className="text-xs text-gray-400">
            You can edit this summary directly above before copying or sharing it.
          </p>
          <button
            onClick={handleGenerate}
            className="text-sm text-brand-500 hover:underline"
          >
            🔄 Regenerate with different instructions →
          </button>
        </div>
      )}

      {/* Empty state - no summary generated yet */}
      {!summary && !loading && !error && (
        <div className="text-center py-12 bg-gradient-to-br from-brand-50 to-gray-50 rounded-xl border border-brand-100">
          <div className="text-4xl mb-3">✨</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to generate?</h3>
          <p className="text-gray-600 mb-6 max-w-sm mx-auto">
            Select a timeframe above and click "Generate Summary" to create your performance review from your check-ins.
          </p>
          <p className="text-sm text-gray-500">
            💡 Tip: Make sure you have check-ins in the selected timeframe first.
          </p>
        </div>
      )}
    </div>
    </>
  )
}
