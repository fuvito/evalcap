'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function BillingActions({ isPro }: { isPro: boolean }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleUpgrade() {
    setLoading(true)
    const res = await fetch('/api/checkout', { method: 'POST' })
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
    <button
      onClick={handleUpgrade}
      disabled={loading}
      className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
    >
      {loading ? 'Redirecting to Stripe…' : 'Upgrade to Pro'}
    </button>
  )
}
