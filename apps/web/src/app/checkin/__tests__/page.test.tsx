/* @jest-environment jsdom */
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import CheckInPage from '@/app/checkin/page'

const mockPush = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

jest.mock('@/components/nav', () => ({ Nav: () => <nav data-testid="nav" /> }))
jest.mock('@/components/skeleton', () => ({
  SkeletonText: ({ className }: { className: string }) => <div className={className} data-testid="skeleton-text" />,
}))

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn() },
}))

beforeEach(() => {
  jest.clearAllMocks()
  global.fetch = jest.fn() as jest.Mock
  window.confirm = jest.fn().mockReturnValue(true)
})

const mockPromptsResponse = {
  prompts: ['What did you accomplish?', 'What are you working on?', 'Any blockers?'],
}

describe('CheckInPage', () => {
  it('shows skeleton prompts while loading', () => {
    ;(global.fetch as jest.Mock).mockReturnValue(new Promise(() => {}))
    render(<CheckInPage />)
    expect(screen.getAllByTestId('skeleton-text').length).toBeGreaterThan(0)
  })

  it('renders prompts after loading', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockPromptsResponse,
    })
    await act(async () => { render(<CheckInPage />) })
    await waitFor(() => expect(screen.getByText('What did you accomplish?')).toBeInTheDocument())
    expect(screen.getByText('What are you working on?')).toBeInTheDocument()
  })

  it('uses fallback prompts when API fails', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, json: async () => ({ error: 'Server error' }) })
    await act(async () => { render(<CheckInPage />) })
    await waitFor(() => expect(screen.getByText('What did you accomplish since your last check-in?')).toBeInTheDocument())
  })

  it('uses fallback prompts when fetch throws', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))
    await act(async () => { render(<CheckInPage />) })
    await waitFor(() => expect(screen.getByText('What did you accomplish since your last check-in?')).toBeInTheDocument())
  })

  it('Save button is disabled when no responses', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => mockPromptsResponse })
    await act(async () => { render(<CheckInPage />) })
    await waitFor(() => screen.getByText('What did you accomplish?'))
    expect(screen.getByRole('button', { name: 'Save Check-in' })).toBeDisabled()
  })

  it('enables Save button after entering a response', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => mockPromptsResponse })
    await act(async () => { render(<CheckInPage />) })
    await waitFor(() => screen.getByText('What did you accomplish?'))
    fireEvent.change(screen.getAllByPlaceholderText('Write your response here...')[0], {
      target: { value: 'I finished the feature' },
    })
    expect(screen.getByRole('button', { name: 'Save Check-in' })).toBeEnabled()
  })

  it('saves check-in and navigates to dashboard', async () => {
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ profile: { default_check_in_type: 'weekly' } }) })
      .mockResolvedValueOnce({ ok: true, json: async () => mockPromptsResponse })
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) })

    await act(async () => { render(<CheckInPage />) })
    await waitFor(() => screen.getByText('What did you accomplish?'))
    fireEvent.change(screen.getAllByPlaceholderText('Write your response here...')[0], {
      target: { value: 'I shipped a feature' },
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Save Check-in' }))
    })
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/dashboard'))
  })

  it('switches check-in type without confirm when no responses', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => mockPromptsResponse })
    await act(async () => { render(<CheckInPage />) })
    await waitFor(() => screen.getByText('What did you accomplish?'))
    fireEvent.click(screen.getByRole('button', { name: 'daily' }))
    expect(window.confirm).not.toHaveBeenCalled()
  })

  it('asks confirm before switching type when responses exist', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => mockPromptsResponse })
    await act(async () => { render(<CheckInPage />) })
    await waitFor(() => screen.getByText('What did you accomplish?'))
    fireEvent.change(screen.getAllByPlaceholderText('Write your response here...')[0], {
      target: { value: 'Something' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'daily' }))
    expect(window.confirm).toHaveBeenCalled()
  })

  it('cancels switch when user declines confirm', async () => {
    ;(window.confirm as jest.Mock).mockReturnValue(false)
    ;(global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => mockPromptsResponse })
    await act(async () => { render(<CheckInPage />) })
    await waitFor(() => screen.getByText('What did you accomplish?'))
    fireEvent.change(screen.getAllByPlaceholderText('Write your response here...')[0], {
      target: { value: 'Something' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'daily' }))
    // still on weekly
    expect(screen.getByRole('button', { name: 'weekly' })).toHaveClass('bg-brand-600')
  })

  it('Refresh Prompts button reloads prompts', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => mockPromptsResponse })
    await act(async () => { render(<CheckInPage />) })
    await waitFor(() => screen.getByText('What did you accomplish?'))
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Refresh prompts' }))
    })
    expect(global.fetch).toHaveBeenCalledWith('/api/prompts', expect.any(Object))
  })
})
