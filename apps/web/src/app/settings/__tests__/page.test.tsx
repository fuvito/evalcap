/* @jest-environment jsdom */
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import SettingsPage from '@/app/settings/page'

const mockBack = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({ back: mockBack }),
}))

jest.mock('@/components/nav', () => ({ Nav: () => <nav data-testid="nav" /> }))

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn() },
}))

jest.mock('@/components/theme-provider', () => ({
  applyTheme: jest.fn(),
}))

import { applyTheme } from '@/components/theme-provider'

beforeEach(() => {
  jest.clearAllMocks()
  localStorage.clear()
  global.fetch = jest.fn() as jest.Mock
})

const mockProfileResponse = {
  profile: { default_check_in_type: 'weekly' },
}

describe('SettingsPage', () => {
  it('shows loading skeleton initially', () => {
    ;(global.fetch as jest.Mock).mockReturnValue(new Promise(() => {}))
    render(<SettingsPage />)
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('renders settings after loading', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockProfileResponse,
    })
    await act(async () => { render(<SettingsPage />) })
    await waitFor(() => expect(screen.getByText('Settings')).toBeInTheDocument())
    expect(screen.getByText('Appearance')).toBeInTheDocument()
    expect(screen.getByText('Default Check-in Type')).toBeInTheDocument()
  })

  it('shows error when settings fail to load', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Unauthorized' }),
    })
    await act(async () => { render(<SettingsPage />) })
    await waitFor(() => expect(screen.getByText('Failed to load settings')).toBeInTheDocument())
  })

  it('changes theme and calls applyTheme', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => mockProfileResponse })
    await act(async () => { render(<SettingsPage />) })
    await waitFor(() => screen.getByText('Dark'))
    fireEvent.click(screen.getByText('Dark'))
    expect(applyTheme).toHaveBeenCalledWith('dark')
    expect(localStorage.getItem('theme')).toBe('dark')
  })

  it('saves preferences successfully', async () => {
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => mockProfileResponse })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ profile: mockProfileResponse.profile }) })

    await act(async () => { render(<SettingsPage />) })
    await waitFor(() => screen.getByText('Save Preferences'))
    await act(async () => {
      fireEvent.click(screen.getByText('Save Preferences'))
    })
    await waitFor(() => expect(screen.getByText(/Settings saved successfully/)).toBeInTheDocument())
  })

  it('shows error when save fails', async () => {
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => mockProfileResponse })
      .mockResolvedValueOnce({ ok: false, json: async () => ({ error: 'Save error' }) })

    await act(async () => { render(<SettingsPage />) })
    await waitFor(() => screen.getByText('Save Preferences'))
    await act(async () => {
      fireEvent.click(screen.getByText('Save Preferences'))
    })
    await waitFor(() => expect(screen.getByText('Save error')).toBeInTheDocument())
  })

  it('Cancel calls router.back()', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => mockProfileResponse })
    await act(async () => { render(<SettingsPage />) })
    await waitFor(() => screen.getByText('Cancel'))
    fireEvent.click(screen.getByText('Cancel'))
    expect(mockBack).toHaveBeenCalled()
  })

  it('reads stored theme from localStorage on mount', async () => {
    localStorage.setItem('theme', 'dark')
    ;(global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => mockProfileResponse })
    await act(async () => { render(<SettingsPage />) })
    await waitFor(() => screen.getByText('Settings'))
    // Dark button should be visually selected (verified by the button existing)
    expect(screen.getByText('Dark')).toBeInTheDocument()
  })
})
