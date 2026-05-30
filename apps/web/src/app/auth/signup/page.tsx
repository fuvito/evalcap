'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>
    )
  }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}

export default function SignupPage() {
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setConfirmed(true)
  }

  async function handleGoogleSignUp() {
    setError('')
    setGoogleLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback` },
    })
    if (error) {
      setError(error.message)
      setGoogleLoading(false)
    }
  }

  if (confirmed) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 sm:p-8 bg-slate-50 dark:bg-slate-950">
        <div className="w-full max-w-sm text-center space-y-4">
          <div className="text-4xl">✉️</div>
          <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Check your email</h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm">
            We sent a confirmation link to <strong>{email}</strong>.
            Click it to activate your account.
          </p>
          <Link href="/auth/login" className="text-brand-500 dark:text-brand-400 hover:underline text-sm">
            Back to sign in
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 sm:p-8 bg-slate-50 dark:bg-slate-950">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-brand-600 dark:text-brand-400 font-bold text-xl mb-6">EvalCap</div>
          <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">Create account</h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">Start capturing your wins with EvalCap</p>
        </div>

        <button
          onClick={handleGoogleSignUp}
          disabled={googleLoading || loading}
          className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm mb-4"
        >
          <GoogleIcon />
          {googleLoading ? 'Redirecting...' : 'Continue with Google'}
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-gray-200 dark:bg-slate-700" />
          <span className="text-xs text-gray-400 dark:text-slate-500">or</span>
          <div className="flex-1 h-px bg-gray-200 dark:bg-slate-700" />
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl p-6 shadow-sm space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full border border-gray-200 dark:border-slate-600 rounded-lg p-2.5 text-sm text-gray-800 dark:text-slate-200 bg-gray-50 dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-slate-600 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
                className="w-full border border-gray-200 dark:border-slate-600 rounded-lg p-2.5 pr-10 text-sm text-gray-800 dark:text-slate-200 bg-gray-50 dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-slate-600 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <EyeIcon open={showPassword} />
              </button>
            </div>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">Minimum 6 characters</p>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading || googleLoading}
            className="w-full py-2.5 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 dark:text-slate-500 mt-4 leading-relaxed">
          By creating an account you agree to our{' '}
          <Link href="/terms" className="underline hover:text-brand-500 dark:hover:text-brand-400 transition-colors">Terms of Service</Link>
          {' '}and{' '}
          <Link href="/privacy" className="underline hover:text-brand-500 dark:hover:text-brand-400 transition-colors">Privacy Policy</Link>.
        </p>

        <p className="text-center text-sm text-gray-500 dark:text-slate-400 mt-3">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-brand-500 dark:text-brand-400 hover:text-brand-600 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  )
}
