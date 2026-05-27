import { generateSmartPrompts, generateSummary } from '../claude'

// Mock the Anthropic SDK
jest.mock('@anthropic-ai/sdk', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      messages: {
        create: jest.fn().mockResolvedValue({
          content: [
            {
              type: 'text',
              text: JSON.stringify([
                'What did you accomplish since your last check-in?',
                'What are you currently working on?',
                'Any blockers or challenges?',
              ]),
            },
          ],
        }),
      },
    })),
  }
})

describe('Claude functions', () => {
  describe('generateSmartPrompts', () => {
    it('returns array of 3 prompts', async () => {
      const prompts = await generateSmartPrompts([], 'daily')
      expect(Array.isArray(prompts)).toBe(true)
      expect(prompts.length).toBe(3)
    })

    it('handles empty entries', async () => {
      const prompts = await generateSmartPrompts([], 'weekly')
      expect(prompts.length).toBe(3)
    })

    it('truncates long entries', async () => {
      const longContent = 'x'.repeat(2000)
      const entries = [
        {
          id: '1',
          content: longContent,
          created_at: '2026-05-27',
        },
      ]

      const prompts = await generateSmartPrompts(entries, 'daily')
      expect(prompts.length).toBe(3)
    })

    it('returns prompts for daily check-in', async () => {
      const prompts = await generateSmartPrompts([], 'daily')
      expect(prompts.length).toBe(3)
    })

    it('returns prompts for weekly check-in', async () => {
      const prompts = await generateSmartPrompts([], 'weekly')
      expect(prompts.length).toBe(3)
    })
  })

  describe('generateSummary', () => {
    it('returns non-empty string', async () => {
      const entries = [
        {
          id: '1',
          content: 'Completed the Q1 launch',
          created_at: '2026-05-27',
        },
      ]

      const summary = await generateSummary(entries, '2026-05 to 2026-06')
      expect(typeof summary).toBe('string')
      expect(summary.length).toBeGreaterThan(0)
    })

    it('handles multiple entries', async () => {
      const entries = [
        { id: '1', content: 'Did task A', created_at: '2026-05-20' },
        { id: '2', content: 'Did task B', created_at: '2026-05-25' },
        { id: '3', content: 'Did task C', created_at: '2026-05-27' },
      ]

      const summary = await generateSummary(entries, '2026-05 to 2026-06')
      expect(summary).toBeDefined()
    })

    it('accepts user instructions', async () => {
      const entries = [
        {
          id: '1',
          content: 'Worked on performance optimization',
          created_at: '2026-05-27',
        },
      ]

      const summary = await generateSummary(entries, '2026-05 to 2026-06', 'Focus on technical achievements')
      expect(summary).toBeDefined()
    })

    it('truncates long entries', async () => {
      const longContent = 'x'.repeat(3000)
      const entries = [
        {
          id: '1',
          content: longContent,
          created_at: '2026-05-27',
        },
      ]

      const summary = await generateSummary(entries, '2026-05 to 2026-06')
      expect(summary).toBeDefined()
    })
  })
})
