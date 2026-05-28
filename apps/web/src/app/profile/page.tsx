'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Nav } from '@/components/nav'
import { logger } from '@/lib/logger'
import { SkeletonText, SkeletonCard } from '@/components/skeleton'
import type { Profile } from '@/types/database'

interface ProfileData {
  profile: Profile
  stats: {
    entryCount: number
    lastCheckIn: string | null
  }
}

export default function ProfilePage() {
  const router = useRouter()
  const supabase = createClient()

  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form state
  const [fullName, setFullName] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [department, setDepartment] = useState('')
  const [managerName, setManagerName] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    loadProfile()
  }, [])

  async function loadProfile() {
    try {
      const res = await fetch('/api/profile')
      const data = await res.json()

      if (!res.ok) {
        logger.error('Failed to load profile', data, 'profile')
        setError('Failed to load profile')
        return
      }

      setProfileData(data)
      const { profile } = data
      setFullName(profile.full_name || '')
      setJobTitle(profile.job_title || '')
      setDepartment(profile.department || '')
      setManagerName(profile.manager_name || '')
    } catch (err) {
      logger.error('Error loading profile', err, 'profile')
      setError('Error loading profile')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    setError('')
    setSaving(true)

    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName || null,
          job_title: jobTitle || null,
          department: department || null,
          manager_name: managerName || null,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        logger.error('Failed to save profile', data, 'profile')
        setError(data.error || 'Failed to save profile')
        return
      }

      setProfileData(prev => (prev ? { ...prev, profile: data.profile } : null))
      setEditing(false)
      logger.info('Profile saved', {}, 'profile')
    } catch (err) {
      logger.error('Error saving profile', err, 'profile')
      setError('Error saving profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <>
        <Nav />
        <div className="max-w-2xl mx-auto p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-40 bg-gray-200 rounded"></div>
          </div>
        </div>
      </>
    )
  }

  if (!profileData) {
    return (
      <>
        <Nav />
        <div className="max-w-2xl mx-auto p-8 text-center">
          <p className="text-red-500">{error || 'Failed to load profile'}</p>
        </div>
      </>
    )
  }

  const { profile, stats } = profileData

  return (
    <>
      <Nav />
      <div className="max-w-2xl mx-auto p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-brand-700">Profile</h1>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="px-4 py-2 border border-brand-500 text-brand-500 rounded-lg font-medium hover:bg-blue-50 transition-colors"
            >
              Edit
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-600 text-sm">Total Check-ins</p>
            <p className="text-2xl font-bold text-brand-700">{stats.entryCount}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-600 text-sm">Last Check-in</p>
            <p className="text-sm font-medium text-gray-700">
              {stats.lastCheckIn
                ? new Date(stats.lastCheckIn).toLocaleDateString()
                : 'Never'}
            </p>
          </div>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        {/* Profile Form */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={profile.email}
              disabled
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-gray-50 text-gray-600 cursor-not-allowed"
            />
            <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              disabled={!editing}
              placeholder="Your full name"
              className={`w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                !editing ? 'bg-gray-50 cursor-not-allowed text-gray-600' : ''
              }`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
            <input
              type="text"
              value={jobTitle}
              onChange={e => setJobTitle(e.target.value)}
              disabled={!editing}
              placeholder="e.g., Senior Engineer"
              className={`w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                !editing ? 'bg-gray-50 cursor-not-allowed text-gray-600' : ''
              }`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <input
              type="text"
              value={department}
              onChange={e => setDepartment(e.target.value)}
              disabled={!editing}
              placeholder="e.g., Engineering"
              className={`w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                !editing ? 'bg-gray-50 cursor-not-allowed text-gray-600' : ''
              }`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Manager Name</label>
            <input
              type="text"
              value={managerName}
              onChange={e => setManagerName(e.target.value)}
              disabled={!editing}
              placeholder="Your manager's name"
              className={`w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                !editing ? 'bg-gray-50 cursor-not-allowed text-gray-600' : ''
              }`}
            />
          </div>

          {editing && (
            <div className="flex gap-2 pt-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2.5 bg-brand-500 text-white rounded-lg font-medium hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={() => {
                  setEditing(false)
                  setFullName(profile.full_name || '')
                  setJobTitle(profile.job_title || '')
                  setDepartment(profile.department || '')
                  setManagerName(profile.manager_name || '')
                  setError('')
                }}
                disabled={saving}
                className="flex-1 py-2.5 border border-gray-300 text-gray-600 rounded-lg font-medium hover:bg-gray-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
