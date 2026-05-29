/* @jest-environment jsdom */
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import ForgotPasswordPage from '@/app/auth/forgot-password/page'

const mockResetPasswordForEmail = jest.fn()

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    auth: { resetPasswordForEmail: (...args: unknown[]) => mockResetPasswordForEmail(...args) },
  })),
}))

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}))

beforeEach(() => jest.clearAllMocks())

describe('ForgotPasswordPage', () => {
  it('renders the reset form', () => {
    render(<ForgotPasswordPage />)
    expect(screen.getByText('Reset your password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Send reset link' })).toBeInTheDocument()
  })

  it('shows success state after email is sent', async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: null })
    render(<ForgotPasswordPage />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'user@example.com' } })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Send reset link' }))
    })
    await waitFor(() => expect(screen.getByText(/Check your inbox/)).toBeInTheDocument())
    expect(mockResetPasswordForEmail).toHaveBeenCalledWith('user@example.com', expect.any(Object))
  })

  it('shows error when API returns error', async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: { message: 'User not found' } })
    render(<ForgotPasswordPage />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'noone@example.com' } })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Send reset link' }))
    })
    await waitFor(() => expect(screen.getByText('User not found')).toBeInTheDocument())
  })

  it('"Try a different email" resets back to the form', async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: null })
    render(<ForgotPasswordPage />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'user@example.com' } })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Send reset link' }))
    })
    await waitFor(() => expect(screen.getByText('Try a different email')).toBeInTheDocument())
    fireEvent.click(screen.getByText('Try a different email'))
    expect(screen.getByRole('button', { name: 'Send reset link' })).toBeInTheDocument()
  })

  it('shows "Back to sign in" link', () => {
    render(<ForgotPasswordPage />)
    expect(screen.getByText('← Back to sign in')).toBeInTheDocument()
  })
})
