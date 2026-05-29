/* @jest-environment jsdom */
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import SummaryPage from '@/app/summary/page'

jest.mock('next/navigation', () => ({
  useSearchParams: () => ({ get: () => null }),
}))

jest.mock('@/components/nav', () => ({ Nav: () => <nav data-testid="nav" /> }))
jest.mock('@/components/skeleton', () => ({
  SkeletonText: ({ className }: { className: string }) => <div className={className} data-testid="skeleton-text" />,
}))

jest.mock('swr', () => ({
  __esModule: true,
  default: jest.fn(),
}))

jest.mock('@/lib/fetcher', () => ({ fetcher: jest.fn() }))

import useSWR from 'swr'

beforeEach(() => {
  jest.clearAllMocks()
  global.fetch = jest.fn() as jest.Mock
  ;(useSWR as jest.Mock).mockReturnValue({ data: { cycles: [] }, isLoading: false })
  Object.assign(navigator, { clipboard: { writeText: jest.fn().mockResolvedValue(undefined) } })
})

describe('SummaryPage', () => {
  it('renders the generate summary form', () => {
    render(<SummaryPage />)
    expect(screen.getByRole('heading', { name: 'Generate Summary' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Generate Summary' })).toBeInTheDocument()
  })

  it('Generate button is disabled without date range', () => {
    render(<SummaryPage />)
    expect(screen.getByRole('button', { name: 'Generate Summary' })).toBeDisabled()
  })

  it('enables Generate button when both dates set', () => {
    render(<SummaryPage />)
    const dateInputs = document.querySelectorAll('input[type="date"]')
    fireEvent.change(dateInputs[0], { target: { value: '2026-01-01' } })
    fireEvent.change(dateInputs[1], { target: { value: '2026-03-31' } })
    expect(screen.getByRole('button', { name: 'Generate Summary' })).toBeEnabled()
  })

  it('shows summary after successful generation', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ summary: 'Great quarter! Shipped features.' }),
    })
    render(<SummaryPage />)
    const dateInputs = document.querySelectorAll('input[type="date"]')
    fireEvent.change(dateInputs[0], { target: { value: '2026-01-01' } })
    fireEvent.change(dateInputs[1], { target: { value: '2026-03-31' } })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Generate Summary' }))
    })
    await waitFor(() => expect(screen.getByText('Your Summary')).toBeInTheDocument())
    expect(screen.getByDisplayValue('Great quarter! Shipped features.')).toBeInTheDocument()
  })

  it('shows error when generation fails', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Not enough entries' }),
    })
    render(<SummaryPage />)
    const dateInputs = document.querySelectorAll('input[type="date"]')
    fireEvent.change(dateInputs[0], { target: { value: '2026-01-01' } })
    fireEvent.change(dateInputs[1], { target: { value: '2026-03-31' } })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Generate Summary' }))
    })
    await waitFor(() => expect(screen.getByText('Not enough entries')).toBeInTheDocument())
  })

  it('shows error when fetch throws', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))
    render(<SummaryPage />)
    const dateInputs = document.querySelectorAll('input[type="date"]')
    fireEvent.change(dateInputs[0], { target: { value: '2026-01-01' } })
    fireEvent.change(dateInputs[1], { target: { value: '2026-03-31' } })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Generate Summary' }))
    })
    await waitFor(() => expect(screen.getByText('Something went wrong. Please try again.')).toBeInTheDocument())
  })

  it('saves summary after generation', async () => {
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ summary: 'My summary' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'saved-1' }) })

    render(<SummaryPage />)
    const dateInputs = document.querySelectorAll('input[type="date"]')
    fireEvent.change(dateInputs[0], { target: { value: '2026-01-01' } })
    fireEvent.change(dateInputs[1], { target: { value: '2026-03-31' } })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Generate Summary' }))
    })
    await waitFor(() => screen.getByText('Save Summary'))
    await act(async () => {
      fireEvent.click(screen.getByText('Save Summary'))
    })
    await waitFor(() => expect(screen.getAllByText('Saved').length).toBeGreaterThan(0))
  })

  it('shows cycle dropdown when active cycles exist', () => {
    ;(useSWR as jest.Mock).mockReturnValue({
      data: { cycles: [{ id: 'c1', name: 'Q1 2026', status: 'active', start_date: '2026-01-01', end_date: '2026-03-31' }] },
      isLoading: false,
    })
    render(<SummaryPage />)
    expect(screen.getByText('Fill from cycle (optional)')).toBeInTheDocument()
    expect(screen.getByText('Q1 2026')).toBeInTheDocument()
  })
})
