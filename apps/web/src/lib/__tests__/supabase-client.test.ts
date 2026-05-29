const mockCreateBrowserClient = jest.fn()

jest.mock('@supabase/ssr', () => ({
  createBrowserClient: (...args: unknown[]) => mockCreateBrowserClient(...args),
}))

afterEach(() => jest.clearAllMocks())

describe('createClient (browser)', () => {
  it('calls createBrowserClient and returns the result', () => {
    const fakeClient = { auth: {} }
    mockCreateBrowserClient.mockReturnValue(fakeClient)

    const { createClient } = require('@/lib/supabase/client')
    const client = createClient()

    expect(mockCreateBrowserClient).toHaveBeenCalledTimes(1)
    expect(client).toBe(fakeClient)
  })

  it('passes SUPABASE_URL and ANON_KEY env vars', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
    mockCreateBrowserClient.mockReturnValue({})

    const { createClient } = require('@/lib/supabase/client')
    createClient()

    expect(mockCreateBrowserClient).toHaveBeenCalledWith(
      'https://test.supabase.co',
      'test-anon-key'
    )

    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  })
})
