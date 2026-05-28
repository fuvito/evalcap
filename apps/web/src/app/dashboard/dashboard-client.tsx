'use client'

import { useState, useEffect } from 'react'
import { OnboardingModal } from '@/components/onboarding-modal'

interface DashboardClientProps {
  isFirstTime: boolean
  children: React.ReactNode
}

export function DashboardClient({ isFirstTime, children }: DashboardClientProps) {
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    // Show onboarding modal if it's the first time and not already dismissed
    if (isFirstTime) {
      const dismissed = localStorage.getItem('onboarding_dismissed')
      if (!dismissed) {
        setShowOnboarding(true)
      }
    }
  }, [isFirstTime])

  function handleComplete() {
    localStorage.setItem('onboarding_dismissed', 'true')
    setShowOnboarding(false)
  }

  return (
    <>
      <OnboardingModal isOpen={showOnboarding} onComplete={handleComplete} />
      {children}
    </>
  )
}
