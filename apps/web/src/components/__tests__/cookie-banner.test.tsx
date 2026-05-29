/* @jest-environment jsdom */
import { render, screen, fireEvent, act } from '@testing-library/react'
import { CookieBanner } from '@/components/cookie-banner'

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) =>
    <a href={href}>{children}</a>,
}))

beforeEach(() => localStorage.clear())
afterEach(() => jest.clearAllMocks())

describe('CookieBanner', () => {
  it('shows banner when no consent stored', async () => {
    await act(async () => { render(<CookieBanner />) })
    expect(screen.getByText(/Got it/i)).toBeInTheDocument()
  })

  it('hides banner when consent already stored', async () => {
    localStorage.setItem('cookie-consent', 'accepted')
    await act(async () => { render(<CookieBanner />) })
    expect(screen.queryByText(/Got it/i)).not.toBeInTheDocument()
  })

  it('stores consent and hides banner on accept', async () => {
    await act(async () => { render(<CookieBanner />) })
    await act(async () => { fireEvent.click(screen.getByText(/Got it/i)) })
    expect(localStorage.getItem('cookie-consent')).toBe('accepted')
    expect(screen.queryByText(/Got it/i)).not.toBeInTheDocument()
  })

  it('shows privacy policy link', async () => {
    await act(async () => { render(<CookieBanner />) })
    expect(screen.getByText(/Privacy Policy/i)).toBeInTheDocument()
  })
})
