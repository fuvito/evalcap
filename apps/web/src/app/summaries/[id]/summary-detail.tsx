'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Summary } from '@/types/database'
import { logger } from '@/lib/logger'

interface SummaryDetailProps {
  summary: Summary
}

export function SummaryDetail({ summary: initial }: SummaryDetailProps) {
  const router = useRouter()
  const [content, setContent] = useState(initial.content)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [error, setError] = useState('')

  const regenerateHref = `/summary?start=${initial.timeframe_start}&end=${initial.timeframe_end}`

  async function handleSave() {
    setSaving(true)
    setError('')
    setSaveSuccess(false)

    try {
      const res = await fetch(`/api/summaries/${initial.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to save')
        return
      }

      setDirty(false)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
      logger.info('Summary updated', { summaryId: initial.id }, 'summary-detail')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    setError('')

    try {
      const res = await fetch(`/api/summaries/${initial.id}`, { method: 'DELETE' })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to delete')
        setDeleting(false)
        return
      }

      logger.info('Summary deleted', { summaryId: initial.id }, 'summary-detail')
      router.push('/summaries')
      router.refresh()
    } catch {
      setError('Something went wrong. Please try again.')
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/summaries"
          className="text-xs text-gray-400 dark:text-slate-500 hover:text-brand-600 dark:hover:text-brand-400 transition-colors mb-3 inline-flex items-center gap-1"
        >
          ← All Summaries
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-1">
          <div>
            <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
              {new Date(initial.timeframe_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              {' – '}
              {new Date(initial.timeframe_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </h1>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
              Generated {new Date(initial.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => navigator.clipboard.writeText(content)}
              className="px-3 py-2 text-xs text-gray-500 dark:text-slate-400 border border-gray-200 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
            >
              Copy
            </button>
            <Link
              href={regenerateHref}
              className="px-3 py-2 text-xs text-gray-500 dark:text-slate-400 border border-gray-200 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors whitespace-nowrap"
            >
              Regenerate →
            </Link>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-3 py-2 text-xs text-red-500 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl p-4">
          <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Content */}
      <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl p-6 shadow-sm space-y-4">
        {initial.user_instructions && (
          <div className="bg-gray-50 dark:bg-slate-700 rounded-lg px-4 py-3">
            <p className="text-xs font-medium text-gray-400 dark:text-slate-500 uppercase tracking-wide mb-1">Instructions used</p>
            <p className="text-sm text-gray-600 dark:text-slate-300">{initial.user_instructions}</p>
          </div>
        )}

        <textarea
          value={content}
          onChange={e => { setContent(e.target.value); setDirty(true); setSaveSuccess(false) }}
          rows={20}
          className="w-full border border-gray-200 dark:border-slate-600 rounded-lg p-4 text-sm text-gray-800 dark:text-slate-200 bg-gray-50 dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-slate-600 resize-none transition-colors"
        />

        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400 dark:text-slate-500">You can edit this summary.</p>
          <div className="flex items-center gap-3">
            {saveSuccess && (
              <span className="text-xs text-green-600 dark:text-green-400">Saved</span>
            )}
            <button
              onClick={handleSave}
              disabled={saving || !dirty}
              className="px-4 py-1.5 bg-brand-600 text-white text-xs rounded-lg font-medium hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <p className="text-sm text-red-700 dark:text-red-400 mb-3">Delete this summary? This cannot be undone.</p>
          <div className="flex gap-2">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors font-medium"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              disabled={deleting}
              className="flex-1 py-2 border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-400 text-sm rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}