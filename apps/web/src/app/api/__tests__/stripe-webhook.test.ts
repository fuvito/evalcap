import { POST } from '../webhooks/stripe/route'
import { NextRequest } from 'next/server'

jest.mock('@/lib/stripe', () => ({
  stripe: {
    webhooks: {
      constructEvent: jest.fn(),
    },
    subscriptions: {
      retrieve: jest.fn(),
    },
  },
}))
jest.mock('@/lib/supabase/admin')
jest.mock('@/lib/logger')

import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'

const mockStripe = stripe as jest.Mocked<typeof stripe>
const mockCreateAdminClient = createAdminClient as jest.Mock

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(body: string, sig: string | null = 'valid-sig'): NextRequest {
  const headers: Record<string, string> = { 'content-type': 'text/plain' }
  if (sig !== null) headers['stripe-signature'] = sig
  return new NextRequest('http://localhost/api/webhooks/stripe', {
    method: 'POST',
    headers,
    body,
  })
}

/** Fluent upsert chain that captures the upserted payload. */
function makeAdminWithCapture() {
  let captured: unknown = null
  const chain = {
    upsert: jest.fn((data: unknown) => { captured = data; return chain }),
    then: (resolve: (v: unknown) => unknown) =>
      Promise.resolve({ data: null, error: null }).then(resolve),
  }
  const admin = {
    from: jest.fn(() => chain),
    _captured: () => captured,
  }
  return admin
}

/** Build a minimal Stripe.Subscription-like object. */
function makeSub(overrides: Record<string, unknown> = {}) {
  return {
    id: 'sub_test',
    status: 'active',
    customer: 'cus_test',
    cancel_at_period_end: false,
    canceled_at: null,
    metadata: { userId: 'user-1' },
    items: {
      data: [
        {
          current_period_start: Math.floor(Date.now() / 1000) - 86400,
          current_period_end: Math.floor(Date.now() / 1000) + 86400 * 29,
        },
      ],
    },
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Stripe mock setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test'
  jest.clearAllMocks()
})

afterEach(() => {
  delete process.env.STRIPE_WEBHOOK_SECRET
})

// ---------------------------------------------------------------------------
// Signature / malformed request guards
// ---------------------------------------------------------------------------

describe('POST /api/webhooks/stripe', () => {
  describe('signature validation', () => {
    it('returns 400 when stripe-signature header is missing', async () => {
      const req = makeRequest('{}', null)
      const res = await POST(req)
      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.error).toBe('Missing signature')
    })

    it('returns 400 when signature verification fails', async () => {
      ;(mockStripe.webhooks.constructEvent as jest.Mock).mockImplementation(() => {
        throw new Error('No signatures found')
      })
      const req = makeRequest('{}', 'bad-sig')
      const res = await POST(req)
      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.error).toBe('Invalid signature')
    })
  })

  // -------------------------------------------------------------------------
  // checkout.session.completed
  // -------------------------------------------------------------------------

  describe('checkout.session.completed', () => {
    const makeCheckoutEvent = (sessionOverrides: Record<string, unknown> = {}) => ({
      type: 'checkout.session.completed',
      data: {
        object: {
          mode: 'subscription',
          customer: 'cus_test',
          subscription: 'sub_test',
          metadata: { userId: 'user-1' },
          ...sessionOverrides,
        },
      },
    })

    it('upserts a pro subscription on successful checkout', async () => {
      const stripeSub = makeSub()
      ;(mockStripe.webhooks.constructEvent as jest.Mock).mockReturnValue(makeCheckoutEvent())
      ;(mockStripe.subscriptions.retrieve as jest.Mock).mockResolvedValue(stripeSub)
      const admin = makeAdminWithCapture()
      mockCreateAdminClient.mockReturnValue(admin)

      const req = makeRequest('body')
      const res = await POST(req)
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.received).toBe(true)

      const upsertPayload = admin._captured() as Record<string, unknown>
      expect(upsertPayload).toMatchObject({
        user_id: 'user-1',
        plan: 'pro',
        status: 'active',
        stripe_customer_id: 'cus_test',
        stripe_subscription_id: 'sub_test',
      })
    })

    it('skips upsert when session.mode is not "subscription"', async () => {
      ;(mockStripe.webhooks.constructEvent as jest.Mock).mockReturnValue(
        makeCheckoutEvent({ mode: 'payment' }),
      )
      const admin = makeAdminWithCapture()
      mockCreateAdminClient.mockReturnValue(admin)

      const req = makeRequest('body')
      const res = await POST(req)
      expect(res.status).toBe(200)
      expect(admin.from).not.toHaveBeenCalled()
    })

    it('skips upsert when userId metadata is missing', async () => {
      ;(mockStripe.webhooks.constructEvent as jest.Mock).mockReturnValue(
        makeCheckoutEvent({ metadata: {} }),
      )
      const admin = makeAdminWithCapture()
      mockCreateAdminClient.mockReturnValue(admin)

      const req = makeRequest('body')
      const res = await POST(req)
      expect(res.status).toBe(200)
      expect(admin.from).not.toHaveBeenCalled()
    })

    it('maps trialing stripe status correctly', async () => {
      const stripeSub = makeSub({ status: 'trialing' })
      ;(mockStripe.webhooks.constructEvent as jest.Mock).mockReturnValue(makeCheckoutEvent())
      ;(mockStripe.subscriptions.retrieve as jest.Mock).mockResolvedValue(stripeSub)
      const admin = makeAdminWithCapture()
      mockCreateAdminClient.mockReturnValue(admin)

      const req = makeRequest('body')
      await POST(req)
      const upsertPayload = admin._captured() as Record<string, unknown>
      expect(upsertPayload.status).toBe('trialing')
    })
  })

  // -------------------------------------------------------------------------
  // customer.subscription.updated
  // -------------------------------------------------------------------------

  describe('customer.subscription.updated', () => {
    it('updates subscription to pro/active', async () => {
      const sub = makeSub({ status: 'active' })
      ;(mockStripe.webhooks.constructEvent as jest.Mock).mockReturnValue({
        type: 'customer.subscription.updated',
        data: { object: sub },
      })
      const admin = makeAdminWithCapture()
      mockCreateAdminClient.mockReturnValue(admin)

      const req = makeRequest('body')
      const res = await POST(req)
      expect(res.status).toBe(200)
      const upsertPayload = admin._captured() as Record<string, unknown>
      expect(upsertPayload).toMatchObject({
        user_id: 'user-1',
        plan: 'pro',
        status: 'active',
      })
    })

    it('downgrades to free when subscription status becomes past_due', async () => {
      const sub = makeSub({ status: 'past_due' })
      ;(mockStripe.webhooks.constructEvent as jest.Mock).mockReturnValue({
        type: 'customer.subscription.updated',
        data: { object: sub },
      })
      const admin = makeAdminWithCapture()
      mockCreateAdminClient.mockReturnValue(admin)

      const req = makeRequest('body')
      await POST(req)
      const upsertPayload = admin._captured() as Record<string, unknown>
      expect(upsertPayload.plan).toBe('free')
      expect(upsertPayload.status).toBe('past_due')
    })

    it('maps stripe "canceled" to db "cancelled" (spelling normalisation)', async () => {
      const sub = makeSub({ status: 'canceled' })
      ;(mockStripe.webhooks.constructEvent as jest.Mock).mockReturnValue({
        type: 'customer.subscription.updated',
        data: { object: sub },
      })
      const admin = makeAdminWithCapture()
      mockCreateAdminClient.mockReturnValue(admin)

      const req = makeRequest('body')
      await POST(req)
      const upsertPayload = admin._captured() as Record<string, unknown>
      expect(upsertPayload.status).toBe('cancelled')
    })

    it('maps unknown stripe status to "incomplete"', async () => {
      const sub = makeSub({ status: 'unpaid' })
      ;(mockStripe.webhooks.constructEvent as jest.Mock).mockReturnValue({
        type: 'customer.subscription.updated',
        data: { object: sub },
      })
      const admin = makeAdminWithCapture()
      mockCreateAdminClient.mockReturnValue(admin)

      const req = makeRequest('body')
      await POST(req)
      const upsertPayload = admin._captured() as Record<string, unknown>
      expect(upsertPayload.status).toBe('incomplete')
    })

    it('includes cancel_at_period_end in the upsert payload', async () => {
      const sub = makeSub({ cancel_at_period_end: true })
      ;(mockStripe.webhooks.constructEvent as jest.Mock).mockReturnValue({
        type: 'customer.subscription.updated',
        data: { object: sub },
      })
      const admin = makeAdminWithCapture()
      mockCreateAdminClient.mockReturnValue(admin)

      const req = makeRequest('body')
      await POST(req)
      const upsertPayload = admin._captured() as Record<string, unknown>
      expect(upsertPayload.cancel_at_period_end).toBe(true)
    })

    it('skips upsert when userId metadata is missing', async () => {
      const sub = makeSub({ metadata: {} })
      ;(mockStripe.webhooks.constructEvent as jest.Mock).mockReturnValue({
        type: 'customer.subscription.updated',
        data: { object: sub },
      })
      const admin = makeAdminWithCapture()
      mockCreateAdminClient.mockReturnValue(admin)

      const req = makeRequest('body')
      const res = await POST(req)
      expect(res.status).toBe(200)
      expect(admin.from).not.toHaveBeenCalled()
    })
  })

  // -------------------------------------------------------------------------
  // customer.subscription.deleted
  // -------------------------------------------------------------------------

  describe('customer.subscription.deleted', () => {
    it('downgrades user to free/cancelled on subscription deletion', async () => {
      const sub = makeSub({ status: 'canceled' })
      ;(mockStripe.webhooks.constructEvent as jest.Mock).mockReturnValue({
        type: 'customer.subscription.deleted',
        data: { object: sub },
      })
      const admin = makeAdminWithCapture()
      mockCreateAdminClient.mockReturnValue(admin)

      const req = makeRequest('body')
      const res = await POST(req)
      expect(res.status).toBe(200)
      const upsertPayload = admin._captured() as Record<string, unknown>
      expect(upsertPayload).toMatchObject({
        user_id: 'user-1',
        plan: 'free',
        status: 'cancelled',
      })
    })

    it('sets cancelled_at to a recent ISO string', async () => {
      const sub = makeSub()
      ;(mockStripe.webhooks.constructEvent as jest.Mock).mockReturnValue({
        type: 'customer.subscription.deleted',
        data: { object: sub },
      })
      const admin = makeAdminWithCapture()
      mockCreateAdminClient.mockReturnValue(admin)

      const before = new Date().toISOString()
      const req = makeRequest('body')
      await POST(req)
      const after = new Date().toISOString()
      const upsertPayload = admin._captured() as Record<string, unknown>
      expect(typeof upsertPayload.cancelled_at).toBe('string')
      expect(upsertPayload.cancelled_at! >= before).toBe(true)
      expect(upsertPayload.cancelled_at! <= after).toBe(true)
    })

    it('skips upsert when userId metadata is missing', async () => {
      const sub = makeSub({ metadata: {} })
      ;(mockStripe.webhooks.constructEvent as jest.Mock).mockReturnValue({
        type: 'customer.subscription.deleted',
        data: { object: sub },
      })
      const admin = makeAdminWithCapture()
      mockCreateAdminClient.mockReturnValue(admin)

      const req = makeRequest('body')
      const res = await POST(req)
      expect(res.status).toBe(200)
      expect(admin.from).not.toHaveBeenCalled()
    })
  })

  // -------------------------------------------------------------------------
  // Unhandled event types
  // -------------------------------------------------------------------------

  describe('unhandled event types', () => {
    it('returns 200 received:true for an unknown event type', async () => {
      ;(mockStripe.webhooks.constructEvent as jest.Mock).mockReturnValue({
        type: 'payment_intent.succeeded',
        data: { object: {} },
      })
      const admin = makeAdminWithCapture()
      mockCreateAdminClient.mockReturnValue(admin)

      const req = makeRequest('body')
      const res = await POST(req)
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.received).toBe(true)
      expect(admin.from).not.toHaveBeenCalled()
    })
  })

  // -------------------------------------------------------------------------
  // Handler error path
  // -------------------------------------------------------------------------

  describe('handler errors', () => {
    it('returns 500 when the DB upsert throws', async () => {
      const sub = makeSub()
      ;(mockStripe.webhooks.constructEvent as jest.Mock).mockReturnValue({
        type: 'customer.subscription.updated',
        data: { object: sub },
      })
      mockCreateAdminClient.mockReturnValue({
        from: jest.fn(() => ({
          upsert: jest.fn(() => { throw new Error('DB exploded') }),
        })),
      })

      const req = makeRequest('body')
      const res = await POST(req)
      expect(res.status).toBe(500)
      const body = await res.json()
      expect(body.error).toBe('Handler error')
    })

    it('returns 500 when stripe.subscriptions.retrieve throws', async () => {
      ;(mockStripe.webhooks.constructEvent as jest.Mock).mockReturnValue({
        type: 'checkout.session.completed',
        data: {
          object: {
            mode: 'subscription',
            customer: 'cus_test',
            subscription: 'sub_test',
            metadata: { userId: 'user-1' },
          },
        },
      })
      ;(mockStripe.subscriptions.retrieve as jest.Mock).mockRejectedValue(new Error('Stripe API error'))
      mockCreateAdminClient.mockReturnValue(makeAdminWithCapture())

      const req = makeRequest('body')
      const res = await POST(req)
      expect(res.status).toBe(500)
    })
  })

  // -------------------------------------------------------------------------
  // period date helpers
  // -------------------------------------------------------------------------

  describe('period date mapping', () => {
    it('writes current_period_start and current_period_end as ISO strings', async () => {
      const now = Math.floor(Date.now() / 1000)
      const sub = makeSub({
        items: {
          data: [
            { current_period_start: now, current_period_end: now + 2592000 },
          ],
        },
      })
      ;(mockStripe.webhooks.constructEvent as jest.Mock).mockReturnValue({
        type: 'customer.subscription.updated',
        data: { object: sub },
      })
      const admin = makeAdminWithCapture()
      mockCreateAdminClient.mockReturnValue(admin)

      const req = makeRequest('body')
      await POST(req)
      const payload = admin._captured() as Record<string, unknown>
      expect(typeof payload.current_period_start).toBe('string')
      expect(typeof payload.current_period_end).toBe('string')
      // Sanity: the ISO strings round-trip to close dates
      expect(new Date(payload.current_period_start as string).getTime()).toBeCloseTo(
        now * 1000, -3,
      )
    })

    it('writes null period dates when items.data is empty', async () => {
      const sub = makeSub({ items: { data: [] } })
      ;(mockStripe.webhooks.constructEvent as jest.Mock).mockReturnValue({
        type: 'customer.subscription.updated',
        data: { object: sub },
      })
      const admin = makeAdminWithCapture()
      mockCreateAdminClient.mockReturnValue(admin)

      const req = makeRequest('body')
      await POST(req)
      const payload = admin._captured() as Record<string, unknown>
      expect(payload.current_period_start).toBeNull()
      expect(payload.current_period_end).toBeNull()
    })
  })
})
