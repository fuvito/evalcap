/* @jest-environment jsdom */
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import CyclesPage from '@/app/cycles/page'

jest.mock('@/components/nav', () => ({ Nav: () => <nav data-testid="nav" /> }))
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}))

jest.mock('swr', () => ({
  __esModule: true,
  default: jest.fn(),
}))

jest.mock('@/lib/fetcher', () => ({ fetcher: jest.fn() }))

import useSWR from 'swr'

const mockMutate = jest.fn()

const makeCycle = (overrides = {}) => ({
  id: 'c1',
  user_id: 'u1',
  name: 'Q1 2026',
  start_date: '2026-01-01',
  end_date: '2026-03-31',
  status: 'active' as const,
  created_at: '2026-01-01T00:00:00Z',
  ...overrides,
})

beforeEach(() => {
  jest.clearAllMocks()
  global.fetch = jest.fn() as jest.Mock
  ;(useSWR as jest.Mock).mockReturnValue({ data: { cycles: [] }, mutate: mockMutate, isLoading: false })
})

describe('CyclesPage', () => {
  it('renders the Performance Cycles heading', () => {
    render(<CyclesPage />)
    expect(screen.getByText('Performance Cycles')).toBeInTheDocument()
  })

  it('shows empty state when no cycles', () => {
    render(<CyclesPage />)
    expect(screen.getByText(/No cycles yet/)).toBeInTheDocument()
  })

  it('shows loading skeleton', () => {
    ;(useSWR as jest.Mock).mockReturnValue({ data: undefined, mutate: mockMutate, isLoading: true })
    render(<CyclesPage />)
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('renders active cycles', () => {
    ;(useSWR as jest.Mock).mockReturnValue({
      data: { cycles: [makeCycle()] },
      mutate: mockMutate,
      isLoading: false,
    })
    render(<CyclesPage />)
    expect(screen.getByText('Q1 2026')).toBeInTheDocument()
  })

  it('opens create form when New cycle is clicked', () => {
    render(<CyclesPage />)
    fireEvent.click(screen.getByText('New cycle'))
    expect(screen.getByText('New cycle', { selector: 'h2' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create cycle' })).toBeInTheDocument()
  })

  it('applies a preset to the form', () => {
    render(<CyclesPage />)
    fireEvent.click(screen.getByText('New cycle'))
    fireEvent.click(screen.getByText('Q1'))
    expect((screen.getByPlaceholderText('e.g. Q2 2026') as HTMLInputElement).value).toContain('Q1')
  })

  it('cancels form creation', () => {
    render(<CyclesPage />)
    fireEvent.click(screen.getByText('New cycle'))
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByText('Create cycle')).not.toBeInTheDocument()
  })

  it('creates a new cycle', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({ cycle: makeCycle() }) })
    render(<CyclesPage />)
    fireEvent.click(screen.getByText('New cycle'))
    fireEvent.change(screen.getByPlaceholderText('e.g. Q2 2026'), { target: { value: 'Q1 2026' } })
    const dateInputs = document.querySelectorAll('input[type="date"]')
    fireEvent.change(dateInputs[0], { target: { value: '2026-01-01' } })
    fireEvent.change(dateInputs[1], { target: { value: '2026-03-31' } })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Create cycle' }))
    })
    await waitFor(() => expect(mockMutate).toHaveBeenCalled())
  })

  it('shows form error when create fails', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Duplicate cycle' }),
    })
    render(<CyclesPage />)
    fireEvent.click(screen.getByText('New cycle'))
    fireEvent.change(screen.getByPlaceholderText('e.g. Q2 2026'), { target: { value: 'Q1 2026' } })
    const dateInputs = document.querySelectorAll('input[type="date"]')
    fireEvent.change(dateInputs[0], { target: { value: '2026-01-01' } })
    fireEvent.change(dateInputs[1], { target: { value: '2026-03-31' } })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Create cycle' }))
    })
    await waitFor(() => expect(screen.getByText('Duplicate cycle')).toBeInTheDocument())
  })

  it('archives a cycle', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({}) })
    ;(useSWR as jest.Mock).mockReturnValue({
      data: { cycles: [makeCycle()] },
      mutate: mockMutate,
      isLoading: false,
    })
    render(<CyclesPage />)
    await act(async () => {
      fireEvent.click(screen.getByText('Archive'))
    })
    await waitFor(() => expect(mockMutate).toHaveBeenCalled())
  })

  it('shows and confirms delete', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({}) })
    ;(useSWR as jest.Mock).mockReturnValue({
      data: { cycles: [makeCycle()] },
      mutate: mockMutate,
      isLoading: false,
    })
    render(<CyclesPage />)
    fireEvent.click(screen.getByText('Delete'))
    expect(screen.getByText('Delete this cycle?')).toBeInTheDocument()
    // confirmation shows — click the red Delete button inside the confirmation
    await act(async () => {
      fireEvent.click(screen.getAllByText('Delete')[1])
    })
    await waitFor(() => expect(mockMutate).toHaveBeenCalled())
  })

  it('shows archived cycles toggle', () => {
    ;(useSWR as jest.Mock).mockReturnValue({
      data: { cycles: [makeCycle({ status: 'archived', id: 'c2', name: 'Old Cycle' })] },
      mutate: mockMutate,
      isLoading: false,
    })
    render(<CyclesPage />)
    expect(screen.getByText(/Archived \(1\)/)).toBeInTheDocument()
    fireEvent.click(screen.getByText(/Archived \(1\)/))
    expect(screen.getByText('Old Cycle')).toBeInTheDocument()
  })
})
