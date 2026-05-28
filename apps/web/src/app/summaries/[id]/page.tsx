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
        <div className="max-w-3xl mx-auto p-8">
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
        <div className="max-w-3xl mx-auto p-8 text-center">
          <p className="text-red-500">{error || 'Summary not found'}</p>
          <button
            onClick={() => router.push('/summaries')}
            className="mt-4 text-brand-500 hover:underline"
          >
            Back to summaries
          </button>
        </div>
      </>
    )
  }

  return (
    <>
      <Nav />
      <div className="max-w-3xl mx-auto p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-brand-700">Performance Summary</h1>
            <p className="text-gray-600 text-sm mt-1">
              {new Date(summary.timeframe_start).toLocaleDateString()} to{' '}
              {new Date(summary.timeframe_end).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={() => router.push('/summaries')}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Summary content */}
        <textarea
          value={summary.content}
          readOnly
          rows={16}
          className="w-full border border-gray-300 rounded-lg p-4 text-sm focus:outline-none resize-none font-mono bg-gray-50"
        />

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleCopy}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
          >
            {copied ? '✓ Copied to clipboard' : '📋 Copy to clipboard'}
          </button>
          <button
            onClick={() => {
              // Store summary in session for editing
              sessionStorage.setItem('lastSummary', summary.content)
              router.push(
                `/summary?from=${summary.timeframe_start}&to=${summary.timeframe_end}&instructions=${encodeURIComponent(summary.user_instructions || '')}`
              )
            }}
            className="px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 transition-colors"
          >
            🔄 Regenerate
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 disabled:opacity-50 transition-colors"
          >
            {deleting ? 'Deleting...' : '🗑️ Delete'}
          </button>
        </div>

        {/* Metadata */}
        <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
          Created {new Date(summary.created_at).toLocaleDateString()} at{' '}
          {new Date(summary.created_at).toLocaleTimeString()}
        </div>
      </div>
    </>
  )
}
