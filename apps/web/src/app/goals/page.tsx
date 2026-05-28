'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Nav } from '@/components/nav'
import { fetcher } from '@/lib/fetcher'
import type { EvaluationGoal, PersonalGoal, PerformanceCycle } from '@/types/database'

// ─── Status helpers ────────────────────────────────────────────────────────

const EVAL_STATUSES: EvaluationGoal['status'][] = ['not_started', 'in_progress', 'completed', 'cancelled']
const EVAL_STATUS_LABELS: Record<EvaluationGoal['status'], string> = {
  not_started: 'Not started',
  in_progress: 'In progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
}
const EVAL_STATUS_COLORS: Record<EvaluationGoal['status'], string> = {
  not_started: 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400',
  in_progress: 'bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400',
  completed: 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400',
  cancelled: 'bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400',
}

const PERSONAL_PRIORITY_COLORS: Record<PersonalGoal['priority'], string> = {
  low: 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400',
  medium: 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
  high: 'bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
}

const CATEGORY_LABELS: Record<string, string> = {
  promotion: 'Promotion',
  certification: 'Certification',
  skill: 'Skill',
  habit: 'Habit',
  other: 'Other',
}

function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ─── Main page ─────────────────────────────────────────────────────────────

export default function GoalsPage() {
  const [tab, setTab] = useState<'evaluation' | 'personal'>('evaluation')

  const { data: evalData, mutate: mutateEval, isLoading: loadingEval } = useSWR<{ goals: EvaluationGoal[] }>('/api/goals/evaluation', fetcher)
  const { data: personalData, mutate: mutatePersonal, isLoading: loadingPersonal } = useSWR<{ goals: PersonalGoal[] }>('/api/goals/personal', fetcher)
  const { data: cyclesData } = useSWR<{ cycles: PerformanceCycle[] }>('/api/cycles', fetcher)

  const evalGoals = evalData?.goals ?? []
  const personalGoals = personalData?.goals ?? []
  const cycles = (cyclesData?.cycles ?? []).filter(c => c.status === 'active')
  const loading = loadingEval || loadingPersonal

  return (
    <>
      <Nav />
      <div className="max-w-3xl mx-auto px-4 md:px-8 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">Goals</h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">
            Your goals are used as context when generating prompts and summaries.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-slate-700">
          {(['evaluation', 'personal'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                tab === t
                  ? 'border-brand-600 text-brand-600 dark:text-brand-400 dark:border-brand-400'
                  : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              {t === 'evaluation' ? 'Evaluation' : 'Personal'}
              <span className="ml-2 text-xs bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400 px-1.5 py-0.5 rounded-full">
                {t === 'evaluation'
                  ? evalGoals.filter(g => g.status !== 'cancelled').length
                  : personalGoals.filter(g => g.status !== 'cancelled').length}
              </span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-100 dark:bg-slate-800 rounded-xl animate-pulse" />)}
          </div>
        ) : tab === 'evaluation' ? (
          <EvaluationTab goals={evalGoals} cycles={cycles} mutate={mutateEval} />
        ) : (
          <PersonalTab goals={personalGoals} mutate={mutatePersonal} />
        )}
      </div>
    </>
  )
}

// ─── Evaluation tab ────────────────────────────────────────────────────────

function EvaluationTab({
  goals,
  cycles,
  mutate,
}: {
  goals: EvaluationGoal[]
  cycles: PerformanceCycle[]
  mutate: () => void
}) {
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [cycleId, setCycleId] = useState('')
  const [creating, setCreating] = useState(false)
  const [formError, setFormError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    setCreating(true)
    const res = await fetch('/api/goals/evaluation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description: description || null, cycle_id: cycleId || null }),
    })
    const data = await res.json()
    if (!res.ok) { setFormError(data.details?.[0]?.message || data.error || 'Failed to create'); setCreating(false); return }
    mutate()
    setShowForm(false); setTitle(''); setDescription(''); setCycleId(''); setCreating(false)
  }

  async function handleStatusChange(goal: EvaluationGoal, status: EvaluationGoal['status']) {
    const res = await fetch(`/api/goals/evaluation/${goal.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) mutate()
  }

  async function handleDelete(id: string) {
    setDeleting(id)
    await fetch(`/api/goals/evaluation/${id}`, { method: 'DELETE' })
    mutate()
    setDeleting(null); setConfirmDelete(null)
  }

  const activeGoals = goals.filter(g => g.status !== 'cancelled')
  const cancelledGoals = goals.filter(g => g.status === 'cancelled')

  const inputClass = "w-full border border-gray-200 dark:border-slate-600 rounded-lg p-2.5 text-sm text-gray-800 dark:text-slate-200 bg-gray-50 dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-slate-600 transition-colors"

  return (
    <div className="space-y-4">
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
        >
          Add goal
        </button>
      )}

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl p-4 shadow-sm space-y-3">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">New evaluation goal</h3>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Title</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Ship the new onboarding flow" required autoFocus className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Description (optional)</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="More details about this goal…" rows={2} className={`${inputClass} resize-none`} />
          </div>
          {cycles.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Cycle (optional)</label>
              <select value={cycleId} onChange={e => setCycleId(e.target.value)} className={inputClass}>
                <option value="">No cycle</option>
                {cycles.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}
          {formError && <p className="text-red-400 text-xs">{formError}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={creating || !title} className="flex-1 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              {creating ? 'Adding...' : 'Add goal'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setFormError('') }} className="flex-1 py-2 border border-gray-200 dark:border-slate-600 text-gray-500 dark:text-slate-400 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
              Cancel
            </button>
          </div>
        </form>
      )}

      {activeGoals.length === 0 && !showForm ? (
        <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm">
          <p className="text-gray-400 dark:text-slate-500 text-sm mb-3">No evaluation goals yet.</p>
          <p className="text-gray-400 dark:text-slate-500 text-xs max-w-xs mx-auto">Add the goals you're being evaluated on — they'll be used to personalise your check-in prompts and summaries.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {activeGoals.map(goal => (
            <EvalGoalCard
              key={goal.id}
              goal={goal}
              cycles={cycles}
              confirmDelete={confirmDelete}
              deleting={deleting}
              onStatusChange={handleStatusChange}
              onDeleteRequest={setConfirmDelete}
              onDeleteCancel={() => setConfirmDelete(null)}
              onDeleteConfirm={handleDelete}
            />
          ))}
        </div>
      )}

      {cancelledGoals.length > 0 && (
        <p className="text-xs text-gray-400 dark:text-slate-500">{cancelledGoals.length} cancelled goal{cancelledGoals.length > 1 ? 's' : ''} hidden</p>
      )}
    </div>
  )
}

function EvalGoalCard({
  goal, cycles, confirmDelete, deleting,
  onStatusChange, onDeleteRequest, onDeleteCancel, onDeleteConfirm,
}: {
  goal: EvaluationGoal
  cycles: PerformanceCycle[]
  confirmDelete: string | null
  deleting: string | null
  onStatusChange: (g: EvaluationGoal, s: EvaluationGoal['status']) => void
  onDeleteRequest: (id: string) => void
  onDeleteCancel: () => void
  onDeleteConfirm: (id: string) => void
}) {
  const cycle = cycles.find(c => c.id === goal.cycle_id)

  return (
    <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl p-4 shadow-sm space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200 leading-snug">{goal.title}</p>
          {goal.description && <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{goal.description}</p>}
          {cycle && <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">{cycle.name}</p>}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <select
            value={goal.status}
            onChange={e => onStatusChange(goal, e.target.value as EvaluationGoal['status'])}
            className={`text-xs px-2 py-1 rounded-full border-0 font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-500 ${EVAL_STATUS_COLORS[goal.status]}`}
          >
            {EVAL_STATUSES.map(s => (
              <option key={s} value={s}>{EVAL_STATUS_LABELS[s]}</option>
            ))}
          </select>
          <button onClick={() => onDeleteRequest(goal.id)} className="text-xs text-gray-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors">
            Delete
          </button>
        </div>
      </div>

      {confirmDelete === goal.id && (
        <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-slate-700">
          <p className="text-xs text-gray-500 dark:text-slate-400 flex-1">Delete this goal?</p>
          <button onClick={() => onDeleteConfirm(goal.id)} disabled={deleting === goal.id} className="text-xs px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors">
            {deleting === goal.id ? '...' : 'Delete'}
          </button>
          <button onClick={onDeleteCancel} className="text-xs px-3 py-1 border border-gray-200 dark:border-slate-600 text-gray-500 dark:text-slate-400 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Personal tab ──────────────────────────────────────────────────────────

function PersonalTab({
  goals,
  mutate,
}: {
  goals: PersonalGoal[]
  mutate: () => void
}) {
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [priority, setPriority] = useState<PersonalGoal['priority']>('medium')
  const [dueDate, setDueDate] = useState('')
  const [creating, setCreating] = useState(false)
  const [formError, setFormError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    setCreating(true)
    const res = await fetch('/api/goals/personal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description: description || null, category: category || null, priority, due_date: dueDate || null }),
    })
    const data = await res.json()
    if (!res.ok) { setFormError(data.details?.[0]?.message || data.error || 'Failed to create'); setCreating(false); return }
    mutate()
    setShowForm(false); setTitle(''); setDescription(''); setCategory(''); setPriority('medium'); setDueDate(''); setCreating(false)
  }

  async function handleComplete(goal: PersonalGoal) {
    const newStatus = goal.status === 'completed' ? 'active' : 'completed'
    const res = await fetch(`/api/goals/personal/${goal.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    if (res.ok) mutate()
  }

  async function handleDelete(id: string) {
    setDeleting(id)
    await fetch(`/api/goals/personal/${id}`, { method: 'DELETE' })
    mutate()
    setDeleting(null); setConfirmDelete(null)
  }

  const activeGoals = goals.filter(g => g.status !== 'cancelled')
  const inputClass = "w-full border border-gray-200 dark:border-slate-600 rounded-lg p-2.5 text-sm text-gray-800 dark:text-slate-200 bg-gray-50 dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-slate-600 transition-colors"

  return (
    <div className="space-y-4">
      {!showForm && (
        <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors">
          Add goal
        </button>
      )}

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl p-4 shadow-sm space-y-3">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">New personal goal</h3>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Title</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Get promoted to Senior Engineer" required autoFocus className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Description (optional)</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="More context about this goal…" rows={2} className={`${inputClass} resize-none`} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)} className={inputClass}>
                <option value="">None</option>
                {Object.entries(CATEGORY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Priority</label>
              <select value={priority} onChange={e => setPriority(e.target.value as PersonalGoal['priority'])} className={inputClass}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Target date (optional)</label>
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className={inputClass} />
          </div>
          {formError && <p className="text-red-400 text-xs">{formError}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={creating || !title} className="flex-1 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              {creating ? 'Adding...' : 'Add goal'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setFormError('') }} className="flex-1 py-2 border border-gray-200 dark:border-slate-600 text-gray-500 dark:text-slate-400 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
              Cancel
            </button>
          </div>
        </form>
      )}

      {activeGoals.length === 0 && !showForm ? (
        <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm">
          <p className="text-gray-400 dark:text-slate-500 text-sm mb-3">No personal goals yet.</p>
          <p className="text-gray-400 dark:text-slate-500 text-xs max-w-xs mx-auto">Add growth goals like a promotion target or a skill you want to build. These will be used as context in your prompts and summaries.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {activeGoals.map(goal => (
            <PersonalGoalCard
              key={goal.id}
              goal={goal}
              confirmDelete={confirmDelete}
              deleting={deleting}
              onComplete={handleComplete}
              onDeleteRequest={setConfirmDelete}
              onDeleteCancel={() => setConfirmDelete(null)}
              onDeleteConfirm={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function PersonalGoalCard({
  goal, confirmDelete, deleting,
  onComplete, onDeleteRequest, onDeleteCancel, onDeleteConfirm,
}: {
  goal: PersonalGoal
  confirmDelete: string | null
  deleting: string | null
  onComplete: (g: PersonalGoal) => void
  onDeleteRequest: (id: string) => void
  onDeleteCancel: () => void
  onDeleteConfirm: (id: string) => void
}) {
  const isComplete = goal.status === 'completed'

  return (
    <div className={`bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl p-4 shadow-sm space-y-2 ${isComplete ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <button
            onClick={() => onComplete(goal)}
            className={`mt-0.5 w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
              isComplete
                ? 'bg-green-500 border-green-500 text-white'
                : 'border-gray-300 dark:border-slate-500 hover:border-brand-500'
            }`}
            title={isComplete ? 'Mark active' : 'Mark complete'}
          >
            {isComplete && (
              <svg className="w-2.5 h-2.5" viewBox="0 0 10 8" fill="none">
                <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium leading-snug ${isComplete ? 'line-through text-gray-400 dark:text-slate-500' : 'text-slate-700 dark:text-slate-200'}`}>
              {goal.title}
            </p>
            {goal.description && <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{goal.description}</p>}
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PERSONAL_PRIORITY_COLORS[goal.priority]}`}>
                {goal.priority}
              </span>
              {goal.category && (
                <span className="text-xs text-gray-400 dark:text-slate-500">{CATEGORY_LABELS[goal.category]}</span>
              )}
              {goal.due_date && (
                <span className="text-xs text-gray-400 dark:text-slate-500">Due {formatDate(goal.due_date)}</span>
              )}
            </div>
          </div>
        </div>
        <button onClick={() => onDeleteRequest(goal.id)} className="text-xs text-gray-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors flex-shrink-0">
          Delete
        </button>
      </div>

      {confirmDelete === goal.id && (
        <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-slate-700">
          <p className="text-xs text-gray-500 dark:text-slate-400 flex-1">Delete this goal?</p>
          <button onClick={() => onDeleteConfirm(goal.id)} disabled={deleting === goal.id} className="text-xs px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors">
            {deleting === goal.id ? '...' : 'Delete'}
          </button>
          <button onClick={onDeleteCancel} className="text-xs px-3 py-1 border border-gray-200 dark:border-slate-600 text-gray-500 dark:text-slate-400 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}
