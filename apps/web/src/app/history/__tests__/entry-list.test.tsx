/* @jest-environment jsdom */
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { EntryList } from '@/app/history/entry-list'

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn() },
}))

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}))

const makeEntry = (id: string) => ({
  id,
  content: `Content for entry ${id}`,
  check_in_type: 'weekly' as const,
  created_at: '2026-05-01T10:00:00Z',
})

beforeEach(() => {
  jest.clearAllMocks()
  global.fetch = jest.fn() as jest.Mock
  window.alert = jest.fn()
})

describe('EntryList', () => {
  it('renders all entries', () => {
    render(<EntryList entries={[makeEntry('1'), makeEntry('2')]} />)
    expect(screen.getByText('Content for entry 1')).toBeInTheDocument()
    expect(screen.getByText('Content for entry 2')).toBeInTheDocument()
  })

  it('shows delete confirmation dialog when Delete is clicked', () => {
    render(<EntryList entries={[makeEntry('a')]} />)
    fireEvent.click(screen.getByText('Delete'))
    expect(screen.getByText(/Delete this entry\? This cannot be undone\./)).toBeInTheDocument()
  })

  it('cancels delete confirmation', () => {
    render(<EntryList entries={[makeEntry('b')]} />)
    fireEvent.click(screen.getByText('Delete'))
    fireEvent.click(screen.getByText('Cancel'))
    expect(screen.queryByText(/Delete this entry\?/)).not.toBeInTheDocument()
  })

  it('removes entry from list after successful delete', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({ ok: true })
    render(<EntryList entries={[makeEntry('c'), makeEntry('d')]} />)
    const deleteButtons = screen.getAllByText('Delete')
    fireEvent.click(deleteButtons[0])
    await act(async () => {
      fireEvent.click(screen.getByText('Delete', { selector: '.bg-red-500' }))
    })
    await waitFor(() => expect(screen.queryByText('Content for entry c')).not.toBeInTheDocument())
    expect(screen.getByText('Content for entry d')).toBeInTheDocument()
  })

  it('shows alert and keeps entry when delete API fails', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({ ok: false })
    render(<EntryList entries={[makeEntry('e')]} />)
    fireEvent.click(screen.getByText('Delete'))
    await act(async () => {
      fireEvent.click(screen.getByText('Delete', { selector: '.bg-red-500' }))
    })
    await waitFor(() => expect(window.alert).toHaveBeenCalledWith('Failed to delete entry'))
    expect(screen.getByText('Content for entry e')).toBeInTheDocument()
  })

  it('shows alert when fetch throws', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))
    render(<EntryList entries={[makeEntry('f')]} />)
    fireEvent.click(screen.getByText('Delete'))
    await act(async () => {
      fireEvent.click(screen.getByText('Delete', { selector: '.bg-red-500' }))
    })
    await waitFor(() => expect(window.alert).toHaveBeenCalledWith('Error deleting entry'))
  })

  it('shows edit link for each entry', () => {
    render(<EntryList entries={[makeEntry('g')]} />)
    expect(screen.getByText('Edit').closest('a')).toHaveAttribute('href', '/history/g/edit')
  })
})
