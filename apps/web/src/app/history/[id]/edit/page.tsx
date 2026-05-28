'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Nav } from '@/components/nav'
import { logger } from '@/lib/logger'
import { SkeletonText } from '@/components/skeleton'
import type { JournalEntry } from '@/types/database'

export default function EditEntryPage() {
  const router = useRouter()
  const params = useParams()
  const entryId = params.id as string
  const supabase = createClient()

  const [entry, setEntry] = useState<JournalEntry | null>(null)
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadEntry()
  }, [entryId])

  async function loadEntry() {
    try {
      const res = await fetch(`/api/entries/${entryId}`)
      const data = await res.json()

      if (!res.ok) {
        logger.error('Failed to load entry', data, 'edit-entry')
        setError('Failed to load entry')
        return
      }

      setEntry(data.entry)
      setContent(data.entry.content)
    } catch (err) {
      logger.error('Error loading entry', err, 'edit-entry')
      setError('Error loading entry')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!content.trim()) {
      setError('Content cannot be empty')
      return
    }

    setError('')
    setSaving(true)

    try {
      const res = await fetch(`/api/entries/${entryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })

      const data = await res.json()

      if (!res.ok) {
        logger.error('Failed to save entry', data, 'edit-entry')
        setError(data.error || 'Failed to save entry')
        return
      }

      logger.info('Entry saved', { entryId }, 'edit-entry')
      router.push('/history')
    } catch (err) {
      logger.error('Error saving entry', err, 'edit-entry')
      setError('Error saving entry')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <>
        <Nav />
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-8">
          <div className="space-y-4">
            <SkeletonText className="h-8 w-1/4" />
            <SkeletonText className="h-64 w-full" />
          </div>
        </div>
      </>
    )
  }

  if (!entry) {
    return (
      <>
        <Nav />
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 text-center">
          <p className="text-red-500 dark:text-red-400">{error || 'Entry not found'}</p>
          <button
            onClick={() => router.push('/history')}
            className="mt-4 text-brand-500 dark:text-brand-400 hover:underline text-sm"
          >
            ← Back to history
          </button>
        </div>
      </>
    )
  }

  return (
    <>
      <Nav />
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 space-y-6">
        <div>
          <button
            onClick={() => router.push('/history')}
            className="text-xs text-gray-400 dark:text-slate-500 hover:text-brand-600 dark:hover:text-brand-400 transition-colors mb-3 flex items-center gap-1"
          >
            ← All Check-ins
          </button>
          <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">Edit Entry</h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">
            {new Date(entry.created_at).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
            {' · '}
            <span className="capitalize">{entry.check_in_type}</span>
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl shadow-sm p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              Entry Content
            </label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={12}
              className="w-full border border-gray-200 dark:border-slate-600 rounded-lg p-3 text-sm text-slate-800 dark:text-slate-200 bg-gray-50 dark:bg-slate-700 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-slate-600 transition-colors resize-none"
              placeholder="Your check-in content..."
            />
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
              {content.length} / 10,000 characters
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={handleSave}
              disabled={saving || !content.trim()}
              className="flex-1 py-2.5 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={() => router.push('/history')}
              disabled={saving}
              className="flex-1 py-2.5 border border-gray-200 dark:border-slate-600 text-gray-500 dark:text-slate-400 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-slate-700 disabled:cursor-not-allowed transition-colors text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
