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
        <div className="max-w-3xl mx-auto p-8">
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
        <div className="max-w-3xl mx-auto p-8 text-center">
          <p className="text-red-500">{error || 'Entry not found'}</p>
          <button
            onClick={() => router.push('/history')}
            className="mt-4 text-brand-500 hover:underline"
          >
            Back to history
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
          <h1 className="text-3xl font-bold text-brand-700">Edit Entry</h1>
          <button
            onClick={() => router.push('/history')}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
            title="Close"
          >
            ✕
          </button>
        </div>

        <div className="text-sm text-gray-500">
          {new Date(entry.created_at).toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
          {' '}· {entry.check_in_type}
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Entry Content
            </label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={12}
              className="w-full border border-gray-300 rounded-lg p-3 text-sm text-gray-900 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
              placeholder="Your check-in content..."
            />
            <p className="text-xs text-gray-400 mt-1">
              {content.length} / 10,000 characters
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving || !content.trim()}
              className="flex-1 py-2.5 bg-brand-500 text-white rounded-lg font-medium hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={() => router.push('/history')}
              disabled={saving}
              className="flex-1 py-2.5 border border-gray-300 text-gray-600 rounded-lg font-medium hover:bg-gray-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
