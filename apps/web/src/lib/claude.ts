import Anthropic from '@anthropic-ai/sdk'
import { logger } from './logger'

if (!process.env.ANTHROPIC_API_KEY) {
  logger.error('ANTHROPIC_API_KEY is not set — all Claude calls will fail', undefined, 'claude')
}

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

export interface GoalContext {
  evaluationGoals: { title: string; status: string }[]
  personalGoals: { title: string; category: string | null; priority: string }[]
}

function formatGoalsContext(goals: GoalContext): string {
  const lines: string[] = []
  const activeEval = goals.evaluationGoals.filter(g => g.status !== 'cancelled')
  const activePersonal = goals.personalGoals.filter(g => g.status !== 'cancelled' && g.priority !== undefined)

  if (activeEval.length > 0) {
    lines.push('Evaluation goals:')
    activeEval.forEach(g => lines.push(`- "${g.title}" [${g.status.replace('_', ' ')}]`))
  }
  if (activePersonal.length > 0) {
    lines.push('Personal goals:')
    activePersonal.forEach(g => lines.push(`- "${g.title}"${g.category ? ` (${g.category})` : ''} [${g.priority} priority]`))
  }

  return lines.join('\n')
}

export async function generateSmartPrompts(
  previousEntries: JournalEntry[],
  checkInType: 'daily' | 'weekly',
  goals?: GoalContext
): Promise<string[]> {
  const context = previousEntries
    .slice(-5)
    .map(e => {
      const truncatedContent = e.content.substring(0, 1000)
      return `[${e.created_at}]: ${truncatedContent}`
    })
    .join('\n')

  const goalsContext = goals ? formatGoalsContext(goals) : ''

  logger.info(`Generating ${checkInType} prompts`, { entryCount: previousEntries.length }, 'claude')

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1000,
    system: `You are a helpful assistant that generates smart, personalized journal prompts for performance tracking.
Your goal is to help individual contributors capture their achievements, progress, and plans.
Generate prompts that are:
- Specific and follow up on previous entries when relevant
- Focused on achievements, impact, and professional growth
- Honest and grounded — not leading toward exaggeration
- Concise and easy to answer
${goalsContext ? '- When relevant, reference the person\'s stated goals to prompt reflection on progress' : ''}
Return exactly 3 prompts as a JSON array of strings. No other text.`,
    messages: [
      {
        role: 'user',
        content: `Generate ${checkInType} check-in prompts for this person.

${goalsContext ? `Their current goals:\n${goalsContext}\n\n` : ''}Recent journal entries:
${context || 'No previous entries — this is their first check-in.'}`,
      },
    ],
  })

  logger.debug('Prompts response received', undefined, 'claude')

  const text = message.content[0].type === 'text' ? message.content[0].text : '[]'

  try {
    const clean = text.replace(/```json|```/g, '').trim()
    return JSON.parse(clean)
  } catch {
    logger.warn('Failed to parse Claude prompts JSON, using fallback', { text }, 'claude')
    return [
      'What did you accomplish since your last check-in?',
      'What are you currently working on?',
      'Any blockers or challenges you want to note?',
    ]
  }
}

export async function generateSummary(
  entries: JournalEntry[],
  timeframe: string,
  userInstructions?: string,
  goals?: GoalContext
): Promise<string> {
  const journalContent = entries
    .map(e => {
      const truncatedContent = e.content.substring(0, 2000)
      return `[${e.created_at}]: ${truncatedContent}`
    })
    .join('\n\n')

  const sanitizedInstructions = userInstructions ? userInstructions.substring(0, 500) : undefined
  const goalsContext = goals ? formatGoalsContext(goals) : ''

  logger.info('Generating performance summary', { entryCount: entries.length, timeframe }, 'claude')

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
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
- Write in first person
${goalsContext ? '- Where the journal entries show progress against stated goals, include that naturally in the summary' : ''}`,
    messages: [
      {
        role: 'user',
        content: `Create a performance review summary for the timeframe: ${timeframe}

${goalsContext ? `Goals for this period:\n${goalsContext}\n\n` : ''}${sanitizedInstructions ? `Additional instructions: ${sanitizedInstructions}\n\n` : ''}Journal entries:
${journalContent}`,
      },
    ],
  })

  logger.debug('Summary response received', undefined, 'claude')

  return message.content[0].type === 'text'
    ? message.content[0].text
    : 'Unable to generate summary. Please try again.'
}
