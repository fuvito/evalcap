/* @jest-environment jsdom */
import { render, screen, act } from '@testing-library/react'

const mockRedirect = jest.fn((url: string) => { throw new Error(`Redirect:${url}`) })

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}))

jest.mock('next/navigation', () => ({
  redirect: (url: string) => mockRedirect(url),
}))

jest.mock('@/lib/cache', () => ({
  getCachedDashboardData: jest.fn(),
}))

jest.mock('@/components/nav', () => ({ Nav: () => <nav data-testid="nav" /> }))
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}))

jest.mock('@/app/dashboard/dashboard-client', () => ({
  DashboardClient: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

import { createClient } from '@/lib/supabase/server'
import { getCachedDashboardData } from '@/lib/cache'
import DashboardPage from '@/app/dashboard/page'

const mockDashboardData = {
  entryCount: 3,
  summaryCount: 1,
  recentEntries: [
    { id: 'e1', content: 'Did a great job', check_in_type: 'weekly', created_at: '2026-05-01T00:00:00Z' },
  ],
  activeCycles: [],
  inProgressGoals: [],
  highPriorityGoals: [],
}

function mockAuthenticatedClient({ onboardingCompleted = true } = {}) {
  const single = jest.fn().mockResolvedValue({ data: { onboarding_completed: onboardingCompleted } })
  const eq = jest.fn().mockReturnValue({ single })
  const select = jest.fn().mockReturnValue({ eq })
  return {
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
    from: jest.fn().mockReturnValue({ select }),
  }
}

beforeEach(() => jest.clearAllMocks())

describe('DashboardPage', () => {
  it('redirects to login when unauthenticated', async () => {
    ;(createClient as jest.Mock).mockResolvedValue({
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: null } }) },
    })
    await expect(DashboardPage()).rejects.toThrow('Redirect:/auth/login')
  })

  it('renders dashboard with stats', async () => {
    ;(createClient as jest.Mock).mockResolvedValue(mockAuthenticatedClient())
    ;(getCachedDashboardData as jest.Mock).mockResolvedValue(mockDashboardData)

    let jsx: React.ReactNode
    await act(async () => { jsx = await DashboardPage() })
    render(jsx as React.ReactElement)

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('Did a great job')).toBeInTheDocument()
  })

  it('renders empty state when no check-ins', async () => {
    ;(createClient as jest.Mock).mockResolvedValue(mockAuthenticatedClient())
    ;(getCachedDashboardData as jest.Mock).mockResolvedValue({
      ...mockDashboardData,
      entryCount: 0,
      recentEntries: [],
    })

    let jsx: React.ReactNode
    await act(async () => { jsx = await DashboardPage() })
    render(jsx as React.ReactElement)
    expect(screen.getByText('No check-ins yet')).toBeInTheDocument()
  })

  it('renders active cycles section when cycles exist', async () => {
    ;(createClient as jest.Mock).mockResolvedValue(mockAuthenticatedClient())
    ;(getCachedDashboardData as jest.Mock).mockResolvedValue({
      ...mockDashboardData,
      activeCycles: [
        { id: 'c1', name: 'Q1 2026', start_date: '2026-01-01', end_date: '2026-03-31', status: 'active' },
      ],
    })

    let jsx: React.ReactNode
    await act(async () => { jsx = await DashboardPage() })
    render(jsx as React.ReactElement)
    expect(screen.getByText('Active Cycles')).toBeInTheDocument()
    expect(screen.getByText('Q1 2026')).toBeInTheDocument()
  })

  it('renders goals section when goals exist', async () => {
    ;(createClient as jest.Mock).mockResolvedValue(mockAuthenticatedClient())
    ;(getCachedDashboardData as jest.Mock).mockResolvedValue({
      ...mockDashboardData,
      inProgressGoals: [{ id: 'g1', title: 'Ship feature', status: 'in_progress' }],
      highPriorityGoals: [],
    })

    let jsx: React.ReactNode
    await act(async () => { jsx = await DashboardPage() })
    render(jsx as React.ReactElement)
    expect(screen.getByText('Goals')).toBeInTheDocument()
    expect(screen.getByText('Ship feature')).toBeInTheDocument()
  })

  it('renders generate summary CTA when entries exist and no active cycles', async () => {
    ;(createClient as jest.Mock).mockResolvedValue(mockAuthenticatedClient())
    ;(getCachedDashboardData as jest.Mock).mockResolvedValue({
      ...mockDashboardData,
      activeCycles: [],
    })

    let jsx: React.ReactNode
    await act(async () => { jsx = await DashboardPage() })
    render(jsx as React.ReactElement)
    expect(screen.getByText('Ready for your performance review?')).toBeInTheDocument()
  })
})
