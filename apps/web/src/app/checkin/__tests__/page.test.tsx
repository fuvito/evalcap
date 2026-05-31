/* @jest-environment jsdom */
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import CheckInPage from '@/app/checkin/page'

const mockPush = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

jest.mock('@/components/nav', () => ({ Nav: () => <nav data-testid="nav" /> }))

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn() },
}))

beforeEach(() => {
  jest.clearAllMocks()
  global.fetch = jest.fn() as jest.Mock
  // Default: all fetches succeed with empty body (covers profile load)
  ;(global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({}) })
})

const mockPrompts = ['What did you accomplish?', 'What are you working on?', 'Any blockers?']

describe('CheckInPage', () => {
  it('renders the free-text textarea immediately with no loading state', () => {
    render(<CheckInPage />)
    expect(screen.getByPlaceholderText(/What did you accomplish\?/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Get AI prompts' })).toBeInTheDocument()
  })

  it('Save button is disabled when textarea is empty', () => {
    render(<CheckInPage />)
    expect(screen.getByRole('button', { name: 'Save Check-in' })).toBeDisabled()
  })

  it('enables Save button after typing in textarea', () => {
    render(<CheckInPage />)
    fireEvent.change(screen.getByPlaceholderText(/What did you accomplish\?/), {
      target: { value: 'I finished the feature' },
    })
    expect(screen.getByRole('button', { name: 'Save Check-in' })).toBeEnabled()
  })

  it('Get AI prompts button fetches and displays prompt suggestions', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ prompts: mockPrompts }),
    })
    render(<CheckInPage />)
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Get AI prompts' }))
    })
    await waitFor(() => expect(screen.getByText('What did you accomplish?')).toBeInTheDocument())
    expect(screen.getByText('What are you working on?')).toBeInTheDocument()
    expect(screen.getByText('Any blockers?')).toBeInTheDocument()
  })

  it('clicking a prompt appends it to the textarea and hides the prompt panel', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ prompts: mockPrompts }),
    })
    render(<CheckInPage />)
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Get AI prompts' }))
    })
    await waitFor(() => screen.getByText('What did you accomplish?'))
    fireEvent.click(screen.getByText('What did you accomplish?'))
    const textarea = screen.getByPlaceholderText(/What did you accomplish\?/) as HTMLTextAreaElement
    expect(textarea.value).toContain('What did you accomplish?')
    expect(screen.queryByText('What are you working on?')).not.toBeInTheDocument()
  })

  it('Dismiss button hides the prompt panel without modifying the textarea', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ prompts: mockPrompts }),
    })
    render(<CheckInPage />)
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Get AI prompts' }))
    })
    await waitFor(() => screen.getByText('What did you accomplish?'))
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }))
    expect(screen.queryByText('What did you accomplish?')).not.toBeInTheDocument()
    const textarea = screen.getByPlaceholderText(/What did you accomplish\?/) as HTMLTextAreaElement
    expect(textarea.value).toBe('')
  })

  it('saves check-in with raw content and navigates to dashboard', async () => {
    render(<CheckInPage />)
    fireEvent.change(screen.getByPlaceholderText(/What did you accomplish\?/), {
      target: { value: 'I shipped a feature' },
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Save Check-in' }))
    })
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/dashboard'))
    const saveCall = (global.fetch as jest.Mock).mock.calls.find(
      ([url]: [string]) => url === '/api/entries'
    )
    expect(saveCall).toBeDefined()
    const body = JSON.parse(saveCall[1].body)
    expect(body.content).toBe('I shipped a feature')
  })

  it('switching check-in type updates the active button', () => {
    render(<CheckInPage />)
    fireEvent.click(screen.getByRole('button', { name: 'daily' }))
    expect(screen.getByRole('button', { name: 'daily' })).toHaveClass('bg-brand-600')
    expect(screen.getByRole('button', { name: 'weekly' })).not.toHaveClass('bg-brand-600')
  })

  it('applies profile default check-in type on load', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ profile: { default_check_in_type: 'daily' } }),
    })
    await act(async () => { render(<CheckInPage />) })
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'daily' })).toHaveClass('bg-brand-600')
    )
  })

  it('does not show prompts panel when API returns no prompts', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ prompts: [] }),
    })
    render(<CheckInPage />)
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Get AI prompts' }))
    })
    expect(screen.queryByText('Prompts — click one to add it')).not.toBeInTheDocument()
  })
})
