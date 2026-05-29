/* @jest-environment jsdom */
import { render, screen } from '@testing-library/react'
import TermsPage from '@/app/terms/page'

jest.mock('@/components/nav', () => ({ Nav: () => <nav data-testid="nav" /> }))
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}))

describe('TermsPage', () => {
  it('renders the Terms of Service heading', () => {
    render(<TermsPage />)
    expect(screen.getByText('Terms of Service')).toBeInTheDocument()
  })

  it('renders the Acceptable Use section', () => {
    render(<TermsPage />)
    expect(screen.getByText('Acceptable Use')).toBeInTheDocument()
  })

  it('renders link to the Privacy Policy', () => {
    render(<TermsPage />)
    expect(screen.getByText('View Privacy Policy →')).toBeInTheDocument()
  })

  it('renders the AI-Generated Content section', () => {
    render(<TermsPage />)
    expect(screen.getByText('AI-Generated Content')).toBeInTheDocument()
  })
})
