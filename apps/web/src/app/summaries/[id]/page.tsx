'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Nav } from '@/components/nav'
import { logger } from '@/lib/logger'
import { SkeletonText } from '@/components/skeleton'
import type { Summary } from '@/types/database'

export default function ViewSummaryPage() {
  const router = useRouter()
  const params = useParams()
  const summaryId = params.id as string
  const supabase = createClient()

  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    loadSummary()
  }, [summaryId])

  async function loadSummary() {
    try {
      const { data, error: fetchError } = await supabase
        .from('summaries')
        .select('*')
        .eq('id', summaryId)
        .single()

      if (fetchError || !data) {
        logger.error('Failed to load summary', fetchError, 'view-summary')
        setError('Summary not found')
        return
      }

      setSummary(data)
    } catch (err) {
      logger.error('Error loading summary', err, 'view-summary')
      setError('Error loading summary')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!window.confirm('Delete this summary? This cannot be undone.')) return

    setDeleting(true)
    try {
      const { error: deleteError } = await supabase
        .from('summaries')
        .delete()
        .eq('id', summaryId)

      if (deleteError) {
        logger.error('Failed to delete summary', deleteError, 'view-summary')
        alert('Failed to delete summary')
        return
      }

      logger.info('Summary deleted', { summaryId }, 'view-summary')
      router.push('/summaries')
    } catch (err) {
      logger.error('Error deleting summary', err, 'view-summary')
      alert('Error deleting summary')
    } finally {
      setDeleting(false)
    }
  }

  async function handleCopy() {
    if (!summary) return
    await navigator.clipboard.writeText(summary.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <>
        <Nav />
        <div className="max-w-3xl mx-auto px-4 md:px-8 py-8">
          <div className="space-y-4">
            <SkeletonText className="h-8 w-1/4" />
            <SkeletonText className="h-64 w-full" />
          </div>
        </div>
      </>
    )
  }

  if (!summary) {
    return (
      <>
        <Nav />
        <div className="max-w-3xl mx-auto px-4 md:px-8 py-8 text-center">
          <p className="text-red-500 dark:text-red-400">{error || 'Summary not found'}</p>
          <button
            onClick={() => router.push('/summaries')}
            className="mt-4 text-brand-500 dark:text-brand-400 hover:underline text-sm"
          >
            ← Back to summaries
          </button>
        </div>
      </>
    )
  }

  return (
    <>
      <Nav />
      <div className="max-w-3xl mx-auto px-4 md:px-8 py-8 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <button
              onClick={() => router.push('/summaries')}
              className="text-xs text-gray-400 dark:text-slate-500 hover:text-brand-600 dark:hover:text-brand-400 transition-colors mb-3 flex items-center gap-1"
            >
              ← Saved Summaries
            </button>
            <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">Performance Summary</h1>
            <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">
              {new Date(summary.timeframe_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              {' – '}
              {new Date(summary.timeframe_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Summary content */}
        <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl shadow-sm">
          <textarea
            value={summary.content}
            readOnly
            rows={16}
            className="w-full rounded-xl p-5 text-sm text-slate-700 dark:text-slate-200 focus:outline-none resize-none bg-transparent leading-relaxed"
          />
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleCopy}
            className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
          >
            {copied ? '✓ Copied' : 'Copy to clipboard'}
          </button>
          <button
            onClick={() => {
              sessionStorage.setItem('lastSummary', summary.content)
              router.push(
                `/summary?from=${summary.timeframe_start}&to=${summary.timeframe_end}&instructions=${encodeURIComponent(summary.user_instructions || '')}`
              )
            }}
            className="px-4 py-2 border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
          >
            Regenerate
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-4 py-2 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 transition-colors"
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>

        {/* Metadata */}
        <p className="text-xs text-gray-400 dark:text-slate-500">
          Generated on {new Date(summary.created_at).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
      </div>
    </>
  )
}
