/* @jest-environment jsdom */
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import ProfilePage from '@/app/profile/page'

const mockPush = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({})),
}))

jest.mock('@/components/nav', () => ({ Nav: () => <nav data-testid="nav" /> }))
jest.mock('@/components/skeleton', () => ({
  SkeletonText: () => <div data-testid="skeleton-text" />,
  SkeletonCard: () => <div data-testid="skeleton-card" />,
}))

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn() },
}))

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}))

const mockProfile = {
  profile: {
    id: 'user-1',
    email: 'user@example.com',
    full_name: 'Jane Doe',
    job_title: 'Engineer',
    department: 'Engineering',
    manager_name: 'Bob',
    default_check_in_type: 'weekly',
    onboarding_completed: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  stats: { entryCount: 5, lastCheckIn: '2026-05-01T00:00:00Z' },
}

beforeEach(() => {
  jest.clearAllMocks()
  global.fetch = jest.fn() as jest.Mock
})

describe('ProfilePage', () => {
  it('shows loading skeleton initially', () => {
    ;(global.fetch as jest.Mock).mockReturnValue(new Promise(() => {}))
    render(<ProfilePage />)
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('renders profile data after loading', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockProfile,
    })
    await act(async () => { render(<ProfilePage />) })
    await waitFor(() => expect(screen.getByText('Profile')).toBeInTheDocument())
    expect(screen.getByDisplayValue('user@example.com')).toBeInTheDocument()
  })

  it('shows error state when profile fails to load', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Unauthorized' }),
    })
    await act(async () => { render(<ProfilePage />) })
    await waitFor(() => expect(screen.getByText(/Failed to load profile/)).toBeInTheDocument())
  })

  it('shows error when fetch throws', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))
    await act(async () => { render(<ProfilePage />) })
    await waitFor(() => expect(screen.getByText(/Error loading profile/)).toBeInTheDocument())
  })

  it('enters edit mode and shows Save/Cancel buttons', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockProfile,
    })
    await act(async () => { render(<ProfilePage />) })
    await waitFor(() => screen.getByText('Edit'))
    fireEvent.click(screen.getByText('Edit'))
    expect(screen.getByRole('button', { name: 'Save Changes' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
  })

  it('saves profile changes', async () => {
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => mockProfile })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ profile: { ...mockProfile.profile, full_name: 'Jane Updated' } }),
      })

    await act(async () => { render(<ProfilePage />) })
    await waitFor(() => screen.getByText('Edit'))
    fireEvent.click(screen.getByText('Edit'))

    const nameInput = screen.getByDisplayValue('Jane Doe')
    fireEvent.change(nameInput, { target: { value: 'Jane Updated' } })

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }))
    })
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Save Changes' })).not.toBeInTheDocument())
  })

  it('shows error when save fails', async () => {
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => mockProfile })
      .mockResolvedValueOnce({ ok: false, json: async () => ({ error: 'Save error' }) })

    await act(async () => { render(<ProfilePage />) })
    await waitFor(() => screen.getByText('Edit'))
    fireEvent.click(screen.getByText('Edit'))
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }))
    })
    await waitFor(() => expect(screen.getByText('Save error')).toBeInTheDocument())
  })

  it('Cancel resets form fields', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => mockProfile })
    await act(async () => { render(<ProfilePage />) })
    await waitFor(() => screen.getByText('Edit'))
    fireEvent.click(screen.getByText('Edit'))
    fireEvent.change(screen.getByDisplayValue('Jane Doe'), { target: { value: 'Changed Name' } })
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.getByDisplayValue('Jane Doe')).toBeInTheDocument()
  })

  it('shows first-time user guidance when entryCount is 0', async () => {
    const firstTimeData = { ...mockProfile, stats: { entryCount: 0, lastCheckIn: null } }
    ;(global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => firstTimeData })
    await act(async () => { render(<ProfilePage />) })
    await waitFor(() => expect(screen.getByText(/Welcome to EvalCap/)).toBeInTheDocument())
  })
})
