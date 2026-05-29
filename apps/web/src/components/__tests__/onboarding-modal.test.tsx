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

  it('advances to step 2 when Get Started is clicked', () => {
    render(<OnboardingModal isOpen={true} onComplete={mockOnComplete} />)
    fireEvent.click(screen.getByText('Get Started'))
    expect(screen.getByText('How EvalCap Works')).toBeInTheDocument()
    expect(screen.getByText('Continue')).toBeInTheDocument()
  })

  it('advances to step 3 from step 2', () => {
    render(<OnboardingModal isOpen={true} onComplete={mockOnComplete} />)
    fireEvent.click(screen.getByText('Get Started'))
    fireEvent.click(screen.getByText('Continue'))
    expect(screen.getByText('Why Journal?')).toBeInTheDocument()
  })

  it('goes back from step 2 to step 1', () => {
    render(<OnboardingModal isOpen={true} onComplete={mockOnComplete} />)
    fireEvent.click(screen.getByText('Get Started'))
    fireEvent.click(screen.getByText('Back'))
    expect(screen.getByText('Welcome to EvalCap')).toBeInTheDocument()
  })

  it('calls fetch and onComplete when skip is clicked', async () => {
    render(<OnboardingModal isOpen={true} onComplete={mockOnComplete} />)
    await act(async () => { fireEvent.click(screen.getByText('Skip for now')) })
    await waitFor(() => expect(mockOnComplete).toHaveBeenCalled())
    expect(fetch).toHaveBeenCalledWith('/api/profile', expect.objectContaining({ method: 'PATCH' }))
  })

  it('calls fetch and onComplete when complete link is clicked', async () => {
    render(<OnboardingModal isOpen={true} onComplete={mockOnComplete} />)
    fireEvent.click(screen.getByText('Get Started'))
    fireEvent.click(screen.getByText('Continue'))
    await act(async () => {
      fireEvent.click(screen.getByText(/Create Your First Check-in/i))
    })
    await waitFor(() => expect(mockOnComplete).toHaveBeenCalled())
  })

  it('logs error and does not call onComplete when skip fetch fails', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error')) as jest.Mock
    render(<OnboardingModal isOpen={true} onComplete={mockOnComplete} />)
    await act(async () => { fireEvent.click(screen.getByText('Skip for now')) })
    await waitFor(() => expect(logger.error).toHaveBeenCalled())
    expect(mockOnComplete).not.toHaveBeenCalled()
  })
})
