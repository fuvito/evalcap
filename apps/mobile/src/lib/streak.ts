function isoWeekKey(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
  const year = d.getUTCFullYear()
  const jan1 = new Date(Date.UTC(year, 0, 1))
  const week = Math.ceil(((d.getTime() - jan1.getTime()) / 86_400_000 + 1) / 7)
  return `${year}-${String(week).padStart(2, '0')}`
}

function subWeeks(date: Date, n: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() - n * 7)
  return d
}

export interface StreakResult {
  streak: number
  checkedInThisWeek: boolean
}

export function calculateStreak(entryDates: string[], today = new Date()): StreakResult {
  if (entryDates.length === 0) return { streak: 0, checkedInThisWeek: false }

  const weekSet = new Set(entryDates.map(d => isoWeekKey(new Date(d))))
  const checkedInThisWeek = weekSet.has(isoWeekKey(today))

  let streak = 0
  let cursor = checkedInThisWeek ? today : subWeeks(today, 1)

  while (weekSet.has(isoWeekKey(cursor))) {
    streak++
    cursor = subWeeks(cursor, 1)
  }

  return { streak, checkedInThisWeek }
}
