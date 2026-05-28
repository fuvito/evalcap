import { generateSmartPrompts, generateSummary } from '../claude'

// mockCreate is captured lazily in the closure to avoid the TDZ issue
// (jest.mock factory is hoisted before const declarations)
const mockCreate = jest.fn()

jest.mock('@anthropic-ai/sdk', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    messages: { create: (...args: unknown[]) => mockCreate(...args) },
  })),
}))

function promptResponse(text: string) {
  return { content: [{ type: 'text', text }] }
}

beforeEach(() => {
  mockCreate.mockResolvedValue(
    promptResponse(
      JSON.stringify([
        'What did you accomplish since your last check-in?',
        'What are you currently working on?',
        'Any blockers or challenges?',
      ])
    )
  )
})

afterEach(() => {
  jest.clearAllMocks()
})

describe('generateSmartPrompts', () => {
  it('returns array of 3 prompts', async () => {
    const prompts = await generateSmartPrompts([], 'daily')
    expect(Array.isArray(prompts)).toBe(true)
    expect(prompts.length).toBe(3)
  })

  it('handles empty entries for weekly check-in', async () => {
    const prompts = await generateSmartPrompts([], 'weekly')
    expect(prompts.length).toBe(3)
  })

  it('truncates long entry content', async () => {
    const entries = [{ id: '1', content: 'x'.repeat(2000), created_at: '2026-05-27' }]
    const prompts = await generateSmartPrompts(entries, 'daily')
    expect(prompts.length).toBe(3)
  })

  it('uses only last 5 entries', async () => {
    const entries = Array.from({ length: 10 }, (_, i) => ({
      id: String(i),
      content: `Entry ${i}`,
      created_at: '2026-05-27',
    }))
    await generateSmartPrompts(entries, 'daily')
    const callArg = mockCreate.mock.calls[0][0]
    const content = callArg.messages[0].content as string
    // Should not include all 10 entries — context is capped at 5
    expect(content).toContain('Entry 9')
    expect(content).not.toContain('Entry 0')
  })

  it('includes goals context when provided', async () => {
    const goals = {
      evaluationGoals: [{ title: 'Ship feature X', status: 'in_progress' }],
      personalGoals: [{ title: 'Improve communication', category: 'soft-skills', priority: 'high' }],
    }
    await generateSmartPrompts([], 'daily', goals)
    const callArg = mockCreate.mock.calls[0][0]
    expect(callArg.system).toContain('goals')
  })

  it('falls back to default prompts when Claude returns invalid JSON', async () => {
    mockCreate.mockResolvedValueOnce(promptResponse('not valid json'))
    const prompts = await generateSmartPrompts([], 'daily')
    expect(prompts.length).toBe(3)
    expect(prompts[0]).toContain('accomplish')
  })

  it('returns empty array when content block is not text type', async () => {
    mockCreate.mockResolvedValueOnce({ content: [{ type: 'image', source: {} }] })
    const prompts = await generateSmartPrompts([], 'daily')
    // Non-text block → text defaults to '[]' → parses to empty array
    expect(Array.isArray(prompts)).toBe(true)
    expect(prompts.length).toBe(0)
  })
})

describe('generateSummary', () => {
  beforeEach(() => {
    mockCreate.mockResolvedValue(promptResponse('This is a performance summary.'))
  })

  it('returns a string', async () => {
    const entries = [{ id: '1', content: 'Completed Q1 launch', created_at: '2026-05-27' }]
    const summary = await generateSummary(entries, '2026-05 to 2026-06')
    expect(typeof summary).toBe('string')
    expect(summary.length).toBeGreaterThan(0)
  })

  it('handles multiple entries', async () => {
    const entries = [
      { id: '1', content: 'Task A', created_at: '2026-05-20' },
      { id: '2', content: 'Task B', created_at: '2026-05-25' },
    ]
    const summary = await generateSummary(entries, '2026-05 to 2026-06')
    expect(summary).toBeDefined()
  })

  it('accepts optional user instructions', async () => {
    const entries = [{ id: '1', content: 'Optimized API', created_at: '2026-05-27' }]
    await generateSummary(entries, '2026-05 to 2026-06', 'Focus on technical achievements')
    const callArg = mockCreate.mock.calls[0][0]
    const content = callArg.messages[0].content as string
    expect(content).toContain('Focus on technical achievements')
  })

  it('truncates long entry content to 2000 chars', async () => {
    const entries = [{ id: '1', content: 'y'.repeat(3000), created_at: '2026-05-27' }]
    await generateSummary(entries, '2026-05 to 2026-06')
    const callArg = mockCreate.mock.calls[0][0]
    const content = callArg.messages[0].content as string
    // Should not contain 3000 y's
    expect(content).not.toContain('y'.repeat(2001))
  })

  it('includes goals context when provided', async () => {
    const goals = {
      evaluationGoals: [{ title: 'Deliver project X', status: 'completed' }],
      personalGoals: [],
    }
    const entries = [{ id: '1', content: 'Delivered project X', created_at: '2026-05-27' }]
    await generateSummary(entries, '2026-05 to 2026-06', undefined, goals)
    const callArg = mockCreate.mock.calls[0][0]
    expect(callArg.system).toContain('goals')
  })

  it('returns fallback string when content block is not text', async () => {
    mockCreate.mockResolvedValueOnce({ content: [{ type: 'image', source: {} }] })
    const entries = [{ id: '1', content: 'Work done', created_at: '2026-05-27' }]
    const summary = await generateSummary(entries, '2026-05 to 2026-06')
    expect(summary).toContain('Unable to generate')
  })
})
