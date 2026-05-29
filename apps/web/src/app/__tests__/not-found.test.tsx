/* @jest-environment jsdom */
import { render, screen } from '@testing-library/react'
import NotFound from '@/app/not-found'

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) =>
    <a href={href}>{children}</a>,
}))

describe('NotFound', () => {
  it('renders 404 heading', () => {
    render(<NotFound />)
    expect(screen.getByText('404')).toBeInTheDocument()
  })

  it('renders page not found message', () => {
    render(<NotFound />)
    expect(screen.getByText('Page not found')).toBeInTheDocument()
  })

  it('renders go home link pointing to /', () => {
    render(<NotFound />)
    const link = screen.getByText('Go home')
    expect(link.closest('a')).toHaveAttribute('href', '/')
  })
})
