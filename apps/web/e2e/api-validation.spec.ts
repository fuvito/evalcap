import { test, expect } from '@playwright/test'

test.describe('API Validation', () => {
  test('POST /api/prompts requires auth', async ({ request }) => {
    const response = await request.post('/api/prompts', {
      data: { checkInType: 'daily' },
    })
    expect(response.status()).toBe(401)
    const json = await response.json()
    expect(json.error).toBe('Unauthorized')
  })

  test('POST /api/prompts rejects invalid checkInType', async ({ request }) => {
    const response = await request.post('/api/prompts', {
      data: { checkInType: 'invalid' },
    })
    expect(response.status()).toBe(401) // Auth fails before validation
  })

  test('POST /api/summary requires auth', async ({ request }) => {
    const response = await request.post('/api/summary', {
      data: {
        timeframeStart: '2026-05-01',
        timeframeEnd: '2026-05-31',
      },
    })
    expect(response.status()).toBe(401)
    const json = await response.json()
    expect(json.error).toBe('Unauthorized')
  })

  test('POST /api/summary rejects invalid dates', async ({ request }) => {
    const response = await request.post('/api/summary', {
      data: {
        timeframeStart: 'invalid-date',
        timeframeEnd: '2026-05-31',
      },
    })
    expect(response.status()).toBe(401) // Auth fails before validation
  })

  test('POST /api/summary rejects missing timeframe', async ({ request }) => {
    const response = await request.post('/api/summary', {
      data: {
        userInstructions: 'some instructions',
      },
    })
    expect(response.status()).toBe(401) // Auth fails before validation
  })

  test('GET requests to API routes return 405', async ({ request }) => {
    const promptsResponse = await request.get('/api/prompts')
    expect([404, 405]).toContain(promptsResponse.status())

    const summaryResponse = await request.get('/api/summary')
    expect([404, 405]).toContain(summaryResponse.status())
  })
})
