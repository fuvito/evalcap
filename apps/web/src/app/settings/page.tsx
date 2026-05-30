'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Nav } from '@/components/nav'
import { logger } from '@/lib/logger'
import { applyTheme } from '@/components/theme-provider'

type ThemeOption = 'light' | 'dark' | 'system'

export default function SettingsPage() {
  const router = useRouter()

  const [defaultCheckInType, setDefaultCheckInType] = useState<'daily' | 'weekly'>('weekly')
  const [theme, setTheme] = useState<ThemeOption>('system')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const stored = (localStorage.getItem('theme') || 'system') as ThemeOption
    setTheme(stored)
    loadSettings()
  }, [])

  async function loadSettings() {
    try {
      const res = await fetch('/api/profile')
      const data = await res.json()

      if (!res.ok) {
        logger.error('Failed to load settings', data, 'settings')
        setError('Failed to load settings')
        return
      }

      if (data.profile.default_check_in_type) {
        setDefaultCheckInType(data.profile.default_check_in_type)
      }
    } catch (err) {
      logger.error('Error loading settings', err, 'settings')
      setError('Error loading settings')
    } finally {
      setLoading(false)
    }
  }

  function handleThemeChange(newTheme: ThemeOption) {
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    applyTheme(newTheme)
  }

  async function handleSave() {
    setError('')
    setSuccess(false)
    setSaving(true)

    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          default_check_in_type: defaultCheckInType,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        logger.error('Failed to save settings', data, 'settings')
        setError(data.error || 'Failed to save settings')
        return
      }

      setSuccess(true)
      logger.info('Settings saved', { defaultCheckInType }, 'settings')

      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      logger.error('Error saving settings', err, 'settings')
      setError('Error saving settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <>
        <Nav />
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-8">
          <div className="h-8 bg-gray-200 dark:bg-slate-700 rounded w-1/4 animate-pulse"></div>
        </div>
      </>
    )
  }

  const themeOptions: { value: ThemeOption; label: string; description: string }[] = [
    { value: 'light', label: 'Light', description: 'Always use light mode' },
    { value: 'dark', label: 'Dark', description: 'Always use dark mode' },
    { value: 'system', label: 'System', description: 'Follow your device setting' },
  ]

  return (
    <>
      <Nav />
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 space-y-6">
        <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">Settings</h1>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-800 dark:text-red-400 text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <p className="text-green-800 dark:text-green-400 text-sm">✓ Settings saved successfully</p>
          </div>
        )}

        {/* Appearance Section */}
        <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-4">Appearance</h2>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-3">Theme</label>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {themeOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => handleThemeChange(opt.value)}
                className={`flex flex-col items-center gap-1.5 p-2 sm:p-3 rounded-xl border-2 transition-colors text-left ${
                  theme === opt.value
                    ? 'border-brand-500 bg-brand-50 dark:bg-slate-700'
                    : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500'
                }`}
              >
                <span className="text-lg">
                  {opt.value === 'light' ? '☀️' : opt.value === 'dark' ? '🌙' : '💻'}
                </span>
                <span className={`text-sm font-medium ${theme === opt.value ? 'text-brand-600 dark:text-brand-400' : 'text-slate-700 dark:text-slate-300'}`}>
                  {opt.label}
                </span>
                <span className="hidden sm:block text-xs text-gray-500 dark:text-slate-400 text-center">{opt.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Preferences Section */}
        <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl p-6 shadow-sm space-y-6">
          <div>
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-4">Check-in Preferences</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-3">
                  Default Check-in Type
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="checkInType"
                      value="daily"
                      checked={defaultCheckInType === 'daily'}
                      onChange={e => setDefaultCheckInType(e.target.value as 'daily' | 'weekly')}
                      disabled={saving}
                      className="w-4 h-4 text-brand-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-slate-300">
                      Daily
                      <p className="text-xs text-gray-500 dark:text-slate-400">Quick daily reflections</p>
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="checkInType"
                      value="weekly"
                      checked={defaultCheckInType === 'weekly'}
                      onChange={e => setDefaultCheckInType(e.target.value as 'daily' | 'weekly')}
                      disabled={saving}
                      className="w-4 h-4 text-brand-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-slate-300">
                      Weekly
                      <p className="text-xs text-gray-500 dark:text-slate-400">In-depth weekly summaries</p>
                    </span>
                  </label>
                </div>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-3">
                  This will be the default selection when you create a new check-in. You can always change it for individual check-ins.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-4 border-t border-gray-100 dark:border-slate-700">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-2.5 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm"
            >
              {saving ? 'Saving...' : 'Save Preferences'}
            </button>
            <button
              onClick={() => router.back()}
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
