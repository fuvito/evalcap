import { POST } from '../billing/portal/route'
import { makeSupabase, jsonRequest } from './helpers'
import { NextRequest } from 'next/server'

jest.mock('@/lib/supabase/server')
jest.mock('@/lib/subscription')
jest.mock('@/lib/stripe', () => ({
  stripe: {
    billingPortal: {
      sessions: { create: jest.fn() },
    },
  },
}))

import { createClient } from '@/lib/supabase/server'
import { getSubscription } from '@/lib/subscription'
import { stripe } from '@/lib/stripe'

const mockCreateClient = createClient as jest.Mock
const mockGetSubscription = getSubscription as jest.Mock
const mockStripe = stripe as jest.Mocked<typeof stripe>

const AUTHED_USER = { id: 'user-1', email: 'user@example.com' }

beforeEach(() => {
  process.env.NEXT_PUBLIC_APP_URL = 'https://app.example.com'
})

afterEach(() => {
  jest.clearAllMocks()
  delete process.env.NEXT_PUBLIC_APP_URL
})

describe('POST /api/billing/portal', () => {
  // -------------------------------------------------------------------------
  // Auth guard
  // -------------------------------------------------------------------------
  it('returns 401 when no user is authenticated', async () => {
    mockCreateClient.mockResolvedValue(makeSupabase(null))
    const req = new NextRequest('http://localhost/api/billing/portal', { method: 'POST' })
    const res = await POST(req)
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('Unauthorized')
  })

  it('returns 401 when auth returns an error', async () => {
    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: null },
          error: new Error('session invalid'),
        }),
      },
    })
    const req = new NextRequest('http://localhost/api/billing/portal', { method: 'POST' })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  // -------------------------------------------------------------------------
  // No billing account
  // -------------------------------------------------------------------------
  it('returns 404 when user has no subscription', async () => {
    mockCreateClient.mockResolvedValue(makeSupabase(AUTHED_USER))
    mockGetSubscription.mockResolvedValue(null)
    const req = new NextRequest('http://localhost/api/billing/portal', { method: 'POST' })
    const res = await POST(req)
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toContain('No billing account')
  })

  it('returns 404 when subscription has no stripe_customer_id', async () => {
    mockCreateClient.mockResolvedValue(makeSupabase(AUTHED_USER))
    mockGetSubscription.mockResolvedValue({ plan: 'free', stripe_customer_id: null })
    const req = new NextRequest('http://localhost/api/billing/portal', { method: 'POST' })
    const res = await POST(req)
    expect(res.status).toBe(404)
  })

  // -------------------------------------------------------------------------
  // Happy path
  // -------------------------------------------------------------------------
  it('returns a portal URL on success', async () => {
    mockCreateClient.mockResolvedValue(makeSupabase(AUTHED_USER))
    mockGetSubscription.mockResolvedValue({
      plan: 'pro',
      status: 'active',
      stripe_customer_id: 'cus_abc123',
    })
    ;(mockStripe.billingPortal.sessions.create as jest.Mock).mockResolvedValue({
      url: 'https://billing.stripe.com/session/test',
    })

    const req = new NextRequest('http://localhost/api/billing/portal', { method: 'POST' })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.url).toBe('https://billing.stripe.com/session/test')
  })

  it('calls stripe.billingPortal.sessions.create with correct customer and return_url', async () => {
    mockCreateClient.mockResolvedValue(makeSupabase(AUTHED_USER))
    mockGetSubscription.mockResolvedValue({ stripe_customer_id: 'cus_abc123' })
    ;(mockStripe.billingPortal.sessions.create as jest.Mock).mockResolvedValue({
      url: 'https://billing.stripe.com/session/test',
    })

    const req = new NextRequest('http://localhost/api/billing/portal', { method: 'POST' })
    await POST(req)

    expect(mockStripe.billingPortal.sessions.create).toHaveBeenCalledWith({
      customer: 'cus_abc123',
      return_url: 'https://app.example.com/billing',
    })
  })

  it('calls getSubscription with the authenticated user id', async () => {
    mockCreateClient.mockResolvedValue(makeSupabase(AUTHED_USER))
    mockGetSubscription.mockResolvedValue({ stripe_customer_id: 'cus_abc123' })
    ;(mockStripe.billingPortal.sessions.create as jest.Mock).mockResolvedValue({ url: 'https://x' })

    const req = new NextRequest('http://localhost/api/billing/portal', { method: 'POST' })
    await POST(req)
    expect(mockGetSubscription).toHaveBeenCalledWith(AUTHED_USER.id)
  })
})
