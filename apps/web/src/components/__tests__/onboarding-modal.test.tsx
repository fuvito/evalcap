/* @jest-environment jsdom */
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { OnboardingModal } from '@/components/onboarding-modal'
import { logger } from '@/lib/logger'

const mockOnComplete = jest.fn()

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}))

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, onClick }: { href: string; children: React.ReactNode; onClick?: () => void }) =>
    <a href={href} onClick={onClick}>{children}</a>,
}))

beforeEach(() => {
  jest.clearAllMocks()
  global.fetch = jest.fn().mockResolvedValue({ ok: true }) as jest.Mock
})

describe('OnboardingModal', () => {
  it('renders nothing when isOpen is false', () => {
    render(<OnboardingModal isOpen={false} onComplete={mockOnComplete} />)
    expect(screen.queryByText('Welcome to EvalCap')).not.toBeInTheDocument()
  })

  it('renders step 1 when isOpen is true', () => {
    render(<OnboardingModal isOpen={true} onComplete={mockOnComplete} />)
    expect(screen.getByText('Welcome to EvalCap')).toBeInTheDocument()
    expect(screen.getByText('Get Started')).toBeInTheDocument()
    expect(screen.getByText('Skip for now')).toBeInTheDocument()
  })

  it('shows step indicators', () => {
    render(<OnboardingModal isOpen={true} onComplete={mockOnComplete} />)
    expect(screen.getByLabelText('Step 1 of 3')).toBeInTheDocument()
  })

  it('advances to step 2 (profile setup) when Get Started is clicked', () => {
    render(<OnboardingModal isOpen={true} onComplete={mockOnComplete} />)
    fireEvent.click(screen.getByText('Get Started'))
    expect(screen.getByText('Quick setup')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Alex Johnson/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Senior Software Engineer/i)).toBeInTheDocument()
  })

  it('advances to step 3 from step 2 and saves profile data', async () => {
    render(<OnboardingModal isOpen={true} onComplete={mockOnComplete} />)
    fireEvent.click(screen.getByText('Get Started'))

    fireEvent.change(screen.getByPlaceholderText(/Alex Johnson/i), { target: { value: 'Jane Doe' } })
    fireEvent.change(screen.getByPlaceholderText(/Senior Software Engineer/i), { target: { value: 'Staff Engineer' } })

    await act(async () => { fireEvent.click(screen.getByText('Continue')) })

    expect(fetch).toHaveBeenCalledWith('/api/profile', expect.objectContaining({
      method: 'PATCH',
      body: expect.stringContaining('Jane Doe'),
    }))
    expect(screen.getByText("You're all set")).toBeInTheDocument()
  })

  it('advances to step 3 from step 2 without saving when fields are empty', async () => {
    render(<OnboardingModal isOpen={true} onComplete={mockOnComplete} />)
    fireEvent.click(screen.getByText('Get Started'))

    await act(async () => { fireEvent.click(screen.getByText('Continue')) })

    expect(fetch).not.toHaveBeenCalled()
    expect(screen.getByText("You're all set")).toBeInTheDocument()
  })

  it('goes back from step 2 to step 1', () => {
    render(<OnboardingModal isOpen={true} onComplete={mockOnComplete} />)
    fireEvent.click(screen.getByText('Get Started'))
    fireEvent.click(screen.getByText('Back'))
    expect(screen.getByText('Welcome to EvalCap')).toBeInTheDocument()
  })

  it('goes back from step 3 to step 2', async () => {
    render(<OnboardingModal isOpen={true} onComplete={mockOnComplete} />)
    fireEvent.click(screen.getByText('Get Started'))
    await act(async () => { fireEvent.click(screen.getByText('Continue')) })
    fireEvent.click(screen.getByText('Back'))
    expect(screen.getByText('Quick setup')).toBeInTheDocument()
  })

  it('calls fetch with onboarding_completed and onComplete when skip is clicked', async () => {
    render(<OnboardingModal isOpen={true} onComplete={mockOnComplete} />)
    await act(async () => { fireEvent.click(screen.getByText('Skip for now')) })
    await waitFor(() => expect(mockOnComplete).toHaveBeenCalled())
    expect(fetch).toHaveBeenCalledWith('/api/profile', expect.objectContaining({
      method: 'PATCH',
      body: expect.stringContaining('onboarding_completed'),
    }))
  })

  it('calls fetch and onComplete when final CTA is clicked', async () => {
    render(<OnboardingModal isOpen={true} onComplete={mockOnComplete} />)
    fireEvent.click(screen.getByText('Get Started'))
    await act(async () => { fireEvent.click(screen.getByText('Continue')) })
    await act(async () => {
      fireEvent.click(screen.getByText(/Create Your First Check-in/i))
    })
    await waitFor(() => expect(mockOnComplete).toHaveBeenCalled())
    expect(fetch).toHaveBeenCalledWith('/api/profile', expect.objectContaining({
      body: expect.stringContaining('onboarding_completed'),
    }))
  })

  it('logs error when skip fetch fails but does not call onComplete', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error')) as jest.Mock
    render(<OnboardingModal isOpen={true} onComplete={mockOnComplete} />)
    await act(async () => { fireEvent.click(screen.getByText('Skip for now')) })
    await waitFor(() => expect(logger.error).toHaveBeenCalled())
    expect(mockOnComplete).not.toHaveBeenCalled()
  })
})
