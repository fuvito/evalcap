'use client'

import { useState } from 'react'
import Link from 'next/link'
import { logger } from '@/lib/logger'

interface OnboardingModalProps {
  isOpen: boolean
  onComplete: () => void
}

export function OnboardingModal({ isOpen, onComplete }: OnboardingModalProps) {
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [fullName, setFullName] = useState('')
  const [jobTitle, setJobTitle] = useState('')

  if (!isOpen) return null

  const totalSteps = 3

  async function handleSkip() {
    setSaving(true)
    try {
      await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ onboarding_completed: true }),
      })
      logger.info('Onboarding skipped', {}, 'onboarding')
      onComplete()
    } catch (err) {
      logger.error('Error skipping onboarding', err, 'onboarding')
    } finally {
      setSaving(false)
    }
  }

  async function handleProfileContinue() {
    setSaving(true)
    try {
      if (fullName || jobTitle) {
        await fetch('/api/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            full_name: fullName || null,
            job_title: jobTitle || null,
          }),
        })
      }
      setStep(3)
    } catch (err) {
      logger.error('Error saving profile during onboarding', err, 'onboarding')
      setStep(3)
    } finally {
      setSaving(false)
    }
  }

  async function handleComplete() {
    setSaving(true)
    try {
      await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ onboarding_completed: true }),
      })
      logger.info('Onboarding completed', {}, 'onboarding')
      onComplete()
    } catch (err) {
      logger.error('Error completing onboarding', err, 'onboarding')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">

        {/* Step indicators */}
        <div className="flex justify-center gap-2" aria-label={`Step ${step} of ${totalSteps}`}>
          {Array.from({ length: totalSteps }, (_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i + 1 === step
                  ? 'w-6 bg-brand-500'
                  : i + 1 < step
                  ? 'w-3 bg-brand-300 dark:bg-brand-700'
                  : 'w-3 bg-gray-200 dark:bg-slate-600'
              }`}
            />
          ))}
        </div>

        {/* Step 1: Welcome */}
        {step === 1 && (
          <>
            <div className="text-center space-y-3">
              <div className="text-5xl">📝</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Welcome to EvalCap</h2>
              <p className="text-gray-600 dark:text-slate-400">
                Your personal performance review journal. Capture wins as they happen — never scramble before your eval again.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <button
                onClick={() => setStep(2)}
                className="w-full py-3 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition-colors"
              >
                Get Started
              </button>
              <button
                onClick={handleSkip}
                disabled={saving}
                className="w-full py-3 border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-400 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                Skip for now
              </button>
            </div>
          </>
        )}

        {/* Step 2: Profile setup */}
        {step === 2 && (
          <>
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">Quick setup</h2>
              <p className="text-sm text-gray-600 dark:text-slate-400">
                Helps AI personalize your check-in prompts from day one. Both fields are optional.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                  Your name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="e.g., Alex Johnson"
                  className="w-full border border-gray-200 dark:border-slate-600 rounded-lg p-2.5 text-sm text-gray-800 dark:text-slate-200 bg-gray-50 dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-slate-600 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                  Job title
                </label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={e => setJobTitle(e.target.value)}
                  placeholder="e.g., Senior Software Engineer"
                  className="w-full border border-gray-200 dark:border-slate-600 rounded-lg p-2.5 text-sm text-gray-800 dark:text-slate-200 bg-gray-50 dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-slate-600 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleProfileContinue}
                disabled={saving}
                className="w-full py-3 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Continue'}
              </button>
              <button
                onClick={() => setStep(1)}
                disabled={saving}
                className="w-full py-3 border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-400 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                Back
              </button>
            </div>
          </>
        )}

        {/* Step 3: How it works + CTA */}
        {step === 3 && (
          <>
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">You're all set</h2>
              <p className="text-sm text-gray-600 dark:text-slate-400">Here's how EvalCap works:</p>
            </div>

            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center text-brand-600 dark:text-brand-400 text-xs font-bold">1</div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-slate-200">Check in regularly</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400">Daily or weekly — AI generates prompts based on your previous entries</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center text-brand-600 dark:text-brand-400 text-xs font-bold">2</div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-slate-200">Track goals & cycles</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400">Set evaluation goals and performance cycles to stay organized</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center text-brand-600 dark:text-brand-400 text-xs font-bold">3</div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-slate-200">Generate your review</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400">When eval time comes, AI compiles your entries into a professional summary</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Link
                href="/checkin"
                onClick={handleComplete}
                className="block w-full py-3 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition-colors text-center"
              >
                Create Your First Check-in →
              </Link>
              <button
                onClick={() => setStep(2)}
                disabled={saving}
                className="w-full py-3 border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-400 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                Back
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  )
}
