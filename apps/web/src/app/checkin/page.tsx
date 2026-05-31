'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Nav } from '@/components/nav'
import { logger } from '@/lib/logger'

export default function CheckInPage() {
  const router = useRouter()
  const [checkInType, setCheckInType] = useState<'daily' | 'weekly'>('weekly')
  const [content, setContent] = useState('')
  const [prompts, setPrompts] = useState<string[]>([])
  const [loadingPrompts, setLoadingPrompts] = useState(false)
  const [saving, setSaving] = useState(false)
  const [promptUsed, setPromptUsed] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch('/api/profile')
        const data = await res.json()
        if (data.profile?.default_check_in_type) {
          setCheckInType(data.profile.default_check_in_type)
        }
      } catch {
        // profile default is optional
      }
    }
    loadProfile()
  }, [])

  async function handleGetPrompts() {
    setLoadingPrompts(true)
    try {
      const res = await fetch('/api/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkInType }),
      })
      const data = await res.json()
      if (res.ok) {
        setPrompts(data.prompts || [])
      } else {
        logger.error('/api/prompts returned error', data.detail ?? data.error, 'checkin')
      }
    } catch (err) {
      logger.error('/api/prompts fetch failed', err, 'checkin')
    } finally {
      setLoadingPrompts(false)
    }
  }

  function applyPrompt(prompt: string) {
    setContent(prev => prev.trim() ? `${prev}\n\n${prompt}\n` : `${prompt}\n`)
    setPromptUsed(prompt)
    setPrompts([])
    textareaRef.current?.focus()
  }

  async function handleSave() {
    if (!content.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim(), checkInType, promptUsed }),
      })
      if (!res.ok) throw new Error('Failed to save')
      router.push('/dashboard')
    } catch (err) {
      logger.error('Save check-in failed', err, 'checkin')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Nav />
      <div className="max-w-2xl mx-auto px-4 md:px-8 py-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">New Check-in</h1>
          <div className="flex gap-2">
            {(['daily', 'weekly'] as const).map(type => (
              <button
                key={type}
                onClick={() => setCheckInType(type)}
                className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition-colors ${
                  checkInType === type
                    ? 'bg-brand-600 text-white'
                    : 'border border-gray-200 dark:border-slate-600 text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="What did you accomplish? What are you working on? Any blockers or plans to note?"
            rows={10}
            className="w-full p-5 text-sm text-gray-800 dark:text-slate-200 bg-transparent placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none resize-none"
          />
        </div>

        {prompts.length > 0 && (
          <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl p-4 shadow-sm space-y-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Prompts — click one to add it
              </span>
              <button
                onClick={() => setPrompts([])}
                className="text-xs text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
              >
                Dismiss
              </button>
            </div>
            {prompts.map((p, i) => (
              <button
                key={i}
                onClick={() => applyPrompt(p)}
                className="w-full text-left text-sm text-slate-700 dark:text-slate-300 px-3 py-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors border border-gray-100 dark:border-slate-600"
              >
                {p}
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={!content.trim() || saving}
            className="flex-1 py-2.5 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm"
          >
            {saving ? 'Saving...' : 'Save Check-in'}
          </button>
          <button
            onClick={handleGetPrompts}
            disabled={loadingPrompts}
            className="px-4 py-2.5 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-500 dark:text-slate-400 font-medium hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm"
          >
            {loadingPrompts ? 'Loading...' : 'Get AI prompts'}
          </button>
        </div>
      </div>
    </>
  )
}
