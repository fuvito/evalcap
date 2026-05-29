/* @jest-environment jsdom */
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import LoginPage from '@/app/auth/login/page'

const mockPush = jest.fn()
const mockRefresh = jest.fn()
const mockSignInWithPassword = jest.fn()
const mockSignInWithOAuth = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}))

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    auth: {
      signInWithPassword: (...args: unknown[]) => mockSignInWithPassword(...args),
      signInWithOAuth: (...args: unknown[]) => mockSignInWithOAuth(...args),
    },
  })),
}))

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}))

beforeEach(() => jest.clearAllMocks())

describe('LoginPage', () => {
  it('renders the email/password form', () => {
    render(<LoginPage />)
    expect(screen.getByText('Welcome back')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument()
    expect(screen.getByText('Continue with Google')).toBeInTheDocument()
  })

  it('redirects to dashboard on successful sign in', async () => {
    mockSignInWithPassword.mockResolvedValue({ error: null })
    render(<LoginPage />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'user@example.com' } })
    fireEvent.change(document.querySelector('input[type="password"]') as HTMLInputElement, {
      target: { value: 'password123' },
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))
    })
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/dashboard'))
    expect(mockRefresh).toHaveBeenCalled()
  })

  it('shows error message on failed sign in', async () => {
    mockSignInWithPassword.mockResolvedValue({ error: { message: 'Invalid credentials' } })
    render(<LoginPage />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'user@example.com' } })
    fireEvent.change(document.querySelector('input[type="password"]') as HTMLInputElement, {
      target: { value: 'wrong' },
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))
    })
    await waitFor(() => expect(screen.getByText('Invalid credentials')).toBeInTheDocument())
  })

  it('toggles password visibility', () => {
    render(<LoginPage />)
    expect(document.querySelector('input[type="password"]')).not.toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Show password' }))
    expect(document.querySelector('input[type="text"]')).not.toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Hide password' }))
    expect(document.querySelector('input[type="password"]')).not.toBeNull()
  })

  it('calls signInWithOAuth for Google sign in', async () => {
    mockSignInWithOAuth.mockResolvedValue({ error: null })
    render(<LoginPage />)
    await act(async () => {
      fireEvent.click(screen.getByText('Continue with Google'))
    })
    expect(mockSignInWithOAuth).toHaveBeenCalledWith(expect.objectContaining({ provider: 'google' }))
  })

  it('shows error when Google sign in fails', async () => {
    mockSignInWithOAuth.mockResolvedValue({ error: { message: 'OAuth error' } })
    render(<LoginPage />)
    await act(async () => {
      fireEvent.click(screen.getByText('Continue with Google'))
    })
    await waitFor(() => expect(screen.getByText('OAuth error')).toBeInTheDocument())
  })

  it('shows Forgot password link', () => {
    render(<LoginPage />)
    expect(screen.getByText('Forgot password?')).toBeInTheDocument()
  })
})
