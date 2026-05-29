/* @jest-environment jsdom */
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import ResetPasswordPage from '@/app/auth/reset-password/page'

const mockPush = jest.fn()
const mockUpdateUser = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    auth: { updateUser: (...args: unknown[]) => mockUpdateUser(...args) },
  })),
}))

function fillPasswords(password: string, confirm: string) {
  const inputs = document.querySelectorAll('input[type="password"], input[type="text"]')
  fireEvent.change(inputs[0] as HTMLInputElement, { target: { value: password } })
  fireEvent.change(inputs[1] as HTMLInputElement, { target: { value: confirm } })
}

beforeEach(() => jest.clearAllMocks())

describe('ResetPasswordPage', () => {
  it('renders the set new password form', () => {
    render(<ResetPasswordPage />)
    expect(screen.getByRole('heading', { name: 'Set new password' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Set new password' })).toBeInTheDocument()
  })

  it('validates minimum password length', async () => {
    render(<ResetPasswordPage />)
    fillPasswords('short', 'short')
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Set new password' }))
    })
    expect(screen.getByText('Password must be at least 8 characters.')).toBeInTheDocument()
    expect(mockUpdateUser).not.toHaveBeenCalled()
  })

  it('validates passwords match', async () => {
    render(<ResetPasswordPage />)
    fillPasswords('password123', 'different!')
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Set new password' }))
    })
    expect(screen.getByText('Passwords do not match.')).toBeInTheDocument()
    expect(mockUpdateUser).not.toHaveBeenCalled()
  })

  it('redirects to dashboard on success', async () => {
    mockUpdateUser.mockResolvedValue({ error: null })
    render(<ResetPasswordPage />)
    fillPasswords('validpass1', 'validpass1')
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Set new password' }))
    })
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/dashboard'))
  })

  it('shows API error on failure', async () => {
    mockUpdateUser.mockResolvedValue({ error: { message: 'Token expired' } })
    render(<ResetPasswordPage />)
    fillPasswords('validpass1', 'validpass1')
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Set new password' }))
    })
    await waitFor(() => expect(screen.getByText('Token expired')).toBeInTheDocument())
  })

  it('toggles password visibility for both fields', () => {
    render(<ResetPasswordPage />)
    const toggleBtns = screen.getAllByRole('button', { name: /show password/i })
    expect(toggleBtns).toHaveLength(2)
    fireEvent.click(toggleBtns[0])
    const inputs = document.querySelectorAll('input[type="text"]')
    expect(inputs.length).toBeGreaterThanOrEqual(1)
  })
})
