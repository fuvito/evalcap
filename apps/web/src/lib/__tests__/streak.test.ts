import { calculateStreak } from '../streak'

// Fixed "today" for all tests: 2026-05-29 (Friday, ISO week 22)
const TODAY = new Date('2026-05-29T12:00:00Z')

// Helper to build ISO date strings
function date(y: number, m: number, d: number) {
  return new Date(Date.UTC(y, m - 1, d)).toISOString()
}

describe('calculateStreak', () => {
  it('returns 0 streak and false checkedInThisWeek for empty entries', () => {
    expect(calculateStreak([], TODAY)).toEqual({ streak: 0, checkedInThisWeek: false })
  })

  it('returns streak=1 and checkedInThisWeek=true for a single entry this week', () => {
    const result = calculateStreak([date(2026, 5, 27)], TODAY) // Mon of week 22
    expect(result).toEqual({ streak: 1, checkedInThisWeek: true })
  })

  it('returns streak=1 and checkedInThisWeek=false for a single entry last week', () => {
    const result = calculateStreak([date(2026, 5, 20)], TODAY) // week 21
    expect(result).toEqual({ streak: 1, checkedInThisWeek: false })
  })

  it('returns streak=0 and checkedInThisWeek=false for entry two weeks ago (gap)', () => {
    const result = calculateStreak([date(2026, 5, 13)], TODAY) // week 20
    expect(result).toEqual({ streak: 0, checkedInThisWeek: false })
  })

  it('counts consecutive weeks including current week', () => {
    const entries = [
      date(2026, 5, 29), // week 22 (this week)
      date(2026, 5, 20), // week 21
      date(2026, 5, 13), // week 20
    ]
    expect(calculateStreak(entries, TODAY)).toEqual({ streak: 3, checkedInThisWeek: true })
  })

  it('counts consecutive weeks not including current week', () => {
    const entries = [
      date(2026, 5, 20), // week 21 (last week)
      date(2026, 5, 13), // week 20
      date(2026, 5, 6),  // week 19
    ]
    expect(calculateStreak(entries, TODAY)).toEqual({ streak: 3, checkedInThisWeek: false })
  })

  it('stops counting at a gap in weeks', () => {
    const entries = [
      date(2026, 5, 29), // week 22 (this week)
      date(2026, 5, 20), // week 21
      // week 20 missing — gap
      date(2026, 5, 6),  // week 19
      date(2026, 4, 29), // week 18
    ]
    expect(calculateStreak(entries, TODAY)).toEqual({ streak: 2, checkedInThisWeek: true })
  })

  it('deduplicates multiple entries in the same week', () => {
    const entries = [
      date(2026, 5, 27), // week 22, Mon
      date(2026, 5, 28), // week 22, Tue
      date(2026, 5, 29), // week 22, Fri
      date(2026, 5, 20), // week 21
    ]
    expect(calculateStreak(entries, TODAY)).toEqual({ streak: 2, checkedInThisWeek: true })
  })

  it('handles entries spanning a year boundary', () => {
    const yearEnd = new Date('2025-12-31T12:00:00Z') // Wed, ISO week 1 of 2026
    const entries = [
      date(2025, 12, 31), // week 1 of 2026
      date(2025, 12, 24), // week 52 of 2025
      date(2025, 12, 17), // week 51 of 2025
    ]
    expect(calculateStreak(entries, yearEnd)).toEqual({ streak: 3, checkedInThisWeek: true })
  })
})
