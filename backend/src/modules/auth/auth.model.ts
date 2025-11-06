import { getDatabase } from '../../config/database'
import { generateId } from '../../config/schema'

export type ThemePreference = 'light' | 'dark' | 'blue' | 'green'

export interface IUser {
  id: string
  email: string
  passwordHash: string
  themePreference?: ThemePreference | null
  aiProvider?: string | null
  aiModel?: string | null
  aiApiKey?: string | null
  lastLoginAt?: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface IUserDocument extends IUser {
  toJSON(): Omit<IUser, 'passwordHash'>
}

/**
 * Convert database row to User object
 */
function rowToUser(row: any): IUserDocument {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.passwordHash,
    themePreference: row.themePreference || null,
    aiProvider: row.aiProvider || null,
    aiModel: row.aiModel || null,
    aiApiKey: row.aiApiKey || null,
    lastLoginAt: row.lastLoginAt ? new Date(row.lastLoginAt) : null,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
    toJSON() {
      const { passwordHash, aiApiKey, ...user } = this // Don't expose password or API key
      return user
    },
  }
}

export const User = {
  async findOne(query: { email?: string; id?: string }): Promise<IUserDocument | null> {
    const db = getDatabase()
    let row: any

    if (query.email) {
      row = db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(query.email)
    } else if (query.id) {
      row = db.prepare('SELECT * FROM users WHERE id = ?').get(query.id)
    } else {
      return null
    }

    return row ? rowToUser(row) : null
  },

  async findById(id: string): Promise<IUserDocument | null> {
    return User.findOne({ id })
  },

  async create(data: {
    email: string
    passwordHash: string
    themePreference?: ThemePreference | null
  }): Promise<IUserDocument> {
    const db = getDatabase()
    const id = generateId()
    const now = new Date().toISOString()

    db.prepare(`
      INSERT INTO users (id, email, passwordHash, themePreference, aiProvider, aiModel, aiApiKey, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      data.email.toLowerCase(),
      data.passwordHash,
      data.themePreference || null,
      null, // aiProvider
      null, // aiModel
      null, // aiApiKey
      now,
      now
    )

    const user = await User.findById(id)
    if (!user) {
      throw new Error('Failed to create user')
    }

    return user
  },

  async update(id: string, updates: {
    lastLoginAt?: Date | null
    themePreference?: ThemePreference | null
    aiProvider?: string | null
    aiModel?: string | null
    aiApiKey?: string | null
  }): Promise<IUserDocument> {
    const db = getDatabase()
    const now = new Date().toISOString()

    const setParts: string[] = []
    const values: any[] = []

    if (typeof updates.lastLoginAt !== 'undefined') {
      setParts.push('lastLoginAt = ?')
      values.push(updates.lastLoginAt ? updates.lastLoginAt.toISOString() : null)
    }

    if (typeof updates.themePreference !== 'undefined') {
      setParts.push('themePreference = ?')
      values.push(updates.themePreference || null)
    }

    if (typeof updates.aiProvider !== 'undefined') {
      setParts.push('aiProvider = ?')
      values.push(updates.aiProvider || null)
    }

    if (typeof updates.aiModel !== 'undefined') {
      setParts.push('aiModel = ?')
      values.push(updates.aiModel || null)
    }

    if (typeof updates.aiApiKey !== 'undefined') {
      setParts.push('aiApiKey = ?')
      values.push(updates.aiApiKey || null)
    }

    if (setParts.length === 0) {
      const existing = await User.findById(id)
      if (!existing) {
        throw new Error('User not found')
      }
      return existing
    }

    setParts.push('updatedAt = ?')
    values.push(now)
    values.push(id)

    db.prepare(`
      UPDATE users
      SET ${setParts.join(', ')}
      WHERE id = ?
    `).run(...values)

    const updated = await User.findById(id)
    if (!updated) {
      throw new Error('User not found after update')
    }

    return updated
  },
}

export default User
