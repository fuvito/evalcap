'use client'

import { useState } from 'react'

export function BillingActions({ isPro }: { isPro: boolean }) {
  const [interval, setInterval] = useState<'monthly' | 'annual'>('monthly')
  const [loading, setLoading] = useState(false)

  async function handleUpgrade() {
    setLoading(true)
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ interval }),
    })
    const { url } = await res.json()
    if (url) window.location.href = url
    else setLoading(false)
  }

  async function handleManage() {
    setLoading(true)
    const res = await fetch('/api/billing/portal', { method: 'POST' })
    const { url } = await res.json()
    if (url) window.location.href = url
    else setLoading(false)
  }

  if (isPro) {
    return (
      <button
        onClick={handleManage}
        disabled={loading}
        className="text-sm font-medium text-slate-600 hover:text-slate-800 underline underline-offset-2 disabled:opacity-50 transition-colors"
      >
        {loading ? 'Opening portal…' : 'Manage billing →'}
      </button>
    )
  }

  return (
    <div className="space-y-3">
      {/* Interval toggle */}
      <div className="flex rounded-lg border border-slate-200 overflow-hidden text-sm">
        <button
          onClick={() => setInterval('monthly')}
          className={`flex-1 py-2 font-medium transition-colors ${
            interval === 'monthly'
              ? 'bg-slate-800 text-white'
              : 'bg-white text-slate-500 hover:bg-slate-50'
          }`}
        >
          Monthly
          <span className="block text-xs font-normal opacity-80">$9.99 / mo</span>
        </button>
        <button
          onClick={() => setInterval('annual')}
          className={`flex-1 py-2 font-medium transition-colors relative ${
            interval === 'annual'
              ? 'bg-slate-800 text-white'
              : 'bg-white text-slate-500 hover:bg-slate-50'
          }`}
        >
          Annual
          <span className="block text-xs font-normal opacity-80">$99.99 / yr</span>
          <span className={`absolute -top-2.5 right-2 text-xs font-semibold px-1.5 py-0.5 rounded-full ${
            interval === 'annual' ? 'bg-green-400 text-green-900' : 'bg-green-100 text-green-700'
          }`}>
            Save 17%
          </span>
        </button>
      </div>

      <button
        onClick={handleUpgrade}
        disabled={loading}
        className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
      >
        {loading ? 'Redirecting to Stripe…' : 'Upgrade to Pro'}
      </button>
    </div>
  )
}
