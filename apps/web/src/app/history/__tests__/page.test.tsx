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

jest.mock('@/app/history/entry-list', () => ({
  EntryList: ({ entries }: { entries: unknown[] }) => (
    <div data-testid="entry-list">{entries.length} entries</div>
  ),
}))

import { createClient } from '@/lib/supabase/server'
import HistoryPage from '@/app/history/page'

function makeChain(result: unknown) {
  const chain: Record<string, unknown> = {}
  const self = () => chain
  chain.select = jest.fn(self)
  chain.eq = jest.fn(self)
  chain.order = jest.fn(self)
  chain.single = jest.fn(() => Promise.resolve(result))
  ;(chain as any).then = (resolve: (v: unknown) => void) => Promise.resolve(result).then(resolve)
  return chain
}

beforeEach(() => jest.clearAllMocks())

describe('HistoryPage', () => {
  it('redirects to login when unauthenticated', async () => {
    ;(createClient as jest.Mock).mockResolvedValue({
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: null } }) },
      from: jest.fn(),
    })
    await expect(HistoryPage()).rejects.toThrow('Redirect:/auth/login')
    expect(mockRedirect).toHaveBeenCalledWith('/auth/login')
  })

  it('renders entries list when authenticated', async () => {
    const entries = [
      { id: 'e1', content: 'Entry 1', check_in_type: 'weekly', created_at: '2026-05-01T00:00:00Z' },
    ]
    ;(createClient as jest.Mock).mockResolvedValue({
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
      from: jest.fn(() => makeChain({ data: entries })),
    })
    let jsx: React.ReactNode
    await act(async () => { jsx = await HistoryPage() })
    render(jsx as React.ReactElement)
    expect(screen.getByText('All Check-ins')).toBeInTheDocument()
    expect(screen.getByTestId('entry-list')).toBeInTheDocument()
    expect(screen.getByText('1 entries')).toBeInTheDocument()
  })

  it('shows empty state when no entries', async () => {
    ;(createClient as jest.Mock).mockResolvedValue({
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
      from: jest.fn(() => makeChain({ data: [] })),
    })
    let jsx: React.ReactNode
    await act(async () => { jsx = await HistoryPage() })
    render(jsx as React.ReactElement)
    expect(screen.getByText('Your journal is empty')).toBeInTheDocument()
    expect(screen.getByText('Start Your First Check-in')).toBeInTheDocument()
  })
})
