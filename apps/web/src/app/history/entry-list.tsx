'use client'

import {useState} from 'react'
import Link from 'next/link'
import {logger} from '@/lib/logger'
import type {JournalEntry} from '@/types/database'

type EntryListItem = Pick<JournalEntry, 'id' | 'content' | 'check_in_type' | 'created_at'>

interface EntryListProps {
  entries: EntryListItem[]
}

export function EntryList({ entries: initialEntries }: EntryListProps) {
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
    <div className="space-y-2">
      {entries.map(entry => (
        <div
          key={entry.id}
          className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl p-4 shadow-sm hover:shadow transition-shadow group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-brand-500 dark:text-brand-400 bg-brand-50 dark:bg-slate-700 px-2 py-0.5 rounded-full capitalize">
                {entry.check_in_type}
              </span>
              <span className="text-xs text-gray-400 dark:text-slate-500">
                {new Date(entry.created_at).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
            <div className="flex gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
              <Link
                href={`/history/${entry.id}/edit`}
                className="text-xs px-3 py-2 sm:px-2.5 sm:py-1 text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Edit
              </Link>
              <button
                onClick={() => setShowConfirm(entry.id)}
                disabled={deletingId === entry.id}
                className="text-xs px-3 py-2 sm:px-2.5 sm:py-1 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50"
              >
                {deletingId === entry.id ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
          <p className="text-gray-600 dark:text-slate-300 text-sm whitespace-pre-line line-clamp-4">
            {entry.content}
          </p>

          {showConfirm === entry.id && (
            <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-400 mb-2">Delete this entry? This cannot be undone.</p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDelete(entry.id)}
                  disabled={deletingId === entry.id}
                  className="flex-1 px-3 py-1.5 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors"
                >
                  {deletingId === entry.id ? 'Deleting...' : 'Delete'}
                </button>
                <button
                  onClick={() => setShowConfirm(null)}
                  disabled={deletingId === entry.id}
                  className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300 text-xs rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600 disabled:opacity-50 transition-colors"
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
