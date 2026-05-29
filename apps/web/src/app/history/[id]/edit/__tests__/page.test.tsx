/* @jest-environment jsdom */
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import EditEntryPage from '@/app/history/[id]/edit/page'

const mockPush = jest.fn()
const mockParams = { id: 'entry-123' }

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useParams: () => mockParams,
}))

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({})),
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
})

describe('EditEntryPage', () => {
  it('shows skeleton while loading', () => {
    ;(global.fetch as jest.Mock).mockReturnValue(new Promise(() => {}))
    render(<EditEntryPage />)
    expect(screen.getAllByTestId('skeleton-text').length).toBeGreaterThan(0)
  })

  it('renders entry form after loading', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        entry: {
          id: 'entry-123',
          content: 'My check-in content',
          check_in_type: 'weekly',
          created_at: '2026-05-01T10:00:00Z',
        },
      }),
    })
    await act(async () => { render(<EditEntryPage />) })
    await waitFor(() => expect(screen.getByText('Edit Entry')).toBeInTheDocument())
    expect(screen.getByDisplayValue('My check-in content')).toBeInTheDocument()
  })

  it('shows error state when entry fails to load', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Not found' }),
    })
    await act(async () => { render(<EditEntryPage />) })
    await waitFor(() => expect(screen.getByText(/Failed to load entry/)).toBeInTheDocument())
  })

  it('shows error when fetch throws', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))
    await act(async () => { render(<EditEntryPage />) })
    await waitFor(() => expect(screen.getByText(/Error loading entry/)).toBeInTheDocument())
  })

  it('saves changes and navigates to history', async () => {
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          entry: { id: 'entry-123', content: 'Original', check_in_type: 'weekly', created_at: '2026-05-01T10:00:00Z' },
        }),
      })
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) })

    await act(async () => { render(<EditEntryPage />) })
    await waitFor(() => screen.getByDisplayValue('Original'))
    fireEvent.change(screen.getByDisplayValue('Original'), { target: { value: 'Updated content' } })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }))
    })
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/history'))
  })

  it('shows error when save fails', async () => {
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          entry: { id: 'entry-123', content: 'Original', check_in_type: 'weekly', created_at: '2026-05-01T10:00:00Z' },
        }),
      })
      .mockResolvedValueOnce({ ok: false, json: async () => ({ error: 'Save failed' }) })

    await act(async () => { render(<EditEntryPage />) })
    await waitFor(() => screen.getByDisplayValue('Original'))
    fireEvent.change(screen.getByDisplayValue('Original'), { target: { value: 'Updated' } })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }))
    })
    await waitFor(() => expect(screen.getByText('Save failed')).toBeInTheDocument())
  })

  it('Save button is disabled when content is empty', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        entry: { id: 'entry-123', content: 'Original', check_in_type: 'weekly', created_at: '2026-05-01T10:00:00Z' },
      }),
    })
    await act(async () => { render(<EditEntryPage />) })
    await waitFor(() => screen.getByDisplayValue('Original'))
    fireEvent.change(screen.getByDisplayValue('Original'), { target: { value: '' } })
    expect(screen.getByRole('button', { name: 'Save Changes' })).toBeDisabled()
  })

  it('Cancel navigates back to history', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        entry: { id: 'entry-123', content: 'Content', check_in_type: 'weekly', created_at: '2026-05-01T10:00:00Z' },
      }),
    })
    await act(async () => { render(<EditEntryPage />) })
    await waitFor(() => screen.getByText('Cancel'))
    fireEvent.click(screen.getByText('Cancel'))
    expect(mockPush).toHaveBeenCalledWith('/history')
  })
})
