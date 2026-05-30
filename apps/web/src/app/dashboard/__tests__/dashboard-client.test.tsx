/* @jest-environment jsdom */
import { render, screen, act } from '@testing-library/react'
import { DashboardClient } from '@/app/dashboard/dashboard-client'

jest.mock('@/components/onboarding-modal', () => ({
  OnboardingModal: ({ isOpen, onComplete }: { isOpen: boolean; onComplete: () => void }) =>
    isOpen ? <div data-testid="onboarding-modal"><button onClick={onComplete}>Complete</button></div> : null,
}))

describe('DashboardClient', () => {
  it('renders children', async () => {
    await act(async () => {
      render(
        <DashboardClient onboardingCompleted={true}>
          <span data-testid="child">content</span>
        </DashboardClient>
      )
    })
    expect(screen.getByTestId('child')).toBeInTheDocument()
  })

  it('does not show onboarding when onboardingCompleted is true', async () => {
    await act(async () => {
      render(<DashboardClient onboardingCompleted={true}><span /></DashboardClient>)
    })
    expect(screen.queryByTestId('onboarding-modal')).not.toBeInTheDocument()
  })

  it('shows onboarding when onboardingCompleted is false', async () => {
    await act(async () => {
      render(<DashboardClient onboardingCompleted={false}><span /></DashboardClient>)
    })
    expect(screen.getByTestId('onboarding-modal')).toBeInTheDocument()
  })

  it('dismisses onboarding on complete', async () => {
    await act(async () => {
      render(<DashboardClient onboardingCompleted={false}><span /></DashboardClient>)
    })
    await act(async () => {
      screen.getByText('Complete').click()
    })
    expect(screen.queryByTestId('onboarding-modal')).not.toBeInTheDocument()
  })
})
