import { NextRequest } from 'next/server'

/** Build a thenable supabase query chain that resolves to `result`. */
export function makeChain(result: unknown) {
  const chain: Record<string, unknown> = {}
  const chainMethods = [
    'select', 'insert', 'update', 'delete', 'upsert',
    'eq', 'neq', 'in', 'order', 'limit', 'gte', 'lte', 'single', 'maybeSingle',
  ] as const
  chainMethods.forEach(m => { chain[m] = jest.fn(() => chain) })
  chain['then'] = (resolve: (v: unknown) => unknown, reject: (e: unknown) => unknown) =>
    Promise.resolve(result).then(resolve, reject)
  return chain
}

/** Build a minimal mock supabase client. */
export function makeSupabase(
  user: { id: string; email: string } | null,
  tableResults: Record<string, unknown> = {}
) {
  return {
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user }, error: null }),
    },
    from: jest.fn((table: string) =>
      makeChain(tableResults[table] ?? { data: null, error: null })
    ),
  }
}

/** Build a NextRequest with a JSON body. */
export function jsonRequest(url: string, method: string, body: unknown): NextRequest {
  return new NextRequest(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

/** Build a NextRequest with a JSON body and Bearer token. */
export function bearerRequest(url: string, method: string, body: unknown, token: string): NextRequest {
  return new NextRequest(url, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  })
}
