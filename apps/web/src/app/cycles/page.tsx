'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Nav } from '@/components/nav'
import type { PerformanceCycle } from '@/types/database'

const YEAR = new Date().getFullYear()

const PRESETS: { label: string; name: string; start: string; end: string }[] = [
  { label: 'Q1', name: `Q1 ${YEAR}`, start: `${YEAR}-01-01`, end: `${YEAR}-03-31` },
  { label: 'Q2', name: `Q2 ${YEAR}`, start: `${YEAR}-04-01`, end: `${YEAR}-06-30` },
  { label: 'Q3', name: `Q3 ${YEAR}`, start: `${YEAR}-07-01`, end: `${YEAR}-09-30` },
  { label: 'Q4', name: `Q4 ${YEAR}`, start: `${YEAR}-10-01`, end: `${YEAR}-12-31` },
  { label: 'H1', name: `H1 ${YEAR}`, start: `${YEAR}-01-01`, end: `${YEAR}-06-30` },
  { label: 'H2', name: `H2 ${YEAR}`, start: `${YEAR}-07-01`, end: `${YEAR}-12-31` },
  { label: `FY ${YEAR}`, name: `FY ${YEAR}`, start: `${YEAR}-01-01`, end: `${YEAR}-12-31` },
]

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function CyclesPage() {
  const [cycles, setCycles] = useState<PerformanceCycle[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showArchived, setShowArchived] = useState(false)

  // Form state
  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [creating, setCreating] = useState(false)
  const [formError, setFormError] = useState('')

  // Per-cycle action state
  const [archiving, setArchiving] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  useEffect(() => { loadCycles() }, [])

  async function loadCycles() {
    setLoading(true)
    const res = await fetch('/api/cycles')
    if (res.ok) {
      const data = await res.json()
      setCycles(data.cycles)
    }
    setLoading(false)
  }

  function applyPreset(preset: typeof PRESETS[number]) {
    setName(preset.name)
    setStartDate(preset.start)
    setEndDate(preset.end)
    setFormError('')
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    setCreating(true)

    const res = await fetch('/api/cycles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, start_date: startDate, end_date: endDate }),
    })

    const data = await res.json()

    if (!res.ok) {
      setFormError(data.details?.[0]?.message || data.error || 'Failed to create cycle')
      setCreating(false)
      return
    }

    setCycles(prev => [data.cycle, ...prev])
    setShowForm(false)
    setName('')
    setStartDate('')
    setEndDate('')
    setCreating(false)
  }

  async function handleArchive(cycle: PerformanceCycle) {
    setArchiving(cycle.id)
    const newStatus = cycle.status === 'active' ? 'archived' : 'active'
    const res = await fetch(`/api/cycles/${cycle.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    if (res.ok) {
      const data = await res.json()
      setCycles(prev => prev.map(c => c.id === cycle.id ? data.cycle : c))
    }
    setArchiving(null)
  }

  async function handleDelete(id: string) {
    setDeleting(id)
    const res = await fetch(`/api/cycles/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setCycles(prev => prev.filter(c => c.id !== id))
    }
    setDeleting(null)
    setConfirmDelete(null)
  }

  const activeCycles = cycles.filter(c => c.status === 'active')
  const archivedCycles = cycles.filter(c => c.status === 'archived')

  const cardClass = "bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl p-4 shadow-sm"

  return (
    <>
      <Nav />
      <div className="max-w-3xl mx-auto px-4 md:px-8 py-8 space-y-6">

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">Performance Cycles</h1>
            <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">Define periods like Q1 2026 or H1 2026 to organise your summaries.</p>
          </div>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
            >
              New cycle
            </button>
          )}
        </div>

        {/* Create form */}
        {showForm && (
          <form onSubmit={handleCreate} className={`${cardClass} space-y-4`}>
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">New cycle</h2>

            <div className="flex flex-wrap gap-2">
              {PRESETS.map(p => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => applyPreset(p)}
                  className="px-3 py-1 text-xs border border-gray-200 dark:border-slate-600 rounded-full text-gray-600 dark:text-slate-400 hover:bg-brand-50 dark:hover:bg-slate-700 hover:border-brand-300 dark:hover:border-brand-600 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Q2 2026"
                required
                autoFocus
                className="w-full border border-gray-200 dark:border-slate-600 rounded-lg p-2.5 text-sm text-gray-800 dark:text-slate-200 bg-gray-50 dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-slate-600 transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Start date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  required
                  className="w-full border border-gray-200 dark:border-slate-600 rounded-lg p-2.5 text-sm text-gray-800 dark:text-slate-200 bg-gray-50 dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-slate-600 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">End date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  required
                  className="w-full border border-gray-200 dark:border-slate-600 rounded-lg p-2.5 text-sm text-gray-800 dark:text-slate-200 bg-gray-50 dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-slate-600 transition-colors"
                />
              </div>
            </div>

            {formError && <p className="text-red-400 text-xs">{formError}</p>}

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={creating || !name || !startDate || !endDate}
                className="flex-1 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {creating ? 'Creating...' : 'Create cycle'}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setFormError('') }}
                className="flex-1 py-2 border border-gray-200 dark:border-slate-600 text-gray-500 dark:text-slate-400 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Active cycles */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="h-20 bg-gray-100 dark:bg-slate-800 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : activeCycles.length === 0 && !showForm ? (
          <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm">
            <p className="text-slate-400 dark:text-slate-500 text-sm mb-4">No cycles yet. Create one to organise your summaries by period.</p>
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
            >
              Create your first cycle
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {activeCycles.map(cycle => (
              <CycleCard
                key={cycle.id}
                cycle={cycle}
                confirmDelete={confirmDelete}
                archiving={archiving}
                deleting={deleting}
                onArchive={handleArchive}
                onDeleteRequest={id => setConfirmDelete(id)}
                onDeleteCancel={() => setConfirmDelete(null)}
                onDeleteConfirm={handleDelete}
              />
            ))}
          </div>
        )}

        {/* Archived cycles */}
        {archivedCycles.length > 0 && (
          <div className="space-y-3">
            <button
              onClick={() => setShowArchived(v => !v)}
              className="text-sm text-gray-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            >
              {showArchived ? '▾' : '▸'} Archived ({archivedCycles.length})
            </button>
            {showArchived && archivedCycles.map(cycle => (
              <CycleCard
                key={cycle.id}
                cycle={cycle}
                confirmDelete={confirmDelete}
                archiving={archiving}
                deleting={deleting}
                onArchive={handleArchive}
                onDeleteRequest={id => setConfirmDelete(id)}
                onDeleteCancel={() => setConfirmDelete(null)}
                onDeleteConfirm={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </>
  )
}

function CycleCard({
  cycle,
  confirmDelete,
  archiving,
  deleting,
  onArchive,
  onDeleteRequest,
  onDeleteCancel,
  onDeleteConfirm,
}: {
  cycle: PerformanceCycle
  confirmDelete: string | null
  archiving: string | null
  deleting: string | null
  onArchive: (c: PerformanceCycle) => void
  onDeleteRequest: (id: string) => void
  onDeleteCancel: () => void
  onDeleteConfirm: (id: string) => void
}) {
  const isArchived = cycle.status === 'archived'

  return (
    <div className={`bg-white dark:bg-slate-800 border rounded-xl p-4 shadow-sm space-y-3 ${
      isArchived ? 'border-gray-100 dark:border-slate-700 opacity-70' : 'border-gray-100 dark:border-slate-700'
    }`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{cycle.name}</p>
            {isArchived && (
              <span className="text-xs bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400 px-2 py-0.5 rounded-full">Archived</span>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
            {formatDate(cycle.start_date)} – {formatDate(cycle.end_date)}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link
            href={`/summary?start=${cycle.start_date}&end=${cycle.end_date}`}
            className="text-xs text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors"
          >
            Generate summary →
          </Link>
          <button
            onClick={() => onArchive(cycle)}
            disabled={archiving === cycle.id}
            className="text-xs text-gray-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors disabled:opacity-50"
          >
            {archiving === cycle.id ? '...' : isArchived ? 'Restore' : 'Archive'}
          </button>
          <button
            onClick={() => onDeleteRequest(cycle.id)}
            className="text-xs text-gray-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      {confirmDelete === cycle.id && (
        <div className="flex items-center gap-2 pt-1 border-t border-gray-100 dark:border-slate-700">
          <p className="text-xs text-gray-500 dark:text-slate-400 flex-1">Delete this cycle?</p>
          <button
            onClick={() => onDeleteConfirm(cycle.id)}
            disabled={deleting === cycle.id}
            className="text-xs px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors"
          >
            {deleting === cycle.id ? 'Deleting...' : 'Delete'}
          </button>
          <button
            onClick={onDeleteCancel}
            className="text-xs px-3 py-1 border border-gray-200 dark:border-slate-600 text-gray-500 dark:text-slate-400 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}
