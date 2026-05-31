/* @jest-environment jsdom */
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import SignupPage from '@/app/auth/signup/page'

const mockSignUp = jest.fn()

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    auth: {
      signUp: (...args: unknown[]) => mockSignUp(...args),
    },
  })),
}))

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}))

beforeEach(() => jest.clearAllMocks())

describe('SignupPage', () => {
  it('renders the signup form', () => {
    render(<SignupPage />)
    expect(screen.getByRole('heading', { name: 'Create account' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create account' })).toBeInTheDocument()
  })

  it('shows email confirmation state after successful signup', async () => {
    mockSignUp.mockResolvedValue({ error: null })
    render(<SignupPage />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'new@example.com' } })
    fireEvent.change(document.querySelector('input[type="password"]') as HTMLInputElement, {
      target: { value: 'password123' },
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Create account' }))
    })
    await waitFor(() => expect(screen.getByText('Check your email')).toBeInTheDocument())
    expect(screen.getByText(/new@example\.com/)).toBeInTheDocument()
  })

  it('shows error on signup failure', async () => {
    mockSignUp.mockResolvedValue({ error: { message: 'Email already in use' } })
    render(<SignupPage />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'taken@example.com' } })
    fireEvent.change(document.querySelector('input[type="password"]') as HTMLInputElement, {
      target: { value: 'password123' },
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Create account' }))
    })
    await waitFor(() => expect(screen.getByText('Email already in use')).toBeInTheDocument())
  })

  it('toggles password visibility', () => {
    render(<SignupPage />)
    expect(document.querySelector('input[type="password"]')).not.toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Show password' }))
    expect(document.querySelector('input[type="text"]')).not.toBeNull()
  })

  it('shows sign in link', () => {
    render(<SignupPage />)
    expect(screen.getByText('Sign in')).toBeInTheDocument()
  })
})
