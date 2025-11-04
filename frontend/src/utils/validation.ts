// Validation utility functions

/**
 * Email validation using RFC 5322 basic pattern
 */
export function validateEmail(email: string): boolean {
  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
  return emailRegex.test(email.trim())
}

/**
 * Password validation: minimum 8 characters, at least one letter and one number
 */
export function validatePassword(password: string): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters')
  }

  if (!/[a-zA-Z]/.test(password)) {
    errors.push('Password must contain at least one letter')
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * URL validation using URL constructor
 */
export function validateURL(urlString: string): boolean {
  try {
    new URL(urlString)
    return true
  } catch {
    return false
  }
}

/**
 * File type validation (PDF, DOC, TXT)
 */
export function validateFileType(file: File): boolean {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ]
  const allowedExtensions = ['.pdf', '.doc', '.docx', '.txt']

  // Check MIME type
  if (allowedTypes.includes(file.type)) {
    return true
  }

  // Fallback: check file extension
  const fileName = file.name.toLowerCase()
  return allowedExtensions.some((ext) => fileName.endsWith(ext))
}

/**
 * File size validation (max 5MB)
 */
export function validateFileSize(file: File, maxSizeMB: number = 5): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  return file.size <= maxSizeBytes
}

/**
 * Validate quiz configuration
 */
export function validateQuizConfiguration(config: {
  difficulty?: string
  numberOfQuestions?: number
  timeDuration?: number
}): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!config.difficulty) {
    errors.push('Difficulty level is required')
  } else if (!['Easy', 'Normal', 'Hard', 'Master'].includes(config.difficulty)) {
    errors.push('Invalid difficulty level')
  }

  if (config.numberOfQuestions === undefined || config.numberOfQuestions === null) {
    errors.push('Number of questions is required')
  } else if (config.numberOfQuestions <= 0 || !Number.isInteger(config.numberOfQuestions)) {
    errors.push('Number of questions must be a positive integer')
  }

  if (config.timeDuration === undefined || config.timeDuration === null) {
    errors.push('Time duration is required')
  } else if (config.timeDuration <= 0 || !Number.isFinite(config.timeDuration)) {
    errors.push('Time duration must be a positive number')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
