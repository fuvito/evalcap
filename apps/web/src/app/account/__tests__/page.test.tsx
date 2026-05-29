/* @jest-environment jsdom */
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import AccountPage from '@/app/account/page'

const mockPush = jest.fn()
const mockGetUser = jest.fn()
const mockUpdateUser = jest.fn()
const mockSignOut = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: () => mockGetUser(),
      updateUser: (...args: unknown[]) => mockUpdateUser(...args),
      signOut: () => mockSignOut(),
    },
  })),
}))

jest.mock('@/components/nav', () => ({ Nav: () => <nav data-testid="nav" /> }))

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn() },
}))

const mockUser = { id: 'u1', email: 'user@example.com' }

beforeEach(() => {
  jest.clearAllMocks()
  global.fetch = jest.fn() as jest.Mock
  mockGetUser.mockResolvedValue({ data: { user: mockUser } })
  HTMLAnchorElement.prototype.click = jest.fn()
})

describe('AccountPage', () => {
  it('shows loading state initially', () => {
    mockGetUser.mockReturnValue(new Promise(() => {}))
    render(<AccountPage />)
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('redirects to login when unauthenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    await act(async () => { render(<AccountPage />) })
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/auth/login'))
  })

  it('renders account page with email', async () => {
    await act(async () => { render(<AccountPage />) })
    await waitFor(() => expect(screen.getByText('Account')).toBeInTheDocument())
    expect(screen.getByText('user@example.com')).toBeInTheDocument()
  })

  it('toggles email change form', async () => {
    await act(async () => { render(<AccountPage />) })
    await waitFor(() => screen.getByText('Account'))
    const changeButtons = screen.getAllByText('Change')
    fireEvent.click(changeButtons[0])
    expect(screen.getByPlaceholderText('New email address')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Cancel'))
    expect(screen.queryByPlaceholderText('New email address')).not.toBeInTheDocument()
  })

  it('updates email successfully', async () => {
    mockUpdateUser.mockResolvedValue({ error: null })
    await act(async () => { render(<AccountPage />) })
    await waitFor(() => screen.getByText('Account'))
    fireEvent.click(screen.getAllByText('Change')[0])
    fireEvent.change(screen.getByPlaceholderText('New email address'), {
      target: { value: 'new@example.com' },
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Update email' }))
    })
    await waitFor(() => expect(screen.getByText(/Confirmation sent/)).toBeInTheDocument())
  })

  it('shows error when email update fails', async () => {
    mockUpdateUser.mockResolvedValue({ error: { message: 'Email already in use' } })
    await act(async () => { render(<AccountPage />) })
    await waitFor(() => screen.getByText('Account'))
    fireEvent.click(screen.getAllByText('Change')[0])
    fireEvent.change(screen.getByPlaceholderText('New email address'), {
      target: { value: 'taken@example.com' },
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Update email' }))
    })
    await waitFor(() => expect(screen.getByText('Email already in use')).toBeInTheDocument())
  })

  it('toggles password change form', async () => {
    await act(async () => { render(<AccountPage />) })
    await waitFor(() => screen.getByText('Account'))
    fireEvent.click(screen.getAllByText('Change')[1])
    expect(screen.getByPlaceholderText('New password (min 8 characters)')).toBeInTheDocument()
    fireEvent.click(screen.getAllByText('Cancel')[0])
    expect(screen.queryByPlaceholderText('New password (min 8 characters)')).not.toBeInTheDocument()
  })

  it('validates password minimum length', async () => {
    await act(async () => { render(<AccountPage />) })
    await waitFor(() => screen.getByText('Account'))
    fireEvent.click(screen.getAllByText('Change')[1])
    const pwInputs = document.querySelectorAll('input[type="password"]')
    fireEvent.change(pwInputs[0], { target: { value: 'short' } })
    fireEvent.change(pwInputs[1], { target: { value: 'short' } })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Update password' }))
    })
    expect(screen.getByText('Password must be at least 8 characters.')).toBeInTheDocument()
  })

  it('validates password match', async () => {
    await act(async () => { render(<AccountPage />) })
    await waitFor(() => screen.getByText('Account'))
    fireEvent.click(screen.getAllByText('Change')[1])
    const pwInputs = document.querySelectorAll('input[type="password"]')
    fireEvent.change(pwInputs[0], { target: { value: 'password123' } })
    fireEvent.change(pwInputs[1], { target: { value: 'different!!' } })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Update password' }))
    })
    expect(screen.getByText('Passwords do not match.')).toBeInTheDocument()
  })

  it('updates password successfully', async () => {
    mockUpdateUser.mockResolvedValue({ error: null })
    await act(async () => { render(<AccountPage />) })
    await waitFor(() => screen.getByText('Account'))
    fireEvent.click(screen.getAllByText('Change')[1])
    const pwInputs = document.querySelectorAll('input[type="password"]')
    fireEvent.change(pwInputs[0], { target: { value: 'newpassword1' } })
    fireEvent.change(pwInputs[1], { target: { value: 'newpassword1' } })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Update password' }))
    })
    await waitFor(() => expect(screen.getByText('Password updated successfully.')).toBeInTheDocument())
  })

  it('shows error when password update fails', async () => {
    mockUpdateUser.mockResolvedValue({ error: { message: 'Weak password' } })
    await act(async () => { render(<AccountPage />) })
    await waitFor(() => screen.getByText('Account'))
    fireEvent.click(screen.getAllByText('Change')[1])
    const pwInputs = document.querySelectorAll('input[type="password"]')
    fireEvent.change(pwInputs[0], { target: { value: 'newpassword1' } })
    fireEvent.change(pwInputs[1], { target: { value: 'newpassword1' } })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Update password' }))
    })
    await waitFor(() => expect(screen.getByText('Weak password')).toBeInTheDocument())
  })

  it('exports data on button click', async () => {
    const mockBlob = new Blob(['{"data":true}'], { type: 'application/json' })
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      blob: async () => mockBlob,
      headers: { get: () => 'attachment; filename="evalcap-export.json"' },
    })
    const mockCreateObjectURL = jest.fn().mockReturnValue('blob:mock')
    const mockRevokeObjectURL = jest.fn()
    URL.createObjectURL = mockCreateObjectURL
    URL.revokeObjectURL = mockRevokeObjectURL

    await act(async () => { render(<AccountPage />) })
    await waitFor(() => screen.getByText('Export'))
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Export' }))
    })
    await waitFor(() => expect(mockCreateObjectURL).toHaveBeenCalled())
  })

  it('handles failed export gracefully', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({ ok: false })
    await act(async () => { render(<AccountPage />) })
    await waitFor(() => screen.getByText('Export'))
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Export' }))
    })
    await waitFor(() => expect(screen.getByRole('button', { name: 'Export' })).toBeInTheDocument())
  })

  it('shows delete confirmation dialog', async () => {
    await act(async () => { render(<AccountPage />) })
    await waitFor(() => screen.getByText('Delete account'))
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    expect(screen.getByPlaceholderText('Type DELETE to confirm')).toBeInTheDocument()
  })

  it('Delete my account button is disabled until DELETE is typed', async () => {
    await act(async () => { render(<AccountPage />) })
    await waitFor(() => screen.getByText('Delete account'))
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    expect(screen.getByRole('button', { name: 'Delete my account' })).toBeDisabled()
    fireEvent.change(screen.getByPlaceholderText('Type DELETE to confirm'), {
      target: { value: 'DELETE' },
    })
    expect(screen.getByRole('button', { name: 'Delete my account' })).toBeEnabled()
  })

  it('cancels delete confirmation', async () => {
    await act(async () => { render(<AccountPage />) })
    await waitFor(() => screen.getByText('Delete account'))
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByText(/Type DELETE to confirm/)).not.toBeInTheDocument()
  })

  it('deletes account and redirects to login', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({ ok: true })
    mockSignOut.mockResolvedValue({})
    await act(async () => { render(<AccountPage />) })
    await waitFor(() => screen.getByText('Delete account'))
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    fireEvent.change(screen.getByPlaceholderText('Type DELETE to confirm'), {
      target: { value: 'DELETE' },
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Delete my account' }))
    })
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/auth/login'))
  })

  it('shows error when delete account fails', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Delete failed' }),
    })
    await act(async () => { render(<AccountPage />) })
    await waitFor(() => screen.getByText('Delete account'))
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    fireEvent.change(screen.getByPlaceholderText('Type DELETE to confirm'), {
      target: { value: 'DELETE' },
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Delete my account' }))
    })
    await waitFor(() => expect(screen.getByText('Delete failed')).toBeInTheDocument())
  })

  it('shows error when delete fetch throws', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))
    await act(async () => { render(<AccountPage />) })
    await waitFor(() => screen.getByText('Delete account'))
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    fireEvent.change(screen.getByPlaceholderText('Type DELETE to confirm'), {
      target: { value: 'DELETE' },
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Delete my account' }))
    })
    await waitFor(() => expect(screen.getByText('Something went wrong. Please try again.')).toBeInTheDocument())
  })
})
