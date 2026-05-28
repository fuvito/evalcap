'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { logger } from '@/lib/logger'
import type { JournalEntry } from '@/types/database'

interface EntryListProps {
  entries: JournalEntry[]
}

export function EntryList({ entries: initialEntries }: EntryListProps) {
  const router = useRouter()
  const [entries, setEntries] = useState(initialEntries)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState<string | null>(null)

  async function handleDelete(entryId: string) {
    setDeletingId(entryId)

    try {
      const res = await fetch(`/api/entries/${entryId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        logger.error('Failed to delete entry', { entryId }, 'history')
        alert('Failed to delete entry')
        return
      }

      setEntries(entries.filter(e => e.id !== entryId))
      setShowConfirm(null)
      logger.info('Entry deleted', { entryId }, 'history')
    } catch (err) {
      logger.error('Error deleting entry', err, 'history')
      alert('Error deleting entry')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-3">
      {entries.map(entry => (
        <div
          key={entry.id}
          className="bg-white border border-gray-200 rounded-xl p-4 space-y-2 hover:border-brand-200 transition-colors group"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <span className="text-xs font-medium text-brand-500 uppercase tracking-wide">
                {entry.check_in_type}
              </span>
              <span className="text-xs text-gray-400 ml-2">
                {new Date(entry.created_at).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Link
                href={`/history/${entry.id}/edit`}
                className="text-xs px-2 py-1 text-brand-600 hover:bg-brand-50 rounded transition-colors"
              >
                Edit
              </Link>
              <button
                onClick={() => setShowConfirm(entry.id)}
                disabled={deletingId === entry.id}
                className="text-xs px-2 py-1 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
              >
                {deletingId === entry.id ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
          <p className="text-gray-700 text-sm whitespace-pre-line line-clamp-4">
            {entry.content}
          </p>

          {/* Delete confirmation dialog */}
          {showConfirm === entry.id && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
              <p className="text-sm text-red-800 mb-2">Delete this entry? This cannot be undone.</p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDelete(entry.id)}
                  disabled={deletingId === entry.id}
                  className="flex-1 px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {deletingId === entry.id ? 'Deleting...' : 'Delete'}
                </button>
                <button
                  onClick={() => setShowConfirm(null)}
                  disabled={deletingId === entry.id}
                  className="flex-1 px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300 disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
