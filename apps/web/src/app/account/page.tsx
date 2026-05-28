'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Nav } from '@/components/nav'
import { logger } from '@/lib/logger'

export default function AccountPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [loadingUser, setLoadingUser] = useState(true)

  // Change email
  const [showEmailForm, setShowEmailForm] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [savingEmail, setSavingEmail] = useState(false)
  const [emailSuccess, setEmailSuccess] = useState(false)
  const [emailError, setEmailError] = useState('')

  // Change password
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [passwordError, setPasswordError] = useState('')

  // Delete account
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteText, setDeleteText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  // Export
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/auth/login'); return }
      setEmail(user.email ?? '')
      setLoadingUser(false)
    })
  }, [])

  async function handleChangeEmail(e: React.FormEvent) {
    e.preventDefault()
    setEmailError('')
    setEmailSuccess(false)
    setSavingEmail(true)

    const { error } = await supabase.auth.updateUser({ email: newEmail })

    if (error) {
      setEmailError(error.message)
    } else {
      setEmailSuccess(true)
      setShowEmailForm(false)
      setNewEmail('')
      logger.info('Email change requested', {}, 'account')
    }
    setSavingEmail(false)
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess(false)

    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.')
      return
    }

    setSavingPassword(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })

    if (error) {
      setPasswordError(error.message)
    } else {
      setPasswordSuccess(true)
      setShowPasswordForm(false)
      setNewPassword('')
      setConfirmPassword('')
      logger.info('Password changed', {}, 'account')
    }
    setSavingPassword(false)
  }

  async function handleExport() {
    setExporting(true)
    try {
      const res = await fetch('/api/account/export')
      if (!res.ok) { setExporting(false); return }

      const blob = await res.blob()
      const disposition = res.headers.get('Content-Disposition') ?? ''
      const match = disposition.match(/filename="(.+)"/)
      const filename = match?.[1] ?? 'evalcap-export.json'

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      // silent — file download failures are obvious to the user
    } finally {
      setExporting(false)
    }
  }

  async function handleDeleteAccount() {
    setDeleteError('')
    setDeleting(true)

    try {
      const res = await fetch('/api/account', { method: 'DELETE' })

      if (!res.ok) {
        const data = await res.json()
        setDeleteError(data.error || 'Failed to delete account')
        setDeleting(false)
        return
      }

      await supabase.auth.signOut()
      router.push('/auth/login')
    } catch {
      setDeleteError('Something went wrong. Please try again.')
      setDeleting(false)
    }
  }

  if (loadingUser) {
    return (
      <>
        <Nav />
        <div className="max-w-3xl mx-auto px-4 md:px-8 py-8">
          <div className="h-8 bg-gray-200 dark:bg-slate-700 rounded w-1/4 animate-pulse" />
        </div>
      </>
    )
  }

  const inputClass = "w-full border border-gray-200 dark:border-slate-600 rounded-lg p-2.5 text-sm text-gray-800 dark:text-slate-200 bg-gray-50 dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-slate-600 transition-colors"
  const sectionClass = "bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl p-6 shadow-sm space-y-5"

  return (
    <>
      <Nav />
      <div className="max-w-3xl mx-auto px-4 md:px-8 py-8 space-y-6">
        <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">Account</h1>

        {/* Security */}
        <div className={sectionClass}>
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Security</h2>

          {/* Change email */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Email address</p>
                <p className="text-sm text-gray-500 dark:text-slate-400">{email}</p>
              </div>
              <button
                onClick={() => { setShowEmailForm(v => !v); setEmailError(''); setEmailSuccess(false) }}
                className="text-xs text-brand-500 dark:text-brand-400 hover:text-brand-600 transition-colors"
              >
                {showEmailForm ? 'Cancel' : 'Change'}
              </button>
            </div>

            {emailSuccess && (
              <p className="text-xs text-green-600 dark:text-green-400">Confirmation sent to your new email — click the link to confirm the change.</p>
            )}

            {showEmailForm && (
              <form onSubmit={handleChangeEmail} className="space-y-3 pt-1">
                <input
                  type="email"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  placeholder="New email address"
                  required
                  autoFocus
                  className={inputClass}
                />
                {emailError && <p className="text-red-400 text-xs">{emailError}</p>}
                <button
                  type="submit"
                  disabled={savingEmail || !newEmail}
                  className="px-4 py-2 bg-brand-600 text-white text-sm rounded-lg font-medium hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {savingEmail ? 'Saving...' : 'Update email'}
                </button>
              </form>
            )}
          </div>

          <div className="border-t border-gray-100 dark:border-slate-700" />

          {/* Change password */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Password</p>
                <p className="text-sm text-gray-500 dark:text-slate-400">••••••••</p>
              </div>
              <button
                onClick={() => { setShowPasswordForm(v => !v); setPasswordError(''); setPasswordSuccess(false) }}
                className="text-xs text-brand-500 dark:text-brand-400 hover:text-brand-600 transition-colors"
              >
                {showPasswordForm ? 'Cancel' : 'Change'}
              </button>
            </div>

            {passwordSuccess && (
              <p className="text-xs text-green-600 dark:text-green-400">Password updated successfully.</p>
            )}

            {showPasswordForm && (
              <form onSubmit={handleChangePassword} className="space-y-3 pt-1">
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="New password (min 8 characters)"
                  required
                  minLength={8}
                  autoFocus
                  autoComplete="new-password"
                  className={inputClass}
                />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                  autoComplete="new-password"
                  className={inputClass}
                />
                {passwordError && <p className="text-red-400 text-xs">{passwordError}</p>}
                <button
                  type="submit"
                  disabled={savingPassword || !newPassword || !confirmPassword}
                  className="px-4 py-2 bg-brand-600 text-white text-sm rounded-lg font-medium hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {savingPassword ? 'Saving...' : 'Update password'}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Data */}
        <div className={sectionClass}>
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Your Data</h2>

          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Export data</p>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Download all your entries and summaries as JSON.</p>
            </div>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="flex-shrink-0 px-4 py-2 border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-400 text-sm rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {exporting ? 'Exporting...' : 'Export'}
            </button>
          </div>
        </div>

        {/* Danger zone */}
        <div className="bg-white dark:bg-slate-800 border border-red-100 dark:border-red-900/50 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide">Danger Zone</h2>

          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Delete account</p>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Permanently delete your account and all your data. This cannot be undone.</p>
            </div>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex-shrink-0 px-4 py-2 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm rounded-lg font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              Delete
            </button>
          </div>

          {showDeleteConfirm && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 space-y-3">
              <p className="text-sm text-red-700 dark:text-red-400">
                This will permanently delete your account, all journal entries, and all summaries. Type <strong>DELETE</strong> to confirm.
              </p>
              <input
                type="text"
                value={deleteText}
                onChange={e => setDeleteText(e.target.value)}
                placeholder="Type DELETE to confirm"
                autoFocus
                className="w-full border border-red-200 dark:border-red-700 rounded-lg p-2.5 text-sm bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-red-400"
              />
              {deleteError && <p className="text-red-500 text-xs">{deleteError}</p>}
              <div className="flex gap-2">
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteText !== 'DELETE' || deleting}
                  className="flex-1 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {deleting ? 'Deleting...' : 'Delete my account'}
                </button>
                <button
                  onClick={() => { setShowDeleteConfirm(false); setDeleteText(''); setDeleteError('') }}
                  disabled={deleting}
                  className="flex-1 py-2 border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-400 text-sm rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
