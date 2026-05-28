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
  const [skipping, setSkipping] = useState(false)

  if (!isOpen) return null

  async function handleSkip() {
    setSkipping(true)
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
      setSkipping(false)
    }
  }

  async function handleComplete() {
    setSkipping(true)
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
      setSkipping(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 space-y-6">
        {/* Step 1: Welcome */}
        {step === 1 && (
          <>
            <div className="text-center space-y-3">
              <div className="text-5xl">📝</div>
              <h2 className="text-2xl font-bold text-gray-900">Welcome to EvalCap</h2>
              <p className="text-gray-600">
                Your personal performance review journal for thoughtful, honest reflection.
              </p>
            </div>

            <div className="space-y-3 pt-4">
              <button
                onClick={() => setStep(2)}
                className="w-full py-3 bg-brand-500 text-white rounded-lg font-medium hover:bg-brand-600 transition-colors"
              >
                Get Started
              </button>
              <button
                onClick={handleSkip}
                disabled={skipping}
                className="w-full py-3 border border-gray-300 text-gray-600 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Skip for now
              </button>
            </div>
          </>
        )}

        {/* Step 2: How It Works */}
        {step === 2 && (
          <>
            <div className="text-center space-y-3">
              <div className="text-5xl">⚙️</div>
              <h2 className="text-2xl font-bold text-gray-900">How EvalCap Works</h2>
            </div>

            <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
              <div className="flex gap-3">
                <div className="flex-shrink-0 text-xl">✓</div>
                <div>
                  <p className="font-medium text-gray-900">Daily & Weekly Check-ins</p>
                  <p className="text-sm text-gray-600">Answer AI-powered prompts based on your recent work</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 text-xl">✓</div>
                <div>
                  <p className="font-medium text-gray-900">Smart Prompts</p>
                  <p className="text-sm text-gray-600">Prompts adapt based on your previous entries</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 text-xl">✓</div>
                <div>
                  <p className="font-medium text-gray-900">Performance Summaries</p>
                  <p className="text-sm text-gray-600">Generate AI-compiled review summaries anytime</p>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <button
                onClick={() => setStep(3)}
                className="w-full py-3 bg-brand-500 text-white rounded-lg font-medium hover:bg-brand-600 transition-colors"
              >
                Continue
              </button>
              <button
                onClick={() => setStep(1)}
                className="w-full py-3 border border-gray-300 text-gray-600 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
            </div>
          </>
        )}

        {/* Step 3: Why Journaling Helps */}
        {step === 3 && (
          <>
            <div className="text-center space-y-3">
              <div className="text-5xl">💡</div>
              <h2 className="text-2xl font-bold text-gray-900">Why Journal?</h2>
            </div>

            <div className="space-y-3 text-gray-700">
              <p className="text-sm">
                Regular check-ins help you:
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex gap-2">
                  <span>•</span>
                  <span>Remember your accomplishments throughout the year</span>
                </li>
                <li className="flex gap-2">
                  <span>•</span>
                  <span>Document impact and learnings while they're fresh</span>
                </li>
                <li className="flex gap-2">
                  <span>•</span>
                  <span>Create honest, credible performance reviews</span>
                </li>
                <li className="flex gap-2">
                  <span>•</span>
                  <span>Track progress toward goals</span>
                </li>
                <li className="flex gap-2">
                  <span>•</span>
                  <span>Build confidence in your achievements</span>
                </li>
              </ul>
            </div>

            <div className="space-y-3 pt-2">
              <Link
                href="/checkin"
                onClick={handleComplete}
                className="block w-full py-3 bg-brand-500 text-white rounded-lg font-medium hover:bg-brand-600 transition-colors text-center"
              >
                Create Your First Check-in →
              </Link>
              <button
                onClick={() => setStep(2)}
                className="w-full py-3 border border-gray-300 text-gray-600 rounded-lg font-medium hover:bg-gray-50 transition-colors"
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
