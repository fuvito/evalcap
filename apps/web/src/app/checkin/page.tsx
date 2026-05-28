'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Nav } from '@/components/nav'
import { logger } from '@/lib/logger'
import { SkeletonText } from '@/components/skeleton'

export default function CheckInPage() {
  const router = useRouter()
  const supabase = createClient()

  const [checkInType, setCheckInType] = useState<'daily' | 'weekly'>('weekly')
  const [prompts, setPrompts] = useState<string[]>([])
  const [responses, setResponses] = useState<Record<number, string>>({})
  const [loading, setLoading] = useState(false)
  const [loadingPrompts, setLoadingPrompts] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadPrompts()
  }, [checkInType])

  const FALLBACK_PROMPTS = [
    'What did you accomplish since your last check-in?',
    'What are you currently working on?',
    'Any blockers or upcoming plans to note?',
  ]

  async function loadPrompts() {
    setLoadingPrompts(true)
    try {
      const res = await fetch('/api/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkInType }),
      })
      const data = await res.json()
      if (!res.ok) {
        logger.error('/api/prompts returned error', data.detail ?? data.error, 'checkin')
        setPrompts(FALLBACK_PROMPTS)
      } else {
        setPrompts(data.prompts || FALLBACK_PROMPTS)
      }
      setResponses({})
    } catch (err) {
      logger.error('/api/prompts fetch failed', err, 'checkin')
      setPrompts(FALLBACK_PROMPTS)
    } finally {
      setLoadingPrompts(false)
    }
  }

  async function handleSave() {
    const combinedContent = prompts
      .map((prompt, i) => `Q: ${prompt}\nA: ${responses[i] || ''}`)
      .filter((_, i) => responses[i]?.trim())
      .join('\n\n')

    if (!combinedContent.trim()) return

    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await supabase.from('journal_entries').insert({
        user_id: user.id,
        content: combinedContent,
        check_in_type: checkInType,
        prompt_used: prompts.join(' | '),
      })

      router.push('/dashboard')
    } catch (err) {
      logger.error('Save check-in failed', err, 'checkin')
    } finally {
      setSaving(false)
    }
  }

  const hasResponses = Object.values(responses).some(r => r.trim().length > 0)

  return (
    <>
      <Nav />
    <div className="max-w-2xl mx-auto p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand-700">New Check-in</h1>
        <div className="flex gap-2">
          {(['daily', 'weekly'] as const).map(type => (
            <button
              key={type}
              onClick={() => setCheckInType(type)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-colors ${
                checkInType === type
                  ? 'bg-brand-500 text-white'
                  : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {loadingPrompts ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="space-y-2">
              <SkeletonText className="h-5 w-3/4" />
              <SkeletonText className="h-24 w-full" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-5">
          {prompts.map((prompt, i) => (
            <div key={i} className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                {prompt}
              </label>
              <textarea
                value={responses[i] || ''}
                onChange={e => setResponses(prev => ({ ...prev, [i]: e.target.value }))}
                placeholder="Write your response here..."
                rows={4}
                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
              />
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          onClick={handleSave}
          disabled={!hasResponses || saving}
          className="flex-1 py-3 bg-brand-500 text-white rounded-lg font-medium hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? 'Saving...' : 'Save Check-in'}
        </button>
        <button
          onClick={loadPrompts}
          disabled={loadingPrompts}
          className="px-4 py-3 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors text-sm"
        >
          Refresh prompts
        </button>
      </div>
    </div>
    </>
  )
}
