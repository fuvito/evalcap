import { POST } from '../checkout/route'
import { makeSupabase, jsonRequest } from './helpers'

jest.mock('@/lib/supabase/server')
jest.mock('@/lib/subscription')
jest.mock('@/lib/stripe', () => ({
  stripe: {
    billingPortal: {
      sessions: { create: jest.fn() },
    },
    checkout: {
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
  process.env.STRIPE_PRO_PRICE_ID_MONTHLY = 'price_monthly_test'
  process.env.STRIPE_PRO_PRICE_ID_ANNUAL = 'price_annual_test'
  process.env.NEXT_PUBLIC_APP_URL = 'https://app.example.com'
})

afterEach(() => {
  jest.clearAllMocks()
  delete process.env.STRIPE_PRO_PRICE_ID_MONTHLY
  delete process.env.STRIPE_PRO_PRICE_ID_ANNUAL
  delete process.env.NEXT_PUBLIC_APP_URL
})

describe('POST /api/checkout', () => {
  // -------------------------------------------------------------------------
  // Auth guard
  // -------------------------------------------------------------------------
  it('returns 401 when no user is authenticated', async () => {
    mockCreateClient.mockResolvedValue(makeSupabase(null))
    const req = jsonRequest('http://localhost/api/checkout', 'POST', {})
    const res = await POST(req)
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('Unauthorized')
  })

  it('returns 401 when auth returns an error', async () => {
    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: new Error('session expired') }),
      },
    })
    const req = jsonRequest('http://localhost/api/checkout', 'POST', {})
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  // -------------------------------------------------------------------------
  // Existing billing customer → redirect to portal
  // -------------------------------------------------------------------------
  it('creates a billing portal session when user already has a stripe_customer_id', async () => {
    mockCreateClient.mockResolvedValue(makeSupabase(AUTHED_USER))
    mockGetSubscription.mockResolvedValue({
      stripe_customer_id: 'cus_existing',
      stripe_subscription_id: 'sub_existing',
    })
    ;(mockStripe.billingPortal.sessions.create as jest.Mock).mockResolvedValue({
      url: 'https://billing.stripe.com/portal/xyz',
    })

    const req = jsonRequest('http://localhost/api/checkout', 'POST', {})
    const res = await POST(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.url).toBe('https://billing.stripe.com/portal/xyz')
    expect(mockStripe.billingPortal.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({ customer: 'cus_existing' }),
    )
  })

  // -------------------------------------------------------------------------
  // New customer → create checkout session (monthly, default)
  // -------------------------------------------------------------------------
  it('creates a monthly checkout session for a new customer (default interval)', async () => {
    mockCreateClient.mockResolvedValue(makeSupabase(AUTHED_USER))
    mockGetSubscription.mockResolvedValue(null)
    ;(mockStripe.checkout.sessions.create as jest.Mock).mockResolvedValue({
      url: 'https://checkout.stripe.com/pay/cs_monthly',
    })

    const req = jsonRequest('http://localhost/api/checkout', 'POST', {})
    const res = await POST(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.url).toBe('https://checkout.stripe.com/pay/cs_monthly')
    expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'subscription',
        line_items: [{ price: 'price_monthly_test', quantity: 1 }],
        customer_email: AUTHED_USER.email,
        metadata: { userId: AUTHED_USER.id },
      }),
    )
  })

  it('creates a monthly checkout session when interval is explicitly "monthly"', async () => {
    mockCreateClient.mockResolvedValue(makeSupabase(AUTHED_USER))
    mockGetSubscription.mockResolvedValue(null)
    ;(mockStripe.checkout.sessions.create as jest.Mock).mockResolvedValue({
      url: 'https://checkout.stripe.com/pay/cs_monthly',
    })

    const req = jsonRequest('http://localhost/api/checkout', 'POST', { interval: 'monthly' })
    await POST(req)
    expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        line_items: [{ price: 'price_monthly_test', quantity: 1 }],
      }),
    )
  })

  it('creates an annual checkout session when interval is "annual"', async () => {
    mockCreateClient.mockResolvedValue(makeSupabase(AUTHED_USER))
    mockGetSubscription.mockResolvedValue(null)
    ;(mockStripe.checkout.sessions.create as jest.Mock).mockResolvedValue({
      url: 'https://checkout.stripe.com/pay/cs_annual',
    })

    const req = jsonRequest('http://localhost/api/checkout', 'POST', { interval: 'annual' })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.url).toBe('https://checkout.stripe.com/pay/cs_annual')
    expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        line_items: [{ price: 'price_annual_test', quantity: 1 }],
      }),
    )
  })

  it('falls back to monthly for an unrecognised interval value', async () => {
    mockCreateClient.mockResolvedValue(makeSupabase(AUTHED_USER))
    mockGetSubscription.mockResolvedValue(null)
    ;(mockStripe.checkout.sessions.create as jest.Mock).mockResolvedValue({
      url: 'https://checkout.stripe.com/pay/cs_monthly',
    })

    const req = jsonRequest('http://localhost/api/checkout', 'POST', { interval: 'weekly' })
    await POST(req)
    expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        line_items: [{ price: 'price_monthly_test', quantity: 1 }],
      }),
    )
  })

  it('sets correct success_url and cancel_url', async () => {
    mockCreateClient.mockResolvedValue(makeSupabase(AUTHED_USER))
    mockGetSubscription.mockResolvedValue(null)
    ;(mockStripe.checkout.sessions.create as jest.Mock).mockResolvedValue({ url: 'https://checkout.stripe.com/pay/cs_x' })

    const req = jsonRequest('http://localhost/api/checkout', 'POST', {})
    await POST(req)
    expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        success_url: 'https://app.example.com/billing?success=1',
        cancel_url: 'https://app.example.com/billing',
      }),
    )
  })

  it('handles a subscription row without stripe_customer_id as a new customer', async () => {
    mockCreateClient.mockResolvedValue(makeSupabase(AUTHED_USER))
    // subscription exists but no stripe_customer_id yet
    mockGetSubscription.mockResolvedValue({ plan: 'free', status: 'active', stripe_customer_id: null })
    ;(mockStripe.checkout.sessions.create as jest.Mock).mockResolvedValue({ url: 'https://checkout.stripe.com/pay/cs_new' })

    const req = jsonRequest('http://localhost/api/checkout', 'POST', {})
    const res = await POST(req)
    expect(res.status).toBe(200)
    // Should create checkout, not portal
    expect(mockStripe.checkout.sessions.create).toHaveBeenCalled()
    expect(mockStripe.billingPortal.sessions.create).not.toHaveBeenCalled()
  })
})
