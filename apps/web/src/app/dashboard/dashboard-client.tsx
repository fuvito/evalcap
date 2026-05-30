'use client'

import { useState, useEffect } from 'react'
import { OnboardingModal } from '@/components/onboarding-modal'

interface DashboardClientProps {
  onboardingCompleted: boolean
  children: React.ReactNode
}

export function DashboardClient({ onboardingCompleted, children }: DashboardClientProps) {
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    if (!onboardingCompleted) {
      setShowOnboarding(true)
    }
  }, [onboardingCompleted])

  function handleComplete() {
    setShowOnboarding(false)
  }

  return (
    <>
      <OnboardingModal isOpen={showOnboarding} onComplete={handleComplete} />
      {children}
    </>
  )
}
