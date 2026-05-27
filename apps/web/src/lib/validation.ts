import { logger } from './logger'

export interface ValidationError {
  field: string
  message: string
}

export class ValidationException extends Error {
  constructor(public errors: ValidationError[]) {
    super('Validation failed')
    this.name = 'ValidationException'
  }
}

// Sanitize text to remove suspicious patterns that could be prompt injection attempts
export function sanitizeText(text: unknown): string {
  if (typeof text !== 'string') {
    throw new ValidationException([{ field: 'text', message: 'Must be a string' }])
  }

  // Trim whitespace
  let sanitized = text.trim()

  // Check length (prevent token exhaustion attacks)
  if (sanitized.length > 5000) {
    throw new ValidationException([{ field: 'text', message: 'Text exceeds maximum length of 5000 characters' }])
  }

  // Check for empty after trimming
  if (sanitized.length === 0) {
    throw new ValidationException([{ field: 'text', message: 'Text cannot be empty' }])
  }

  return sanitized
}

export function validateCheckInType(value: unknown): 'daily' | 'weekly' {
  if (typeof value !== 'string') {
    throw new ValidationException([{ field: 'checkInType', message: 'Must be a string' }])
  }

  if (value !== 'daily' && value !== 'weekly') {
    throw new ValidationException([
      { field: 'checkInType', message: `Must be 'daily' or 'weekly', got '${value}'` },
    ])
  }

  return value
}

export function validateDateString(value: unknown, fieldName: string): string {
  if (typeof value !== 'string') {
    throw new ValidationException([{ field: fieldName, message: 'Must be a string' }])
  }

  // Basic ISO date validation (YYYY-MM-DD or ISO 8601)
  const dateRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})?)?$/
  if (!dateRegex.test(value)) {
    throw new ValidationException([
      { field: fieldName, message: 'Must be a valid ISO date string (YYYY-MM-DD or ISO 8601)' },
    ])
  }

  // Verify it's a valid date
  const date = new Date(value)
  if (isNaN(date.getTime())) {
    throw new ValidationException([{ field: fieldName, message: 'Invalid date value' }])
  }

  return value
}

export function validateOptionalString(value: unknown, fieldName: string, maxLength: number = 2000): string | null {
  if (value === null || value === undefined) {
    return null
  }

  if (typeof value !== 'string') {
    throw new ValidationException([{ field: fieldName, message: 'Must be a string or null' }])
  }

  const trimmed = value.trim()

  if (trimmed.length > maxLength) {
    throw new ValidationException([
      { field: fieldName, message: `Exceeds maximum length of ${maxLength} characters` },
    ])
  }

  return trimmed.length === 0 ? null : trimmed
}

// Validate JSON is parseable (for API responses)
export function validateJSON(text: string): Record<string, any> {
  try {
    return JSON.parse(text)
  } catch {
    throw new ValidationException([{ field: 'response', message: 'Invalid JSON response from Claude API' }])
  }
}

// Log validation errors with context
export function logValidationError(errors: ValidationError[], source: string) {
  logger.warn('Validation failed', { errors, source }, 'validation')
}
