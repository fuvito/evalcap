import Anthropic from '@anthropic-ai/sdk'

// Server-side only — API key never exposed to client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export interface JournalEntry {
  id: string
  content: string
  created_at: string
  prompt_used?: string | null
}

/**
 * Generate smart follow-up prompts based on previous journal entries.
 * The AI reads past entries and asks contextual, personalized questions.
 */
export async function generateSmartPrompts(
  previousEntries: JournalEntry[],
  checkInType: 'daily' | 'weekly'
): Promise<string[]> {
  const context = previousEntries
    .slice(-5) // Last 5 entries for context
    .map(e => `[${e.created_at}]: ${e.content}`)
    .join('\n')

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    system: `You are a helpful assistant that generates smart, personalized journal prompts for performance tracking. 
Your goal is to help individual contributors capture their achievements, progress, and plans.
Generate prompts that are:
- Specific and follow up on previous entries when relevant
- Focused on achievements, impact, and professional growth
- Honest and grounded — not leading toward exaggeration
- Concise and easy to answer
Return exactly 3 prompts as a JSON array of strings. No other text.`,
    messages: [
      {
        role: 'user',
        content: `Generate ${checkInType} check-in prompts for this person based on their recent journal entries:\n\n${context || 'No previous entries — this is their first check-in.'}`,
      },
    ],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : '[]'

  try {
    const clean = text.replace(/```json|```/g, '').trim()
    return JSON.parse(clean)
  } catch {
    return [
      'What did you accomplish since your last check-in?',
      'What are you currently working on?',
      'Any blockers or challenges you want to note?',
    ]
  }
}

/**
 * Generate a performance review summary from journal entries.
 * Compiles and rewrites clearly — no exaggeration, honest and grounded.
 */
export async function generateSummary(
  entries: JournalEntry[],
  timeframe: string,
  userInstructions?: string
): Promise<string> {
  const journalContent = entries
    .map(e => `[${e.created_at}]: ${e.content}`)
    .join('\n\n')

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1500,
    system: `You are a professional writing assistant helping individual contributors prepare for performance reviews.
Your job is to compile and rewrite their journal entries into a clear, honest performance summary.

CRITICAL RULES:
- Do NOT exaggerate or inflate achievements
- Do NOT add accomplishments that aren't in the entries
- DO rewrite in clear, professional language
- DO highlight real impact and contributions
- DO organize logically (achievements, projects, growth)
- Keep it factual, grounded, and credible
- Write in first person`,
    messages: [
      {
        role: 'user',
        content: `Create a performance review summary for the timeframe: ${timeframe}

${userInstructions ? `Additional instructions: ${userInstructions}\n\n` : ''}Journal entries:
${journalContent}`,
      },
    ],
  })

  return message.content[0].type === 'text'
    ? message.content[0].text
    : 'Unable to generate summary. Please try again.'
}
