import {
  sanitizeText,
  validateCheckInType,
  validateDateString,
  validateJSON,
  validateOptionalString,
  ValidationException,
} from '../validation'

describe('validation', () => {
  describe('sanitizeText', () => {
    it('returns trimmed string', () => {
      expect(sanitizeText('  hello  ')).toBe('hello')
    })

    it('accepts normal text', () => {
      expect(sanitizeText('Completed the Q1 launch')).toBe('Completed the Q1 launch')
    })

    it('rejects non-string', () => {
      expect(() => sanitizeText(123)).toThrow(ValidationException)
    })

    it('rejects empty string after trimming', () => {
      expect(() => sanitizeText('   ')).toThrow(ValidationException)
    })

    it('rejects string longer than 5000 characters', () => {
      expect(() => sanitizeText('a'.repeat(5001))).toThrow(ValidationException)
    })

    it('accepts exactly 5000 characters', () => {
      const result = sanitizeText('a'.repeat(5000))
      expect(result.length).toBe(5000)
    })
  })

  describe('validateJSON', () => {
    it('parses valid JSON object', () => {
      const result = validateJSON('{"key": "value"}')
      expect(result).toEqual({ key: 'value' })
    })

    it('parses valid JSON array', () => {
      const result = validateJSON('["a", "b"]')
      expect(result).toEqual(['a', 'b'])
    })

    it('throws ValidationException on invalid JSON', () => {
      expect(() => validateJSON('not json')).toThrow(ValidationException)
    })

    it('throws ValidationException on malformed JSON', () => {
      expect(() => validateJSON('{key: value}')).toThrow(ValidationException)
    })
  })

  describe('validateCheckInType', () => {
    it('accepts "daily"', () => {
      expect(validateCheckInType('daily')).toBe('daily')
    })

    it('accepts "weekly"', () => {
      expect(validateCheckInType('weekly')).toBe('weekly')
    })

    it('rejects invalid type', () => {
      expect(() => validateCheckInType('monthly')).toThrow(ValidationException)
    })

    it('rejects non-string', () => {
      expect(() => validateCheckInType(123)).toThrow(ValidationException)
    })

    it('rejects null', () => {
      expect(() => validateCheckInType(null)).toThrow(ValidationException)
    })
  })

  describe('validateDateString', () => {
    it('accepts valid ISO date', () => {
      const result = validateDateString('2026-05-27', 'date')
      expect(result).toBe('2026-05-27')
    })

    it('accepts ISO 8601 datetime', () => {
      const result = validateDateString('2026-05-27T10:30:00Z', 'date')
      expect(result).toBe('2026-05-27T10:30:00Z')
    })

    it('rejects invalid date format', () => {
      expect(() => validateDateString('05/27/2026', 'date')).toThrow(ValidationException)
    })

    it('rejects non-string', () => {
      expect(() => validateDateString(20260527, 'date')).toThrow(ValidationException)
    })

    it('rejects invalid date value', () => {
      expect(() => validateDateString('2026-13-01', 'date')).toThrow(ValidationException)
    })
  })

  describe('validateOptionalString', () => {
    it('accepts valid string', () => {
      const result = validateOptionalString('hello', 'name')
      expect(result).toBe('hello')
    })

    it('accepts null', () => {
      const result = validateOptionalString(null, 'name')
      expect(result).toBeNull()
    })

    it('accepts empty string as null', () => {
      const result = validateOptionalString('   ', 'name')
      expect(result).toBeNull()
    })

    it('rejects string exceeding max length', () => {
      const longString = 'a'.repeat(3000)
      expect(() => validateOptionalString(longString, 'name', 2000)).toThrow(ValidationException)
    })

    it('rejects non-string (not null)', () => {
      expect(() => validateOptionalString(123, 'name')).toThrow(ValidationException)
    })
  })
})
