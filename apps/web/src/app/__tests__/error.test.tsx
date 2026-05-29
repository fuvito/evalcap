/* @jest-environment jsdom */
import { render, screen, fireEvent, act } from '@testing-library/react'
import ErrorPage from '@/app/error'

const mockLoggerError = jest.fn()

jest.mock('@/lib/logger', () => ({
  logger: {
    error: (...args: unknown[]) => mockLoggerError(...args),
  },
}))

afterEach(() => jest.clearAllMocks())

describe('Error boundary page', () => {
  const testError = new Error('Something broke')
  const mockReset = jest.fn()

  it('renders the error message', async () => {
    await act(async () => { render(<ErrorPage error={testError} reset={mockReset} />) })
    expect(screen.getByText('Something broke')).toBeInTheDocument()
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })

  it('calls reset when Try again is clicked', async () => {
    await act(async () => { render(<ErrorPage error={testError} reset={mockReset} />) })
    fireEvent.click(screen.getByText('Try again'))
    expect(mockReset).toHaveBeenCalled()
  })

  it('calls logger.error on mount', async () => {
    await act(async () => { render(<ErrorPage error={testError} reset={mockReset} />) })
    expect(mockLoggerError).toHaveBeenCalledWith(
      'React error boundary caught error',
      testError,
      'error-boundary'
    )
  })

  it('shows fallback message when error has no message', async () => {
    const emptyError = new Error('')
    await act(async () => { render(<ErrorPage error={emptyError} reset={mockReset} />) })
    expect(screen.getByText(/unexpected error occurred/i)).toBeInTheDocument()
  })

  it('renders a Go home link', async () => {
    await act(async () => { render(<ErrorPage error={testError} reset={mockReset} />) })
    expect(screen.getByText('Go home')).toBeInTheDocument()
  })
})

describe('Error boundary — development digest', () => {
  const originalNodeEnv = process.env.NODE_ENV

  beforeEach(() => {
    (process.env as Record<string, string>).NODE_ENV = 'development'
  })

  afterEach(() => {
    (process.env as Record<string, string>).NODE_ENV = originalNodeEnv
    jest.clearAllMocks()
  })

  it('shows error digest in development mode when provided', async () => {
    const errWithDigest = Object.assign(new Error('Oops'), { digest: 'digest-abc123' })
    const reset = jest.fn()
    await act(async () => { render(<ErrorPage error={errWithDigest} reset={reset} />) })
    expect(screen.getByText(/digest-abc123/)).toBeInTheDocument()
  })
})
