'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
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
        <div className="max-w-3xl mx-auto p-4 md:p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 dark:bg-slate-700 rounded w-1/4"></div>
            <div className="h-40 bg-gray-200 dark:bg-slate-700 rounded"></div>
          </div>
        </div>
      </>
    )
  }

  if (!profileData) {
    return (
      <>
        <Nav />
        <div className="max-w-3xl mx-auto p-4 md:p-8 text-center">
          <p className="text-red-500 dark:text-red-400">{error || 'Failed to load profile'}</p>
        </div>
      </>
    )
  }

  const { profile, stats } = profileData

  return (
    <>
      <Nav />
      <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">Profile</h1>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="px-4 py-2 border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-400 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
            >
              Edit
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm">
            <p className="text-xs font-medium text-gray-400 dark:text-slate-500 uppercase tracking-wide">Total Check-ins</p>
            <p className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-1">{stats.entryCount}</p>
            {stats.entryCount === 0 && (
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-2">Start checking in to build your record</p>
            )}
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm">
            <p className="text-xs font-medium text-gray-400 dark:text-slate-500 uppercase tracking-wide">Last Check-in</p>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mt-1">
              {stats.lastCheckIn
                ? new Date(stats.lastCheckIn).toLocaleDateString()
                : '—'}
            </p>
            {!stats.lastCheckIn && (
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-2">Create your first one today</p>
            )}
          </div>
        </div>

        {/* First-time user guidance */}
        {stats.entryCount === 0 && (
          <div className="bg-brand-50 dark:bg-slate-800 border border-brand-100 dark:border-slate-700 rounded-xl p-4">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              <span className="font-medium">Welcome to EvalCap!</span> Start by completing your profile below, then head to{' '}
              <Link href="/checkin" className="text-brand-600 font-medium hover:underline">
                Check-in
              </Link>
              {' '}to create your first journal entry.
            </p>
          </div>
        )}

        {error && <p className="text-red-500 dark:text-red-400 text-sm">{error}</p>}

        {/* Profile Form */}
        <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl p-6 shadow-sm space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Email</label>
            <input
              type="email"
              value={profile.email}
              disabled
              className="w-full border border-gray-300 dark:border-slate-600 rounded-lg p-2.5 text-sm bg-gray-50 dark:bg-slate-700 text-gray-700 dark:text-slate-400 cursor-not-allowed"
            />
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">Email cannot be changed</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              disabled={!editing}
              placeholder="Your full name"
              className={`w-full border border-gray-300 dark:border-slate-600 rounded-lg p-2.5 text-sm placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                !editing
                  ? 'bg-gray-50 dark:bg-slate-700 cursor-not-allowed text-gray-600 dark:text-slate-400'
                  : 'text-gray-900 dark:text-slate-200 bg-white dark:bg-slate-700 focus:bg-white dark:focus:bg-slate-600'
              }`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Job Title</label>
            <input
              type="text"
              value={jobTitle}
              onChange={e => setJobTitle(e.target.value)}
              disabled={!editing}
              placeholder="e.g., Senior Engineer"
              className={`w-full border border-gray-300 dark:border-slate-600 rounded-lg p-2.5 text-sm placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                !editing
                  ? 'bg-gray-50 dark:bg-slate-700 cursor-not-allowed text-gray-600 dark:text-slate-400'
                  : 'text-gray-900 dark:text-slate-200 bg-white dark:bg-slate-700 focus:bg-white dark:focus:bg-slate-600'
              }`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Department</label>
            <input
              type="text"
              value={department}
              onChange={e => setDepartment(e.target.value)}
              disabled={!editing}
              placeholder="e.g., Engineering"
              className={`w-full border border-gray-300 dark:border-slate-600 rounded-lg p-2.5 text-sm placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                !editing
                  ? 'bg-gray-50 dark:bg-slate-700 cursor-not-allowed text-gray-600 dark:text-slate-400'
                  : 'text-gray-900 dark:text-slate-200 bg-white dark:bg-slate-700 focus:bg-white dark:focus:bg-slate-600'
              }`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Manager Name</label>
            <input
              type="text"
              value={managerName}
              onChange={e => setManagerName(e.target.value)}
              disabled={!editing}
              placeholder="Your manager's name"
              className={`w-full border border-gray-300 dark:border-slate-600 rounded-lg p-2.5 text-sm placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                !editing
                  ? 'bg-gray-50 dark:bg-slate-700 cursor-not-allowed text-gray-600 dark:text-slate-400'
                  : 'text-gray-900 dark:text-slate-200 bg-white dark:bg-slate-700 focus:bg-white dark:focus:bg-slate-600'
              }`}
            />
          </div>

          {editing && (
            <div className="flex gap-2 pt-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2.5 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
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
                className="flex-1 py-2.5 border border-gray-200 dark:border-slate-600 text-gray-500 dark:text-slate-400 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-slate-700 disabled:cursor-not-allowed transition-colors text-sm"
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
