/* @jest-environment jsdom */
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { SummaryDetail } from '@/app/summaries/[id]/summary-detail'
import type { Summary } from '@/types/database'

const mockPush = jest.fn()
const mockRefresh = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}))

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn() },
}))

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}))

const makeSummary = (overrides: Partial<Summary> = {}): Summary => ({
  id: 'sum-1',
  user_id: 'user-1',
  content: 'My performance summary content',
  timeframe_start: '2026-01-01',
  timeframe_end: '2026-03-31',
  created_at: '2026-04-01T10:00:00Z',
  user_instructions: null,
  ...overrides,
})

beforeEach(() => {
  jest.clearAllMocks()
  global.fetch = jest.fn() as jest.Mock
  Object.assign(navigator, { clipboard: { writeText: jest.fn().mockResolvedValue(undefined) } })
})

describe('SummaryDetail', () => {
  it('renders the summary content', () => {
    render(<SummaryDetail summary={makeSummary()} />)
    expect(screen.getByDisplayValue('My performance summary content')).toBeInTheDocument()
  })

  it('renders date range in heading', () => {
    render(<SummaryDetail summary={makeSummary()} />)
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1 }).textContent).toMatch(/2026/)
  })

  it('shows user instructions when present', () => {
    render(<SummaryDetail summary={makeSummary({ user_instructions: 'Focus on Q1 launch' })} />)
    expect(screen.getByText('Focus on Q1 launch')).toBeInTheDocument()
    expect(screen.getByText('Instructions used')).toBeInTheDocument()
  })

  it('does not show instructions block when null', () => {
    render(<SummaryDetail summary={makeSummary({ user_instructions: null })} />)
    expect(screen.queryByText('Instructions used')).not.toBeInTheDocument()
  })

  it('enables Save Changes button only when content is changed', () => {
    render(<SummaryDetail summary={makeSummary()} />)
    expect(screen.getByRole('button', { name: 'Save Changes' })).toBeDisabled()
    fireEvent.change(screen.getByDisplayValue('My performance summary content'), {
      target: { value: 'Updated content' },
    })
    expect(screen.getByRole('button', { name: 'Save Changes' })).toBeEnabled()
  })

  it('saves changes and shows success', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({ ok: true })
    render(<SummaryDetail summary={makeSummary()} />)
    fireEvent.change(screen.getByDisplayValue('My performance summary content'), {
      target: { value: 'Updated content' },
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }))
    })
    await waitFor(() => expect(screen.getByText('Saved')).toBeInTheDocument())
  })

  it('shows error when save fails', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Save failed' }),
    })
    render(<SummaryDetail summary={makeSummary()} />)
    fireEvent.change(screen.getByDisplayValue('My performance summary content'), {
      target: { value: 'Changed' },
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }))
    })
    await waitFor(() => expect(screen.getByText('Save failed')).toBeInTheDocument())
  })

  it('shows delete confirmation and cancels', () => {
    render(<SummaryDetail summary={makeSummary()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    expect(screen.getByText('Delete this summary? This cannot be undone.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByText('Delete this summary? This cannot be undone.')).not.toBeInTheDocument()
  })

  it('deletes and navigates to /summaries', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({ ok: true })
    render(<SummaryDetail summary={makeSummary()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    // confirmation dialog now shows — click the confirm Delete button (second Delete)
    await act(async () => {
      fireEvent.click(screen.getAllByRole('button', { name: 'Delete' })[1])
    })
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/summaries'))
  })

  it('shows error when delete fails', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Delete failed' }),
    })
    render(<SummaryDetail summary={makeSummary()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    await act(async () => {
      fireEvent.click(screen.getAllByRole('button', { name: 'Delete' })[1])
    })
    await waitFor(() => expect(screen.getByText('Delete failed')).toBeInTheDocument())
  })

  it('copies content to clipboard', async () => {
    render(<SummaryDetail summary={makeSummary()} />)
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Copy' }))
    })
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('My performance summary content')
  })
})
