/* @jest-environment jsdom */
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import GoalsPage from '@/app/goals/page'

jest.mock('@/components/nav', () => ({ Nav: () => <nav data-testid="nav" /> }))

jest.mock('swr', () => ({
  __esModule: true,
  default: jest.fn(),
}))

jest.mock('@/lib/fetcher', () => ({ fetcher: jest.fn() }))

import useSWR from 'swr'

const mockMutateEval = jest.fn()
const mockMutatePersonal = jest.fn()

const makeEvalGoal = (overrides = {}) => ({
  id: 'eg1',
  user_id: 'u1',
  title: 'Ship onboarding',
  description: null,
  status: 'in_progress' as const,
  cycle_id: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  ...overrides,
})

const makePersonalGoal = (overrides = {}) => ({
  id: 'pg1',
  user_id: 'u1',
  title: 'Learn Rust',
  description: null,
  category: 'skill' as const,
  priority: 'medium' as const,
  status: 'not_started' as const,
  due_date: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  ...overrides,
})

function setupSWR(evalGoals: unknown[] = [], personalGoals: unknown[] = [], cycles: unknown[] = []) {
  ;(useSWR as jest.Mock).mockImplementation((key: string) => {
    if (key === '/api/goals/evaluation') return { data: { goals: evalGoals }, mutate: mockMutateEval, isLoading: false }
    if (key === '/api/goals/personal') return { data: { goals: personalGoals }, mutate: mockMutatePersonal, isLoading: false }
    if (key === '/api/cycles') return { data: { cycles }, isLoading: false }
    return { data: undefined, isLoading: false }
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  global.fetch = jest.fn() as jest.Mock
})

describe('GoalsPage', () => {
  it('renders the Goals heading', () => {
    setupSWR()
    render(<GoalsPage />)
    expect(screen.getByText('Goals')).toBeInTheDocument()
  })

  it('shows Evaluation tab by default', () => {
    setupSWR()
    render(<GoalsPage />)
    expect(screen.getByText('Evaluation')).toBeInTheDocument()
    expect(screen.getByText('Personal')).toBeInTheDocument()
  })

  it('shows loading skeletons when loading', () => {
    ;(useSWR as jest.Mock)
      .mockReturnValueOnce({ data: undefined, mutate: mockMutateEval, isLoading: true })
      .mockReturnValueOnce({ data: undefined, mutate: mockMutatePersonal, isLoading: true })
      .mockReturnValueOnce({ data: undefined, isLoading: true })
    render(<GoalsPage />)
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('shows empty evaluation state', () => {
    setupSWR()
    render(<GoalsPage />)
    expect(screen.getByText(/No evaluation goals yet/)).toBeInTheDocument()
  })

  it('shows evaluation goals', () => {
    setupSWR([makeEvalGoal()] as any)
    render(<GoalsPage />)
    expect(screen.getByText('Ship onboarding')).toBeInTheDocument()
  })

  it('switches to Personal tab', () => {
    setupSWR([], [makePersonalGoal()] as any)
    render(<GoalsPage />)
    fireEvent.click(screen.getByText('Personal'))
    expect(screen.getByText('Learn Rust')).toBeInTheDocument()
  })

  it('opens and cancels evaluation goal form', () => {
    setupSWR()
    render(<GoalsPage />)
    fireEvent.click(screen.getByText('Add goal'))
    expect(screen.getByText('New evaluation goal')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByText('New evaluation goal')).not.toBeInTheDocument()
  })

  it('creates an evaluation goal', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({ goal: makeEvalGoal() }) })
    setupSWR()
    render(<GoalsPage />)
    fireEvent.click(screen.getByText('Add goal'))
    fireEvent.change(screen.getByPlaceholderText('e.g. Ship the new onboarding flow'), {
      target: { value: 'New Goal' },
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Add goal' }))
    })
    await waitFor(() => expect(mockMutateEval).toHaveBeenCalled())
  })

  it('shows form error when creation fails', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Validation failed' }),
    })
    setupSWR()
    render(<GoalsPage />)
    fireEvent.click(screen.getByText('Add goal'))
    fireEvent.change(screen.getByPlaceholderText('e.g. Ship the new onboarding flow'), {
      target: { value: 'New Goal' },
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Add goal' }))
    })
    await waitFor(() => expect(screen.getByText('Validation failed')).toBeInTheDocument())
  })

  it('shows delete confirmation for evaluation goal', () => {
    setupSWR([makeEvalGoal()] as any)
    render(<GoalsPage />)
    fireEvent.click(screen.getByText('Delete'))
    expect(screen.getByText('Delete this goal?')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByText('Delete this goal?')).not.toBeInTheDocument()
  })

  it('changes evaluation goal status', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({}) })
    setupSWR([makeEvalGoal()] as any)
    render(<GoalsPage />)
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'completed' } })
    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/goals/evaluation/'),
      expect.objectContaining({ method: 'PATCH' })
    ))
  })

  it('tab count badge reflects active goals', () => {
    setupSWR([makeEvalGoal(), makeEvalGoal({ id: 'eg2', title: 'Goal 2' })] as any)
    render(<GoalsPage />)
    expect(screen.getByText('2')).toBeInTheDocument()
  })
})
