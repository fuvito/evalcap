'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Props = {
  userId: string
  status: string | null
  credits: { balance: number; allocated_per_month: number } | null
}

export function UserActions({ userId, status, credits }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')

  const isSuspended = status === 'suspended'

  async function handleResetPassword() {
    if (!confirm('Send a password reset email to this user?')) return
    setLoading(true)
    setMsg(null)
    try {
      const res = await fetch(`/api/users/${userId}/reset-password`, { method: 'POST' })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed')
      setMsg({ type: 'success', text: 'Password reset email sent.' })
    } catch (e) {
      setMsg({ type: 'error', text: e instanceof Error ? e.message : 'Something went wrong' })
    } finally {
      setLoading(false)
    }
  }

  async function handleSuspend() {
    if (!confirm(`${isSuspended ? 'Unsuspend' : 'Suspend'} this user?${!isSuspended ? ' They will be blocked from logging in.' : ''}`)) return
    setLoading(true)
    setMsg(null)
    try {
      const res = await fetch(`/api/users/${userId}/suspend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suspended: !isSuspended }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed')
      setMsg({ type: 'success', text: `User ${isSuspended ? 'unsuspended' : 'suspended'} successfully.` })
      router.refresh()
    } catch (e) {
      setMsg({ type: 'error', text: e instanceof Error ? e.message : 'Something went wrong' })
    } finally {
      setLoading(false)
    }
  }

  async function handleAddCredits(e: React.FormEvent) {
    e.preventDefault()
    const delta = parseInt(amount, 10)
    if (!delta || delta <= 0) return
    setLoading(true)
    setMsg(null)
    try {
      const res = await fetch(`/api/users/${userId}/credits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delta, reason: reason.trim() || null }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed')
      setMsg({ type: 'success', text: `Added ${delta} credit${delta !== 1 ? 's' : ''}.` })
      setAmount('')
      setReason('')
      router.refresh()
    } catch (e) {
      setMsg({ type: 'error', text: e instanceof Error ? e.message : 'Something went wrong' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {msg && (
        <div className={`px-3 py-2.5 rounded-lg text-sm border ${
          msg.type === 'success'
            ? 'bg-green-50 text-green-700 border-green-200'
            : 'bg-red-50 text-red-700 border-red-200'
        }`}>
          {msg.text}
        </div>
      )}

      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <h3 className="text-sm font-semibold text-slate-700 mb-1">Account Status</h3>
        <p className="text-xs text-slate-400 mb-3">
          {isSuspended ? 'User is currently blocked from logging in.' : 'User has full access.'}
        </p>
        <button
          onClick={handleSuspend}
          disabled={loading}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            isSuspended
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-red-600 hover:bg-red-700 text-white'
          }`}
        >
          {isSuspended ? 'Unsuspend User' : 'Suspend User'}
        </button>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <h3 className="text-sm font-semibold text-slate-700 mb-1">Password Reset</h3>
        <p className="text-xs text-slate-400 mb-3">Send a password reset email to this user.</p>
        <button
          onClick={handleResetPassword}
          disabled={loading}
          className="px-4 py-2 text-sm font-medium bg-slate-700 hover:bg-slate-800 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Send Reset Email
        </button>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <h3 className="text-sm font-semibold text-slate-700 mb-1">Credits</h3>
        <p className="text-sm text-slate-500 mb-3">
          Balance:{' '}
          <span className="font-semibold text-slate-800">{credits?.balance ?? 0}</span>
          <span className="text-slate-400 mx-1">/</span>
          <span>{credits?.allocated_per_month ?? 50} monthly</span>
        </p>
        <form onSubmit={handleAddCredits} className="space-y-2">
          <div className="flex gap-2">
            <input
              type="number"
              min="1"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="Amount"
              className="w-24 px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <input
              type="text"
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Reason (optional)"
              className="flex-1 px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !amount || parseInt(amount, 10) <= 0}
            className="px-4 py-1.5 text-sm font-medium bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add Credits
          </button>
        </form>
      </div>
    </div>
  )
}
