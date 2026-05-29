/* @jest-environment jsdom */
import { render, screen, act } from '@testing-library/react'

const mockRedirect = jest.fn((url: string) => { throw new Error(`Redirect:${url}`) })

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}))

jest.mock('next/navigation', () => ({
  redirect: (url: string) => mockRedirect(url),
}))

jest.mock('@/components/nav', () => ({ Nav: () => <nav data-testid="nav" /> }))
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}))

import { createClient } from '@/lib/supabase/server'
import SummariesPage from '@/app/summaries/page'

function makeChain(result: unknown) {
  const chain: Record<string, unknown> = {}
  const self = () => chain
  chain.select = jest.fn(self)
  chain.eq = jest.fn(self)
  chain.order = jest.fn(self)
  ;(chain as any).then = (resolve: (v: unknown) => void) => Promise.resolve(result).then(resolve)
  return chain
}

beforeEach(() => jest.clearAllMocks())

describe('SummariesPage', () => {
  it('redirects to login when unauthenticated', async () => {
    ;(createClient as jest.Mock).mockResolvedValue({
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: null } }) },
      from: jest.fn(),
    })
    await expect(SummariesPage()).rejects.toThrow('Redirect:/auth/login')
    expect(mockRedirect).toHaveBeenCalledWith('/auth/login')
  })

  it('renders list of summaries when authenticated', async () => {
    const summaries = [
      {
        id: 's1',
        timeframe_start: '2026-01-01',
        timeframe_end: '2026-03-31',
        created_at: '2026-04-01T00:00:00Z',
      },
    ]
    ;(createClient as jest.Mock).mockResolvedValue({
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
      from: jest.fn(() => makeChain({ data: summaries })),
    })
    let jsx: React.ReactNode
    await act(async () => { jsx = await SummariesPage() })
    render(jsx as React.ReactElement)
    expect(screen.getByText('Saved Summaries')).toBeInTheDocument()
    expect(screen.getByText('Performance review summary')).toBeInTheDocument()
  })

  it('shows empty state when no summaries', async () => {
    ;(createClient as jest.Mock).mockResolvedValue({
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
      from: jest.fn(() => makeChain({ data: [] })),
    })
    let jsx: React.ReactNode
    await act(async () => { jsx = await SummariesPage() })
    render(jsx as React.ReactElement)
    expect(screen.getByText('No summaries yet')).toBeInTheDocument()
    expect(screen.getByText('Generate Your First Summary')).toBeInTheDocument()
  })
})
