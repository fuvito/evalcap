/* @jest-environment jsdom */
import { render, screen } from '@testing-library/react'
import { Footer } from '@/components/footer'

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) =>
    <a href={href}>{children}</a>,
}))

describe('Footer', () => {
  it('renders copyright with current year', () => {
    render(<Footer />)
    expect(screen.getByText(new RegExp(String(new Date().getFullYear())))).toBeInTheDocument()
    expect(screen.getByText(/EvalCap/)).toBeInTheDocument()
  })

  it('renders Privacy Policy link', () => {
    render(<Footer />)
    const link = screen.getByText('Privacy Policy')
    expect(link.closest('a')).toHaveAttribute('href', '/privacy')
  })

  it('renders Terms of Service link', () => {
    render(<Footer />)
    const link = screen.getByText('Terms of Service')
    expect(link.closest('a')).toHaveAttribute('href', '/terms')
  })
})
