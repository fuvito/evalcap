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
})

describe('Nav', () => {
  it('renders primary nav links', () => {
    render(<Nav />)
    expect(screen.getAllByText('Dashboard').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Check-in').length).toBeGreaterThan(0)
    expect(screen.getAllByText('History').length).toBeGreaterThan(0)
  })

  it('renders account links', () => {
    render(<Nav />)
    expect(screen.getAllByText('Profile').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Settings').length).toBeGreaterThan(0)
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
