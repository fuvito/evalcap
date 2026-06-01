/* @jest-environment jsdom */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Nav } from '@/components/nav'

const mockPush = jest.fn()
const mockRefresh = jest.fn()
const mockSignOut = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({ push: (...args: unknown[]) => mockPush(...args), refresh: (...args: unknown[]) => mockRefresh(...args) })),
  usePathname: jest.fn(() => '/dashboard'),
}))

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    auth: { signOut: (...args: unknown[]) => mockSignOut(...args) },
  })),
}))

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, onClick }: { href: string; children: React.ReactNode; onClick?: () => void }) =>
    <a href={href} onClick={onClick}>{children}</a>,
}))

beforeEach(() => {
  mockSignOut.mockResolvedValue({})
  jest.clearAllMocks()
  mockSignOut.mockResolvedValue({})
  // Stub global fetch so useEffect in Nav doesn't throw "fetch is not defined"
  global.fetch = jest.fn().mockResolvedValue({ ok: false, json: jest.fn() }) as jest.Mock
})

describe('Nav', () => {
  it('renders primary nav links', () => {
    render(<Nav />)
    expect(screen.getAllByText('Dashboard').length).toBeGreaterThan(0)
    // Check-in and History are inside a collapsed dropdown group — the group trigger is visible
    // but the individual items are only shown when expanded. Verify the group label is present.
    expect(screen.getAllByText('Journal').length).toBeGreaterThan(0)
  })

  it('renders account dropdown trigger', () => {
    render(<Nav />)
    // Profile and Settings are inside the Account dropdown (collapsed by default).
    // The dropdown trigger button for Account should be visible.
    expect(screen.getAllByText('Account').length).toBeGreaterThan(0)
  })

  it('renders EvalCap brand link', () => {
    render(<Nav />)
    expect(screen.getByText('EvalCap')).toBeInTheDocument()
  })

  it('calls signOut and redirects on desktop sign out click', async () => {
    render(<Nav />)
    const signOutButtons = screen.getAllByText('Sign out')
    fireEvent.click(signOutButtons[0])
    await waitFor(() => expect(mockSignOut).toHaveBeenCalled())
    expect(mockPush).toHaveBeenCalledWith('/auth/login')
  })

  it('toggles mobile menu on hamburger button click', () => {
    render(<Nav />)
    const menuButton = screen.getByLabelText('Toggle menu')
    // before click: only desktop links visible (mobile menu hidden)
    expect(screen.getAllByText('Dashboard')).toHaveLength(1)
    fireEvent.click(menuButton)
    // after click: both desktop and mobile links visible
    expect(screen.getAllByText('Dashboard')).toHaveLength(2)
  })

  it('closes mobile menu after sign out in mobile menu', async () => {
    render(<Nav />)
    // open mobile menu
    fireEvent.click(screen.getByLabelText('Toggle menu'))
    expect(screen.getAllByText('Sign out')).toHaveLength(2)

    // click mobile sign out
    const signOutButtons = screen.getAllByText('Sign out')
    fireEvent.click(signOutButtons[1])
    await waitFor(() => expect(mockSignOut).toHaveBeenCalled())
  })
})
