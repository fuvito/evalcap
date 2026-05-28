'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Nav } from '@/components/nav'
import { logger } from '@/lib/logger'

export default function SettingsPage() {
  const router = useRouter()

  const [defaultCheckInType, setDefaultCheckInType] = useState<'daily' | 'weekly'>('weekly')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
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

      // Set the default check-in type if it exists
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

      // Clear success message after 3 seconds
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
        <div className="max-w-2xl mx-auto p-8">
          <div className="h-8 bg-gray-200 rounded w-1/4 animate-pulse"></div>
        </div>
      </>
    )
  }

  return (
    <>
      <Nav />
      <div className="max-w-2xl mx-auto p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-brand-700">Settings</h1>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800 text-sm">✓ Settings saved successfully</p>
          </div>
        )}

        {/* Preferences Section */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Check-in Preferences</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
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
                    <span className="text-sm text-gray-700">
                      Daily
                      <p className="text-xs text-gray-500">Quick daily reflections</p>
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
                    <span className="text-sm text-gray-700">
                      Weekly
                      <p className="text-xs text-gray-500">In-depth weekly summaries</p>
                    </span>
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  This will be the default selection when you create a new check-in. You can always change it for individual check-ins.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-4 border-t border-gray-200">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-2.5 bg-brand-500 text-white rounded-lg font-medium hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'Saving...' : 'Save Preferences'}
            </button>
            <button
              onClick={() => router.back()}
              disabled={saving}
              className="flex-1 py-2.5 border border-gray-300 text-gray-600 rounded-lg font-medium hover:bg-gray-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Future settings placeholder */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 space-y-4">
          <h3 className="font-semibold text-gray-700">Coming Soon</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• Theme preferences (light/dark mode)</li>
            <li>• Email notification settings</li>
            <li>• Privacy and data export options</li>
            <li>• Account management and deletion</li>
          </ul>
        </div>
      </div>
    </>
  )
}
