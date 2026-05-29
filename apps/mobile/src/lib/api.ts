import { supabase } from './supabase'

const WEB_API_URL = process.env.EXPO_PUBLIC_WEB_API_URL ?? ''

async function getAuthHeader(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) throw new Error('Not authenticated')
  return { Authorization: `Bearer ${session.access_token}` }
}

export interface PromptsRequest {
  checkInType: 'daily' | 'weekly'
  recentEntries?: string[]
}

export interface PromptsResponse {
  prompts: string[]
}

export async function fetchPrompts(body: PromptsRequest): Promise<PromptsResponse> {
  const headers = await getAuthHeader()
  const res = await fetch(`${WEB_API_URL}/api/prompts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(err.error ?? `HTTP ${res.status}`)
  }
  return res.json()
}

export interface SummaryRequest {
  startDate: string
  endDate: string
  instructions?: string
}

export interface SummaryResponse {
  summary: string
}

export async function fetchSummary(body: SummaryRequest): Promise<SummaryResponse> {
  const headers = await getAuthHeader()
  const res = await fetch(`${WEB_API_URL}/api/summary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(err.error ?? `HTTP ${res.status}`)
  }
  return res.json()
}
