/* @jest-environment jsdom */
import { render, screen, act } from '@testing-library/react'

const mockRedirect = jest.fn((url: string) => { throw new Error(`Redirect:${url}`) })
const mockNotFound = jest.fn(() => { throw new Error('NotFound') })

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}))

jest.mock('next/navigation', () => ({
  redirect: (url: string) => mockRedirect(url),
  notFound: () => mockNotFound(),
}))

jest.mock('@/components/nav', () => ({ Nav: () => <nav data-testid="nav" /> }))

jest.mock('@/app/summaries/[id]/summary-detail', () => ({
  SummaryDetail: ({ summary }: { summary: unknown }) => (
    <div data-testid="summary-detail">{(summary as any).id}</div>
  ),
}))

import { createClient } from '@/lib/supabase/server'
import SummaryDetailPage from '@/app/summaries/[id]/page'

const mockSummary = {
  id: 'sum-1',
  user_id: 'u1',
  content: 'Great quarter',
  timeframe_start: '2026-01-01',
  timeframe_end: '2026-03-31',
  created_at: '2026-04-01T00:00:00Z',
  user_instructions: null,
}

function makeChain(result: unknown) {
  const chain: Record<string, unknown> = {}
  const self = () => chain
  chain.select = jest.fn(self)
  chain.eq = jest.fn(self)
  chain.single = jest.fn(() => Promise.resolve(result))
  ;(chain as any).then = (resolve: (v: unknown) => void) => Promise.resolve(result).then(resolve)
  return chain
}

beforeEach(() => jest.clearAllMocks())

const params = Promise.resolve({ id: 'sum-1' })

describe('SummaryDetailPage', () => {
  it('redirects to login when unauthenticated', async () => {
    ;(createClient as jest.Mock).mockResolvedValue({
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: null } }) },
      from: jest.fn(),
    })
    await expect(SummaryDetailPage({ params })).rejects.toThrow('Redirect:/auth/login')
  })

  it('returns notFound when summary does not exist', async () => {
    ;(createClient as jest.Mock).mockResolvedValue({
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
      from: jest.fn(() => makeChain({ data: null })),
    })
    await expect(SummaryDetailPage({ params })).rejects.toThrow('NotFound')
    expect(mockNotFound).toHaveBeenCalled()
  })

  it('renders SummaryDetail when summary exists', async () => {
    ;(createClient as jest.Mock).mockResolvedValue({
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
      from: jest.fn(() => makeChain({ data: mockSummary })),
    })
    let jsx: React.ReactNode
    await act(async () => { jsx = await SummaryDetailPage({ params }) })
    render(jsx as React.ReactElement)
    expect(screen.getByTestId('summary-detail')).toBeInTheDocument()
    expect(screen.getByText('sum-1')).toBeInTheDocument()
  })
})
