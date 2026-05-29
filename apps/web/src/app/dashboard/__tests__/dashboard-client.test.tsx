/* @jest-environment jsdom */
import { render, screen, act } from '@testing-library/react'
import { DashboardClient } from '@/app/dashboard/dashboard-client'

jest.mock('@/components/onboarding-modal', () => ({
  OnboardingModal: ({ isOpen, onComplete }: { isOpen: boolean; onComplete: () => void }) =>
    isOpen ? <div data-testid="onboarding-modal"><button onClick={onComplete}>Complete</button></div> : null,
}))

beforeEach(() => localStorage.clear())

describe('DashboardClient', () => {
  it('renders children', async () => {
    await act(async () => {
      render(
        <DashboardClient isFirstTime={false}>
          <span data-testid="child">content</span>
        </DashboardClient>
      )
    })
    expect(screen.getByTestId('child')).toBeInTheDocument()
  })

  it('does not show onboarding when isFirstTime is false', async () => {
    await act(async () => {
      render(<DashboardClient isFirstTime={false}><span /></DashboardClient>)
    })
    expect(screen.queryByTestId('onboarding-modal')).not.toBeInTheDocument()
  })

  it('shows onboarding when isFirstTime and not previously dismissed', async () => {
    await act(async () => {
      render(<DashboardClient isFirstTime={true}><span /></DashboardClient>)
    })
    expect(screen.getByTestId('onboarding-modal')).toBeInTheDocument()
  })

  it('does not show onboarding when already dismissed', async () => {
    localStorage.setItem('onboarding_dismissed', 'true')
    await act(async () => {
      render(<DashboardClient isFirstTime={true}><span /></DashboardClient>)
    })
    expect(screen.queryByTestId('onboarding-modal')).not.toBeInTheDocument()
  })

  it('dismisses onboarding and sets localStorage on complete', async () => {
    await act(async () => {
      render(<DashboardClient isFirstTime={true}><span /></DashboardClient>)
    })
    await act(async () => {
      screen.getByText('Complete').click()
    })
    expect(screen.queryByTestId('onboarding-modal')).not.toBeInTheDocument()
    expect(localStorage.getItem('onboarding_dismissed')).toBe('true')
  })
})
