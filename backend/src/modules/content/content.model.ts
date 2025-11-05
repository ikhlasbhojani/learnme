import { getDatabase } from '../../config/database'
import { generateId } from '../../config/schema'

export type ContentInputType = 'url' | 'file' | 'manual'

export interface IContentInput {
  id: string
  userId: string
  type: ContentInputType
  source: string
  content?: string | null
  timestamp?: Date
  createdAt: Date
  updatedAt: Date
}

export interface IContentInputDocument extends IContentInput {
  toJSON(): IContentInput & { id: string; contentInputId?: never }
}

/**
 * Convert database row to ContentInput object
 */
function rowToContentInput(row: any): IContentInputDocument {
  return {
    id: row.id,
    userId: row.userId,
    type: row.type as ContentInputType,
    source: row.source,
    content: row.content || null,
    timestamp: row.timestamp ? new Date(row.timestamp) : undefined,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
    toJSON() {
      return {
        id: this.id,
        userId: this.userId,
        type: this.type,
        source: this.source,
        content: this.content,
        timestamp: this.timestamp,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
      }
    },
  }
}

export const ContentInput = {
  async find(query: { userId?: string; id?: string }): Promise<IContentInputDocument[]> {
    const db = getDatabase()
    let rows: any[]

    if (query.userId) {
      rows = db.prepare('SELECT * FROM content_inputs WHERE userId = ? ORDER BY createdAt DESC').all(query.userId)
    } else if (query.id) {
      const row = db.prepare('SELECT * FROM content_inputs WHERE id = ?').get(query.id)
      rows = row ? [row] : []
    } else {
      rows = db.prepare('SELECT * FROM content_inputs ORDER BY createdAt DESC').all()
    }

    return rows.map(rowToContentInput)
  },

  async findOne(query: { userId?: string; id?: string }): Promise<IContentInputDocument | null> {
    const db = getDatabase()
    let row: any

    if (query.id && query.userId) {
      row = db.prepare('SELECT * FROM content_inputs WHERE id = ? AND userId = ?').get(query.id, query.userId)
    } else if (query.id) {
      row = db.prepare('SELECT * FROM content_inputs WHERE id = ?').get(query.id)
    } else {
      return null
    }

    return row ? rowToContentInput(row) : null
  },

  async create(data: {
    userId: string
    type: ContentInputType
    source: string
    content?: string | null
  }): Promise<IContentInputDocument> {
    const db = getDatabase()
    const id = generateId()
    const now = new Date().toISOString()
    const timestamp = new Date().toISOString()

    db.prepare(`
      INSERT INTO content_inputs (id, userId, type, source, content, timestamp, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      data.userId,
      data.type,
      data.source,
      data.content || null,
      timestamp,
      now,
      now
    )

    const contentInput = await ContentInput.findOne({ id })
    if (!contentInput) {
      throw new Error('Failed to create content input')
    }

    return contentInput
  },

  async update(id: string, userId: string, updates: {
    source?: string
    content?: string | null
  }): Promise<IContentInputDocument> {
    const db = getDatabase()
    const now = new Date().toISOString()

    const setParts: string[] = []
    const values: any[] = []

    if (typeof updates.source !== 'undefined') {
      setParts.push('source = ?')
      values.push(updates.source)
    }

    if (typeof updates.content !== 'undefined') {
      setParts.push('content = ?')
      values.push(updates.content || null)
    }

    if (setParts.length === 0) {
      const existing = await ContentInput.findOne({ id, userId })
      if (!existing) {
        throw new Error('Content input not found')
      }
      return existing
    }

    setParts.push('updatedAt = ?')
    values.push(now)
    values.push(id, userId)

    db.prepare(`
      UPDATE content_inputs
      SET ${setParts.join(', ')}
      WHERE id = ? AND userId = ?
    `).run(...values)

    const updated = await ContentInput.findOne({ id, userId })
    if (!updated) {
      throw new Error('Content input not found after update')
    }

    return updated
  },

  async deleteOne(id: string, userId: string): Promise<boolean> {
    const db = getDatabase()
    const result = db.prepare('DELETE FROM content_inputs WHERE id = ? AND userId = ?').run(id, userId)
    return result.changes > 0
  },
}

export default ContentInput
