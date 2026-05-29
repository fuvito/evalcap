/* @jest-environment jsdom */
import { render, screen } from '@testing-library/react'
import PrivacyPage from '@/app/privacy/page'

jest.mock('@/components/nav', () => ({ Nav: () => <nav data-testid="nav" /> }))
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}))

describe('PrivacyPage', () => {
  it('renders the Privacy Policy heading', () => {
    render(<PrivacyPage />)
    expect(screen.getByRole('heading', { name: 'Privacy Policy' })).toBeInTheDocument()
  })

  it('renders the Data We Collect section', () => {
    render(<PrivacyPage />)
    expect(screen.getByText('Data We Collect')).toBeInTheDocument()
  })

  it('renders a link to the Terms of Service', () => {
    render(<PrivacyPage />)
    expect(screen.getByText('View Terms of Service →')).toBeInTheDocument()
  })

  it('renders the AI Processing section', () => {
    render(<PrivacyPage />)
    expect(screen.getByText('AI Processing (Anthropic)')).toBeInTheDocument()
  })
})
